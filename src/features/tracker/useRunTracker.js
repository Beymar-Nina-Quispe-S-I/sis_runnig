import { useEffect, useRef, useState } from 'react'

const initialRun = {
  status: 'idle',
  distance: 0,
  elapsed: 0,
  elevation: 0,
  points: [],
  location: null,
  startedAt: null,
  error: '',
}

function distanceBetween(first, second) {
  const radians = Math.PI / 180
  const latitudeDelta = (second.latitude - first.latitude) * radians
  const longitudeDelta = (second.longitude - first.longitude) * radians
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(first.latitude * radians) * Math.cos(second.latitude * radians) * Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export default function useRunTracker(settings) {
  const [run, setRun] = useState(initialRun)
  const watchId = useRef(null)
  const lastPoint = useRef(null)
  const lastMoveAt = useRef(0)
  const settingsRef = useRef(settings)
  const wakeLock = useRef(null)
  const autoPaused = useRef(false)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    if (run.status !== 'running') return undefined
    const timer = window.setInterval(() => {
      if (settingsRef.current.autoPause && Date.now() - lastMoveAt.current > 12000 && run.points.length > 0) {
        autoPaused.current = true
        setRun((current) => ({ ...current, status: 'paused' }))
        return
      }
      setRun((current) => current.status === 'running' ? { ...current, elapsed: current.elapsed + 1 } : current)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [run.points.length, run.status])

  useEffect(() => {
    if (!settings.keepAwake || run.status === 'idle' || !('wakeLock' in navigator)) return undefined
    let active = true
    navigator.wakeLock.request('screen').then((lock) => {
      if (active) wakeLock.current = lock
      else lock.release()
    }).catch((error) => {
      console.warn('No se pudo mantener la pantalla encendida:', error)
    })
    return () => {
      active = false
      if (wakeLock.current) {
        wakeLock.current.release()
        wakeLock.current = null
      }
    }
  }, [settings.keepAwake, run.status])

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
    if (wakeLock.current) wakeLock.current.release()
  }, [])

  function onPosition(position) {
    const { latitude, longitude, accuracy, altitude } = position.coords
    const currentPoint = { latitude, longitude, altitude: altitude ?? null, timestamp: position.timestamp }
    if (accuracy > 50) {
      setRun((current) => ({ ...current, error: 'Señal GPS débil. Esperando una ubicación más precisa…' }))
      return
    }

    const previousPoint = lastPoint.current
    const meters = previousPoint ? distanceBetween(previousPoint, currentPoint) : 0
    const moved = meters >= 3 && meters < 150
    const elevationGain = moved && typeof altitude === 'number' && typeof previousPoint?.altitude === 'number'
      ? altitude - previousPoint.altitude
      : 0

    if (!previousPoint || moved || meters >= 150) {
      lastPoint.current = currentPoint
    }
    if (!previousPoint || moved) {
      lastMoveAt.current = Date.now()
    }

    setRun((current) => {
      const next = { ...current, location: { latitude, longitude }, error: '' }
      if (!previousPoint) {
        next.points = [...current.points, currentPoint]
        next.startedAt = current.startedAt || new Date().toISOString()
        next.status = 'running'
      } else if (moved) {
        const isTracking = current.status === 'running'
        const isAutoResume = current.status === 'paused' && autoPaused.current && settingsRef.current.autoPause
        if (isTracking || isAutoResume) {
          next.distance += meters
          next.points = [...current.points, currentPoint]
          if (elevationGain > 1.5 && elevationGain < 50) next.elevation += elevationGain
        }
        if (isAutoResume) next.status = 'running'
      }
      return next
    })
  }

  function start() {
    if (!('geolocation' in navigator)) {
      setRun((current) => ({ ...current, error: 'Este navegador no permite obtener la ubicación GPS.' }))
      return Promise.resolve(false)
    }
    if (!window.isSecureContext) {
      setRun((current) => ({ ...current, error: 'El GPS requiere HTTPS o localhost para funcionar.' }))
      return Promise.resolve(false)
    }

    setRun({ ...initialRun, status: 'locating' })
    lastPoint.current = null
    lastMoveAt.current = Date.now()
    autoPaused.current = false
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition((position) => {
        onPosition(position)
        watchId.current = navigator.geolocation.watchPosition(onPosition, (error) => {
          setRun((current) => ({ ...current, error: error.message || 'No se pudo actualizar la ubicación GPS.' }))
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 })
        resolve(true)
      }, (error) => {
        const message = error.code === 1
          ? 'Activa el permiso de ubicación en tu navegador para registrar la carrera.'
          : error.code === 3
            ? 'La ubicación tardó demasiado. Comprueba el GPS e inténtalo otra vez.'
            : 'No se pudo obtener tu ubicación. Comprueba que el GPS esté activo.'
        setRun({ ...initialRun, error: message })
        resolve(false)
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 })
    })
  }

  function pause() {
    autoPaused.current = false
    setRun((current) => ({ ...current, status: 'paused' }))
  }

  function resume() {
    if (run.status === 'idle') return
    lastMoveAt.current = Date.now()
    autoPaused.current = false
    setRun((current) => ({ ...current, status: 'running' }))
  }

  function finish() {
    const completed = run
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setRun(initialRun)
    lastPoint.current = null
    autoPaused.current = false
    if (!completed.startedAt) return null
    return { ...completed, finishedAt: new Date().toISOString(), sport: settingsRef.current.sport }
  }

  return { ...run, start, pause, resume, finish }
}

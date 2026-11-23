import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import './ActivityDialog.css'

export default function ActivityDialog({ onClose, onStart, activities }) {
  const [videoMode, setVideoMode] = useState(false)
  const [locationMode, setLocationMode] = useState(false)
  const [selectedId, setSelectedId] = useState(activities[activities.length - 1]?.id || '')
  const [videoState, setVideoState] = useState('')

  async function exportVideo() {
    const activity = activities.find((item) => item.id === selectedId)
    if (!activity) return
    try {
      setVideoState('Creando tu video…')
      await createRouteVideo(activity)
      setVideoState('Video descargado correctamente.')
    } catch (error) {
      setVideoState(error.message)
    }
  }

  if (videoMode) {
    return (
      <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <section className="dialog-card activity-dialog" role="dialog" aria-modal="true" aria-labelledby="video-title">
          <button className="dialog-close" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={18} /></button>
          <span className="dialog-symbol video-symbol"><Icon name="video" size={22} /></span>
          <div className="eyebrow"><span className="eyebrow-line" /> RECUERDOS EN MOVIMIENTO</div>
          <h2 id="video-title">Tu ruta, en video.</h2>
          <p className="dialog-description">Elige una carrera y crea un video corto para descargar.</p>
          <label className="video-select-label" htmlFor="video-activity">Actividad</label>
          <select id="video-activity" className="setting-select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{activities.slice().reverse().map((activity) => <option key={activity.id} value={activity.id}>{activity.name} · {(activity.distance / 1000).toFixed(2)} km</option>)}</select>
          <button className="primary-button video-create" onClick={exportVideo} disabled={videoState === 'Creando tu video…'}><Icon name="video" size={16} />{videoState === 'Creando tu video…' ? 'Creando video…' : 'Crear y descargar video'}</button>
          {videoState && <p className={`video-status ${videoState.includes('correctamente') ? 'success' : ''}`} role="status">{videoState}</p>}
          <button className="video-back" onClick={() => { setVideoMode(false); setVideoState('') }}><Icon name="chevron" size={14} /> Volver</button>
          <p className="privacy-note"><Icon name="target" size={14} /><span>El video se crea en este dispositivo.<br />Se descargará como archivo WebM.</span></p>
        </section>
      </div>
    )
  }

  if (locationMode) {
    return (
      <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <section className="dialog-card activity-dialog" role="dialog" aria-modal="true" aria-labelledby="location-title">
          <button className="dialog-close" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={18} /></button>
          <span className="dialog-symbol location-symbol"><Icon name="locate" size={22} /></span>
          <div className="eyebrow"><span className="eyebrow-line" /> PREPARA TU CARRERA</div>
          <h2 id="location-title">Prepara tu<br />actividad.</h2>
          <p className="dialog-description">La actividad no comenzará todavía. En el mapa tendrás un botón para iniciarla cuando estés listo.</p>
          <div className="location-tip"><Icon name="target" size={17} /><span>El permiso GPS se solicitará cuando pulses Iniciar. Tus datos se guardan solo en este dispositivo.</span></div>
          <button className="primary-button location-start" onClick={onStart}><Icon name="map" size={17} /> Abrir vista de actividad</button>
          <button className="video-back" onClick={() => setLocationMode(false)}><Icon name="chevron" size={14} /> Volver</button>
        </section>
      </div>
    )
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog-card activity-dialog" role="dialog" aria-modal="true" aria-labelledby="activity-title">
        <button className="dialog-close" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={18} /></button>
        <span className="dialog-symbol"><Icon name="pulse" size={23} /></span>
        <div className="eyebrow"><span className="eyebrow-line" /> A TU MANERA</div>
        <h2 id="activity-title">¿Qué te apetece<br />hacer hoy?</h2>
        <p className="dialog-description">Tu siguiente paso te está esperando.</p>
        <button className="activity-choice" onClick={() => setLocationMode(true)}><span className="choice-icon run-choice"><Icon name="route" size={19} /></span><span><strong>Registrar actividad</strong><small>Usar GPS para guardar tu carrera</small></span><Icon name="chevron" size={17} /></button>
        <button className="activity-choice" onClick={() => setVideoMode(true)} disabled={!activities.length}><span className="choice-icon video-choice"><Icon name="video" size={19} /></span><span><strong>Convertir actividad en video</strong><small>{activities.length ? 'Crea un video corto de tu recorrido' : 'Guarda primero tu primera actividad'}</small></span><Icon name="chevron" size={17} /></button>
        <div className="privacy-note"><Icon name="target" size={14} /><span>Tu ubicación y tus recorridos se guardan<br />solo en este dispositivo.</span></div>
      </section>
    </div>
  )
}

function createRouteVideo(activity) {
  if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) {
    return Promise.reject(new Error('Este navegador no permite crear videos. Prueba con la versión más reciente de Chrome o Edge.'))
  }
  if (!activity.points || activity.points.length < 2) {
    return Promise.reject(new Error('Esta actividad no tiene suficientes puntos GPS para crear el video.'))
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('No se pudo preparar el lienzo del video.'))

  const latitudes = activity.points.map((point) => point.latitude)
  const longitudes = activity.points.map((point) => point.longitude)
  const centerLatitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2
  const centerLongitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2
  const spread = Math.max(
    (Math.max(...latitudes) - Math.min(...latitudes)) * Math.cos(centerLatitude * Math.PI / 180),
    Math.max(...longitudes) - Math.min(...longitudes),
    0.00001,
  )
  const routePoints = activity.points.map((point) => ({
    x: 180 + ((point.longitude - centerLongitude) * Math.cos(centerLatitude * Math.PI / 180) / spread + .5) * 720,
    y: 180 + (-(point.latitude - centerLatitude) / spread + .5) * 720,
  }))
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks = []
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
  return new Promise((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Ocurrió un error al grabar el video. Inténtalo otra vez.'))
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      const video = document.createElement('a')
      video.href = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
      video.download = `ritmo-${new Date(activity.startedAt).toISOString().slice(0, 10)}.webm`
      video.click()
      window.setTimeout(() => URL.revokeObjectURL(video.href), 1000)
      resolve()
    }

    recorder.start()
    const started = performance.now()
    function drawFrame(now) {
      const progress = Math.min((now - started) / 4000, 1)
      const gradient = context.createLinearGradient(0, 0, 1080, 1080)
      gradient.addColorStop(0, '#101f2a')
      gradient.addColorStop(1, '#172d3a')
      context.fillStyle = gradient
      context.fillRect(0, 0, 1080, 1080)
      context.strokeStyle = 'rgba(144, 193, 212, .1)'
      context.lineWidth = 2
      for (let x = 70; x < 1080; x += 60) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 1080); context.stroke() }
      for (let y = 70; y < 1080; y += 60) { context.beginPath(); context.moveTo(0, y); context.lineTo(1080, y); context.stroke() }
      context.fillStyle = '#73e6ff'
      context.font = '700 32px Segoe UI'
      context.fillText('RITMO  ·  RUN CLUB', 86, 100)
      context.fillStyle = '#f1f7fa'
      context.font = '700 52px Segoe UI'
      context.fillText(activity.name, 86, 190)
      const drawn = Math.max(2, Math.ceil(routePoints.length * progress))
      context.beginPath()
      context.moveTo(routePoints[0].x, routePoints[0].y)
      routePoints.slice(1, drawn).forEach((point) => context.lineTo(point.x, point.y))
      context.strokeStyle = 'rgba(115, 230, 255, .18)'
      context.lineWidth = 24
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.stroke()
      context.strokeStyle = '#73e6ff'
      context.lineWidth = 10
      context.stroke()
      const current = routePoints[drawn - 1]
      context.beginPath()
      context.arc(current.x, current.y, 19, 0, Math.PI * 2)
      context.fillStyle = '#73e6ff'
      context.fill()
      context.beginPath()
      context.arc(current.x, current.y, 7, 0, Math.PI * 2)
      context.fillStyle = '#10212d'
      context.fill()
      context.fillStyle = '#edf5f8'
      context.font = '700 74px Segoe UI'
      context.fillText(`${(activity.distance / 1000).toFixed(2)} km`, 86, 930)
      context.fillStyle = '#9db1be'
      context.font = '400 32px Segoe UI'
      context.fillText(`Tiempo  ${formatDuration(activity.elapsed)}     Desnivel  ${Math.round(activity.elevation)} m`, 86, 990)
      if (progress < 1) requestAnimationFrame(drawFrame)
      else recorder.stop()
    }
    requestAnimationFrame(drawFrame)
  })
}

function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, '0')).join(':')
}

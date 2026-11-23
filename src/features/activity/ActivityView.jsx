import { useEffect } from 'react'
import MapCanvas from '../map/MapCanvas.jsx'
import Icon from '../../components/Icon.jsx'
import './ActivityView.css'

function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, '0')).join(':')
}

function formatClock(value) {
  return value ? new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'
}

export default function ActivityView({ tracker, settings, location, onLocate, onStart, onPause, onResume, onFinish, onBack, onSettings }) {
  const currentPoint = tracker.points[tracker.points.length - 1] || null
  const active = tracker.status === 'running' || tracker.status === 'paused' || tracker.status === 'locating'

  useEffect(() => {
    if (!active) return undefined
    function warnBeforeLeaving(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [active])

  return (
    <main className="activity-screen">
      <MapCanvas
        points={tracker.points}
        location={tracker.location || location}
        startPoint={tracker.points[0]}
        color={settings.routeColor}
        mapStyle={settings.mapStyle}
        onLocate={onLocate}
        tracking={active}
        activityMode
      />
      <header className="activity-screen-top">
        <button className="activity-back" aria-label="Volver al panel" onClick={onBack}><Icon name="chevron" size={18} /></button>
        <div><strong>{settings.sport}</strong><span>{tracker.status === 'paused' ? 'Pausada' : tracker.status === 'locating' ? 'Buscando GPS…' : tracker.status === 'running' ? 'Grabando recorrido' : 'Lista para iniciar'}</span></div>
        <button className="activity-settings" aria-label="Ajustes de actividad" onClick={onSettings}><Icon name="settings" size={18} /></button>
      </header>

      <section className="activity-live-panel" aria-label="Datos de actividad">
        <div className="live-distance"><span>DISTANCIA</span><strong>{(tracker.distance / 1000).toFixed(2)}<small> km</small></strong></div>
        <div className="live-metrics">
          <div><span>TIEMPO</span><strong>{formatDuration(tracker.elapsed)}</strong></div>
          <div><span>DESNIVEL +</span><strong>{Math.round(tracker.elevation)} <small>m</small></strong></div>
          <div><span>RITMO</span><strong>{tracker.distance ? `${Math.floor(tracker.elapsed / (tracker.distance / 1000) / 60)}′${String(Math.floor(tracker.elapsed / (tracker.distance / 1000)) % 60).padStart(2, '0')}″` : '—'} <small>/km</small></strong></div>
        </div>
        <div className="live-endpoints">
          <span><i className="endpoint-start">I</i> {tracker.startedAt ? `Inicio ${formatClock(tracker.startedAt)}` : 'Aún no iniciada'}</span>
          <span><i className="endpoint-current"><Icon name="locate" size={11} /></i> {currentPoint ? `GPS actual ${formatClock(currentPoint.timestamp)}` : location ? 'Ubicación lista' : 'GPS sin iniciar'}</span>
        </div>
        {tracker.error && <p className="activity-gps-error" role="alert">{tracker.error}</p>}
        {tracker.status === 'idle' ? (
          <button className="live-start-button" onClick={onStart}><Icon name="play" size={17} /> Iniciar actividad</button>
        ) : tracker.status === 'locating' ? (
          <button className="live-start-button" disabled><Icon name="target" size={17} /> Esperando señal GPS…</button>
        ) : (
          <div className="activity-live-controls">
            <button className="live-pause-button" onClick={tracker.status === 'paused' ? onResume : onPause}>
              <Icon name={tracker.status === 'paused' ? 'play' : 'pause'} size={17} />{tracker.status === 'paused' ? 'Continuar' : 'Pausar'}
            </button>
            <button className="live-finish-button" onClick={onFinish}><Icon name="stop" size={17} /> Finalizar</button>
          </div>
        )}
        <p className="live-accuracy"><Icon name="target" size={13} /> {active ? 'GPS de alta precisión · Tus datos se guardan en este dispositivo' : 'Pulsa Iniciar cuando estés listo; el GPS aún no está grabando'}</p>
      </section>
    </main>
  )
}

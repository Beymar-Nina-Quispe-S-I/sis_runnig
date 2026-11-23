import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import './ActivityDialog.css'

function formatDate(value) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function SaveActivityDialog({ activity, onSave, onDiscard }) {
  const [name, setName] = useState(activity.name)

  return (
    <div className="dialog-backdrop">
      <section className="dialog-card save-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="save-activity-title">
        <span className="dialog-symbol"><Icon name="check" size={23} /></span>
        <div className="eyebrow"><span className="eyebrow-line" /> ACTIVIDAD FINALIZADA</div>
        <h2 id="save-activity-title">Buen trabajo.</h2>
        <p className="dialog-description">Guarda tu recorrido para encontrarlo después en Recorridos.</p>

        <label className="video-select-label" htmlFor="activity-name">Nombre del recorrido</label>
        <input id="activity-name" className="activity-name-input" maxLength={70} value={name} onChange={(event) => setName(event.target.value)} />

        <div className="save-activity-summary">
          <div><span>DISTANCIA</span><strong>{(activity.distance / 1000).toFixed(2)} km</strong></div>
          <div><span>TIEMPO</span><strong>{formatDuration(activity.elapsed)}</strong></div>
          <div><span>DESNIVEL +</span><strong>{Math.round(activity.elevation)} m</strong></div>
        </div>
        <p className="save-activity-times">Inicio {formatDate(activity.startedAt)} · Final {new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(activity.finishedAt))}</p>
        <button className="primary-button save-activity-button" onClick={() => onSave(name.trim() || activity.name)}><Icon name="check" size={16} /> Guardar recorrido</button>
        <button className="discard-activity-button" onClick={onDiscard}>Descartar actividad</button>
      </section>
    </div>
  )
}

function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, '0')).join(':')
}

import Icon from '../../components/Icon.jsx'
import './SettingsDialog.css'

const routeColors = ['#73e6ff', '#a8f07a', '#ffad72', '#c4a0ff', '#ff83aa']

export default function SettingsDialog({ settings, onSave, onClose }) {
  function update(key, value) {
    onSave({ ...settings, [key]: value })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog-card settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="dialog-close" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={18} /></button>
        <div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZA TU SALIDA</div>
        <h2 id="settings-title">Ajustes</h2>
        <p className="dialog-description">Prepara la app para correr contigo.</p>

        <label className="setting-label" htmlFor="sport-select">Tipo de actividad</label>
        <select id="sport-select" className="setting-select" value={settings.sport} onChange={(event) => update('sport', event.target.value)}>
          <option>Atletismo</option><option>Trail running</option><option>Caminata</option>
        </select>

        <div className="setting-row"><div><strong>Auto-pausa</strong><small>Pausa el tiempo cuando te detienes</small></div><button className={`toggle ${settings.autoPause ? 'on' : ''}`} role="switch" aria-checked={settings.autoPause} aria-label="Auto-pausa" onClick={() => update('autoPause', !settings.autoPause)}><span /></button></div>
        <div className="setting-row"><div><strong>Mantener pantalla encendida</strong><small>Evita que la pantalla se apague al correr</small></div><button className={`toggle ${settings.keepAwake ? 'on' : ''}`} role="switch" aria-checked={settings.keepAwake} aria-label="Mantener pantalla encendida" onClick={() => update('keepAwake', !settings.keepAwake)}><span /></button></div>

        <div className="setting-label">Color de recorrido</div>
        <div className="color-options" role="radiogroup" aria-label="Color de recorrido">{routeColors.map((color) => <button key={color} className={`color-option ${settings.routeColor === color ? 'selected' : ''}`} style={{ '--swatch': color }} role="radio" aria-checked={settings.routeColor === color} aria-label={`Color ${color}`} onClick={() => update('routeColor', color)}>{settings.routeColor === color && <Icon name="check" size={13} />}</button>)}</div>

        <div className="setting-label">Apariencia</div>
        <div className="theme-options"><button className={settings.theme === 'dark' ? 'selected' : ''} onClick={() => update('theme', 'dark')}><Icon name="moon" size={16} /> Oscuro</button><button className={settings.theme === 'light' ? 'selected' : ''} onClick={() => update('theme', 'light')}><Icon name="sunMode" size={16} /> Claro</button></div>
        <button className="primary-button settings-done" onClick={onClose}>Listo</button>
      </section>
    </div>
  )
}

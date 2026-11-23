import { useMemo, useState } from 'react'
import Icon from './components/Icon.jsx'
import MapCanvas from './features/map/MapCanvas.jsx'
import ActivityDialog from './features/activity/ActivityDialog.jsx'
import ActivityView from './features/activity/ActivityView.jsx'
import SaveActivityDialog from './features/activity/SaveActivityDialog.jsx'
import SettingsDialog from './features/settings/SettingsDialog.jsx'
import useRunTracker from './features/tracker/useRunTracker.js'
import { readActivities, saveActivity } from './features/tracker/activityStore.js'
import './App.css'

const navigation = [
  { id: 'map', label: 'Mapa', icon: 'map' },
  { id: 'routes', label: 'Recorridos', icon: 'route' },
  { id: 'stats', label: 'Estadísticas', icon: 'chart' },
  { id: 'challenges', label: 'Retos', icon: 'trophy' },
]

const initialSettings = {
  autoPause: true,
  keepAwake: false,
  sport: 'Atletismo',
  routeColor: '#73e6ff',
  mapStyle: 'openstreetmap',
  theme: 'dark',
}

function readSettings() {
  const saved = localStorage.getItem('ritmo-settings')
  return saved ? { ...initialSettings, ...JSON.parse(saved) } : initialSettings
}

function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, '0')).join(':')
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function formatClock(value) {
  return value ? new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'
}

function currentWeekStart() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function App() {
  const [activePage, setActivePage] = useState('map')
  const [dialog, setDialog] = useState('')
  const [pendingActivity, setPendingActivity] = useState(null)
  const [settings, setSettings] = useState(readSettings)
  const [activities, setActivities] = useState(readActivities)
  const [homeLocation, setHomeLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const tracker = useRunTracker(settings)

  const weeklyDistance = useMemo(() => {
    const weekStart = currentWeekStart()
    return activities
      .filter((activity) => new Date(activity.startedAt) >= weekStart)
      .reduce((total, activity) => total + activity.distance, 0) / 1000
  }, [activities])

  function updateSettings(nextSettings) {
    setSettings(nextSettings)
    localStorage.setItem('ritmo-settings', JSON.stringify(nextSettings))
  }

  function finishActivity() {
    const activity = tracker.finish()
    if (activity) {
      setPendingActivity({ ...activity, id: crypto.randomUUID(), name: `Carrera · ${formatDate(activity.startedAt)}` })
      setDialog('save')
    }
  }

  function savePendingActivity(name) {
    if (!pendingActivity) return
    const saved = { ...pendingActivity, name }
    saveActivity(saved)
    setActivities(readActivities())
    setPendingActivity(null)
    setDialog('')
    setActivePage('routes')
  }

  function discardPendingActivity() {
    if (!window.confirm('¿Descartar esta actividad? El recorrido no se guardará.')) return
    setPendingActivity(null)
    setDialog('')
    setActivePage('routes')
  }

  function locateHome() {
    if (!navigator.geolocation) {
      setLocationError('Este navegador no permite obtener la ubicación GPS.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setHomeLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setLocationError('')
      },
      (error) => {
        setLocationError(error.code === 1
          ? 'Activa el permiso de ubicación para centrar el mapa.'
          : 'No se pudo obtener tu ubicación. Comprueba el GPS e inténtalo otra vez.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  }

  function openActivityView() {
    setDialog('')
    setActivePage('activity')
  }

  function requestActivityExit() {
    if (tracker.status === 'locating') {
      tracker.cancel()
      setActivePage('map')
      return
    }
    if (tracker.status === 'running' || tracker.status === 'paused') {
      setDialog('leave-activity')
      return
    }
    setActivePage('map')
  }

  if (activePage === 'activity') {
    return (
      <div className={`app-shell theme-${settings.theme}`}>
        <ActivityView
          tracker={tracker}
          settings={settings}
          location={homeLocation}
          onLocate={locateHome}
          onStart={tracker.start}
          onPause={tracker.pause}
          onResume={tracker.resume}
          onFinish={finishActivity}
          onBack={requestActivityExit}
          onSettings={() => setDialog('settings')}
        />
        {dialog === 'save' && pendingActivity && <SaveActivityDialog activity={pendingActivity} onSave={savePendingActivity} onDiscard={discardPendingActivity} />}
        {dialog === 'leave-activity' && <LeaveActivityDialog onStay={() => setDialog('')} onFinish={finishActivity} />}
        {dialog === 'settings' && <SettingsDialog settings={settings} onSave={updateSettings} onClose={() => setDialog('')} />}
      </div>
    )
  }

  return (
    <div className={`app-shell theme-${settings.theme}`}>
      <aside className="sidebar">
        <a className="brand" href="#map" onClick={(event) => { event.preventDefault(); setActivePage('map') }}>
          <span className="brand-mark"><Icon name="pulse" size={23} /></span>
          <span>ritmo<span className="brand-period">.</span><small>RUN CLUB</small></span>
        </a>

        <div className="side-label">MENÚ PRINCIPAL</div>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => setActivePage(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === 'routes' && activities.length > 0 && <span className="nav-count">{activities.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="weekly-card">
          <div className="weekly-card-top"><span>ESTA SEMANA</span><Icon name="trending" size={16} /></div>
          <strong>{weeklyDistance.toFixed(1)} <small>km</small></strong>
          <div className="weekly-progress"><span style={{ width: `${Math.min(weeklyDistance / 30 * 100, 100)}%` }} /></div>
          <p>de tu objetivo de 30 km</p>
        </div>
        <button className="profile-button" onClick={() => setDialog('settings')}>
          <span className="avatar">B</span>
          <span className="profile-copy"><strong>Mi perfil</strong><small>Atleta amateur</small></span>
          <Icon name="chevron" size={16} />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Entrenamiento</span><Icon name="chevron" size={14} /><strong>{navigation.find((item) => item.id === activePage)?.label}</strong></div>
          <div className="topbar-actions">
            <span className="offline-indicator"><i /> Disponible sin conexión</span>
            <button className="icon-button settings-button" aria-label="Abrir ajustes" onClick={() => setDialog('settings')}><Icon name="settings" size={19} /></button>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'map' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> TU ESPACIO DE ENTRENAMIENTO</div>
                  <h1>Corre a tu <span>ritmo.</span></h1>
                  <p className="page-subtitle">Cada paso cuenta. Sal ahí fuera y hazlo tuyo.</p>
                </div>
                <button className="primary-button start-button" disabled={tracker.status === 'locating'} onClick={() => tracker.status === 'idle' ? setDialog('activity') : setActivePage('activity')}>
                  <Icon name={tracker.status === 'idle' ? 'play' : 'route'} size={17} /> {tracker.status === 'idle' ? 'Iniciar carrera' : tracker.status === 'paused' ? 'Volver a carrera' : tracker.status === 'locating' ? 'Buscando GPS…' : 'Volver a carrera'}
                </button>
              </section>

              <section className="training-layout">
                <div className="map-card">
                  <div className="map-card-top">
                    <div className="map-heading"><span className={`live-dot ${tracker.status !== 'running' ? 'muted' : ''}`} /><div><strong>{tracker.status === 'running' ? 'Actividad en curso' : 'Tu zona de entrenamiento'}</strong><small>{tracker.location ? 'Ubicación GPS conectada' : 'Mapa listo para tu próxima salida'}</small></div></div>
                    <button className="map-action" aria-label="Ajustes de actividad" onClick={() => setDialog('settings')}><Icon name="settings" size={17} /></button>
                  </div>
                  <MapCanvas
                    location={tracker.location || homeLocation}
                    color={settings.routeColor}
                    mapStyle={settings.mapStyle}
                    onLocate={locateHome}
                  />
                  <div className="map-legend"><span><i className="legend-dot" /> Tu ubicación</span><span><i className="legend-route" style={{ backgroundColor: settings.routeColor }} /> Tu recorrido</span><span className="map-coordinate">{(tracker.location || homeLocation) ? `${(tracker.location || homeLocation).latitude.toFixed(4)}°, ${(tracker.location || homeLocation).longitude.toFixed(4)}°` : 'Ubicación no centrada'}</span></div>
                  {locationError && <p className="map-location-error" role="alert">{locationError}</p>}
                </div>

                <aside className="run-panel">
                  <div className="run-panel-header"><span>RESUMEN DE CARRERA</span><button aria-label="Ajustes" onClick={() => setDialog('settings')}><Icon name="more" size={19} /></button></div>
                  <div className="main-metric"><span>DISTANCIA</span><strong>{(tracker.distance / 1000).toFixed(2)}<small> km</small></strong><div className="metric-rule" /></div>
                  <div className="run-stats">
                    <div className="run-stat"><span className="stat-icon"><Icon name="clock" size={16} /></span><div><small>TIEMPO</small><strong>{formatDuration(tracker.elapsed)}</strong><small className="run-start-time">Inicio {formatClock(tracker.startedAt)}</small></div></div>
                    <div className="run-stat"><span className="stat-icon"><Icon name="mountain" size={16} /></span><div><small>DESNIVEL +</small><strong>{Math.round(tracker.elevation)} <em>m</em></strong></div></div>
                    <div className="run-stat"><span className="stat-icon"><Icon name="gauge" size={16} /></span><div><small>RITMO MEDIO</small><strong>{tracker.distance ? `${Math.floor(tracker.elapsed / (tracker.distance / 1000) / 60)}′${String(Math.floor(tracker.elapsed / (tracker.distance / 1000)) % 60).padStart(2, '0')}″` : '—'} <em>/km</em></strong></div></div>
                    <div className="run-stat"><span className="stat-icon"><Icon name="flag" size={16} /></span><div><small>DEPORTE</small><strong>{settings.sport}</strong></div></div>
                  </div>
                  {tracker.error && <p className="tracker-error" role="alert">{tracker.error}</p>}
                  {tracker.status === 'running' || tracker.status === 'paused' ? (
                    <div className="run-controls">
                      <button className="pause-button" onClick={tracker.status === 'running' ? tracker.pause : tracker.resume}><Icon name={tracker.status === 'running' ? 'pause' : 'play'} size={16} />{tracker.status === 'running' ? 'Pausar' : 'Continuar'}</button>
                      <button className="finish-button" onClick={finishActivity}><Icon name="stop" size={16} />Finalizar</button>
                    </div>
                  ) : (
                    <button className="panel-start" disabled={tracker.status === 'locating'} onClick={() => setDialog('activity')}><Icon name={tracker.status === 'locating' ? 'target' : 'play'} size={15} />{tracker.status === 'locating' ? 'Buscando señal GPS…' : 'Empezar a correr'}</button>
                  )}
                  <p className="gps-note"><Icon name="target" size={14} /> GPS de alta precisión activado</p>
                </aside>
              </section>

              <section className="bottom-grid">
                <article className="insight-card">
                  <div className="insight-copy"><span className="card-kicker">TU PROGRESO</span><h2>Un paso más<br />cada semana.</h2><p>Tu constancia construye grandes historias.</p><button className="text-link" onClick={() => setActivePage('stats')}>Ver estadísticas <Icon name="arrow" size={14} /></button></div>
                  <div className="mini-chart" aria-label="Actividad semanal"><div className="chart-bars">{[36, 58, 42, 76, 51, 92, 63].map((height, index) => <span key={index} className={index === 5 ? 'highlight' : ''} style={{ height: `${height}%` }} />)}</div><div className="chart-days"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div></div>
                </article>
                <article className="goal-card"><div className="goal-icon"><Icon name="trophy" size={20} /></div><div className="goal-info"><span className="card-kicker">RETO DE LA SEMANA</span><strong>Primeros 30 km</strong><p>{weeklyDistance.toFixed(1)} de 30 km completados</p><div className="goal-progress"><span style={{ width: `${Math.min(weeklyDistance / 30 * 100, 100)}%` }} /></div></div><button className="goal-arrow" aria-label="Ver retos" onClick={() => setActivePage('challenges')}><Icon name="arrow" size={16} /></button></article>
              </section>
            </>
          )}

          {activePage === 'routes' && <RoutesPage activities={activities} settings={settings} onStart={() => setDialog('activity')} />}
          {activePage === 'stats' && <StatsPage activities={activities} weeklyDistance={weeklyDistance} />}
          {activePage === 'challenges' && <ChallengesPage weeklyDistance={weeklyDistance} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Navegación">
        {navigation.map((item) => <button key={item.id} className={activePage === item.id ? 'active' : ''} onClick={() => setActivePage(item.id)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}
      </nav>

      {dialog === 'activity' && <ActivityDialog onClose={() => setDialog('')} onStart={openActivityView} activities={activities} />}
      {dialog === 'settings' && <SettingsDialog settings={settings} onSave={updateSettings} onClose={() => setDialog('')} />}
      {dialog === 'save' && pendingActivity && <SaveActivityDialog activity={pendingActivity} onSave={savePendingActivity} onDiscard={discardPendingActivity} />}
    </div>
  )
}

function RoutesPage({ activities, settings, onStart }) {
  const [selectedActivity, setSelectedActivity] = useState(null)

  if (selectedActivity) {
    const firstPoint = selectedActivity.points?.[0]
    const finalPoint = selectedActivity.points?.[selectedActivity.points.length - 1]
    return (
      <section className="subpage">
        <div className="subpage-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> RECORRIDO GUARDADO</div>
            <h1>{selectedActivity.name}</h1>
            <p className="page-subtitle">{formatDate(selectedActivity.startedAt)} · {formatClock(selectedActivity.startedAt)}–{formatClock(selectedActivity.finishedAt)}</p>
          </div>
          <button className="primary-button route-back-button" onClick={() => setSelectedActivity(null)}><Icon name="chevron" size={16} /> Volver</button>
        </div>
        <div className="saved-route-card">
          <MapCanvas
            points={selectedActivity.points || []}
            startPoint={firstPoint}
            endPoint={finalPoint}
            location={null}
            color={settings.routeColor}
            mapStyle={settings.mapStyle}
          />
          <div className="saved-route-summary">
            <div><span>DISTANCIA</span><strong>{(selectedActivity.distance / 1000).toFixed(2)} km</strong></div>
            <div><span>TIEMPO</span><strong>{formatDuration(selectedActivity.elapsed)}</strong></div>
            <div><span>DESNIVEL +</span><strong>{Math.round(selectedActivity.elevation)} m</strong></div>
            <div className="saved-route-pins"><span><i className="endpoint-start">I</i> Inicio</span><span><i className="endpoint-finish">F</i> Final</span></div>
          </div>
        </div>
        {!selectedActivity.points?.length && <p className="map-location-error">Esta actividad se guardó sin puntos GPS, por lo que no se puede mostrar su trazado.</p>}
      </section>
    )
  }

  return (
    <section className="subpage">
      <div className="subpage-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> TU HISTORIAL</div><h1>Mis <span>recorridos.</span></h1><p className="page-subtitle">Todos tus pasos, guardados en este dispositivo.</p></div><button className="primary-button" onClick={onStart}><Icon name="play" size={16} /> Nueva carrera</button></div>
      {activities.length ? <div className="activity-list">{activities.slice().reverse().map((activity) => <button className="activity-row activity-row-button" key={activity.id} onClick={() => setSelectedActivity(activity)}><span className="activity-route-icon"><Icon name="route" size={19} /></span><span className="activity-name"><strong>{activity.name}</strong><small>{formatDate(activity.startedAt)} · {formatClock(activity.startedAt)}–{formatClock(activity.finishedAt)} · {activity.sport || 'Atletismo'}</small></span><span className="activity-value"><strong>{(activity.distance / 1000).toFixed(2)} km</strong><small>{formatDuration(activity.elapsed)}</small></span><span className="activity-value elevation-value"><strong>{Math.round(activity.elevation)} m</strong><small>desnivel +</small></span><Icon className="activity-row-arrow" name="chevron" size={16} /></button>)}</div> : <EmptyState icon="route" title="Tu próxima historia empieza aquí" text="Cuando termines una carrera, aparecerá guardada aquí." />}
    </section>
  )
}

function StatsPage({ activities, weeklyDistance }) {
  const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0) / 1000
  const totalTime = activities.reduce((sum, activity) => sum + activity.elapsed, 0)
  return (
    <section className="subpage">
      <div className="subpage-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CADA KM CUENTA</div><h1>Tus <span>estadísticas.</span></h1><p className="page-subtitle">Mira todo lo que ya has conseguido.</p></div></div>
      <div className="stats-summary"><MetricCard label="DISTANCIA TOTAL" value={`${totalDistance.toFixed(2)}`} unit="km" icon="route" /><MetricCard label="CARRERAS" value={String(activities.length)} unit="salidas" icon="pulse" /><MetricCard label="TIEMPO EN MOVIMIENTO" value={formatDuration(totalTime)} unit="" icon="clock" /><MetricCard label="ESTA SEMANA" value={weeklyDistance.toFixed(1)} unit="km" icon="trending" /></div>
      <article className="stats-panel"><div className="section-title"><div><span className="card-kicker">ACTIVIDAD RECIENTE</span><h2>Tu camino hasta hoy</h2></div><span className="period-tag">Todo el tiempo</span></div>{activities.length ? <div className="activity-list">{activities.slice().reverse().slice(0, 5).map((activity) => <div className="activity-row" key={activity.id}><div className="activity-route-icon"><Icon name="route" size={18} /></div><div className="activity-name"><strong>{activity.name}</strong><small>{formatDate(activity.startedAt)} · {formatClock(activity.startedAt)}–{formatClock(activity.finishedAt)}</small></div><div className="activity-value"><strong>{(activity.distance / 1000).toFixed(2)} km</strong><small>{formatDuration(activity.elapsed)}</small></div></div>)}</div> : <EmptyState icon="chart" title="Los datos vendrán con tus carreras" text="Empieza una carrera para ver cómo evolucionas." />}</article>
    </section>
  )
}

function MetricCard({ label, value, unit, icon }) {
  return <article className="metric-card"><span className="metric-card-icon"><Icon name={icon} size={18} /></span><span className="card-kicker">{label}</span><strong>{value}<small>{unit ? ` ${unit}` : ''}</small></strong></article>
}

function ChallengesPage({ weeklyDistance }) {
  const challenges = [
    { title: 'Primeros 30 km', detail: 'Corre 30 km esta semana', progress: weeklyDistance, target: 30, icon: 'trophy', color: 'cyan' },
    { title: 'Racha de 3 días', detail: 'Sal a correr en 3 días distintos', progress: 0, target: 3, icon: 'flame', color: 'violet' },
    { title: 'Amanecer activo', detail: 'Completa una carrera antes de las 8:00', progress: 0, target: 1, icon: 'sun', color: 'gold' },
  ]
  return <section className="subpage"><div className="subpage-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> SUPERA TUS LÍMITES</div><h1>Pequeños retos,<br /><span>grandes logros.</span></h1><p className="page-subtitle">Un nuevo objetivo es una nueva razón para salir.</p></div><div className="challenge-badge"><Icon name="sparkles" size={16} /> Temporada abierta</div></div><div className="challenge-grid">{challenges.map((challenge) => { const percent = Math.min(challenge.progress / challenge.target * 100, 100); return <article className={`challenge-card ${challenge.color}`} key={challenge.title}><div className="challenge-card-head"><span className="challenge-icon"><Icon name={challenge.icon} size={22} /></span><span className="challenge-live">EN CURSO</span></div><h2>{challenge.title}</h2><p>{challenge.detail}</p><div className="challenge-numbers"><strong>{challenge.progress.toFixed(challenge.target === 30 ? 1 : 0)} <small>{challenge.target === 30 ? 'km' : 'de'}</small></strong><span>Meta: {challenge.target}{challenge.target === 30 ? ' km' : ''}</span></div><div className="goal-progress"><span style={{ width: `${percent}%` }} /></div><div className="challenge-bottom"><span>{Math.round(percent)}% completado</span><Icon name="arrow" size={16} /></div></article> })}</div></section>
}

function EmptyState({ icon, title, text }) {
  return <div className="empty-state"><span><Icon name={icon} size={24} /></span><strong>{title}</strong><p>{text}</p></div>
}

function LeaveActivityDialog({ onStay, onFinish }) {
  return (
    <div className="dialog-backdrop">
      <section className="dialog-card leave-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-activity-title">
        <span className="dialog-symbol"><Icon name="pulse" size={23} /></span>
        <div className="eyebrow"><span className="eyebrow-line" /> ACTIVIDAD EN CURSO</div>
        <h2 id="leave-activity-title">Tu carrera sigue activa.</h2>
        <p className="dialog-description">Para proteger tu recorrido, no puedes salir sin decidir qué hacer.</p>
        <button className="primary-button save-activity-button" onClick={onStay}>Volver a la actividad</button>
        <button className="finish-and-save-button" onClick={onFinish}><Icon name="stop" size={15} /> Finalizar y guardar</button>
      </section>
    </div>
  )
}

export default App

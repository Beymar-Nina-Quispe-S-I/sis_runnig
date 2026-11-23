import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import '@tomickigrzegorz/leaflet-rotate'
import '@tomickigrzegorz/leaflet-rotate/css'
import 'leaflet/dist/leaflet.css'
import Icon from '../../components/Icon.jsx'
import './MapCanvas.css'

const stadiaKey = import.meta.env.VITE_STADIA_MAPS_API_KEY
const tileStyles = {
  openstreetmap: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  stadia: {
    url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaKey || ''}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  openmaptiles: {
    url: `https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png?api_key=${stadiaKey || ''}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
}

function makeMarker(label, kind) {
  return L.divIcon({
    className: 'run-marker-shell',
    html: `<span class="run-marker run-marker-${kind}">${label}</span>`,
    iconSize: [27, 27],
    iconAnchor: [13, 13],
  })
}

export default function MapCanvas({
  points = [],
  location = null,
  startPoint = points[0] || null,
  endPoint = null,
  color = '#73e6ff',
  mapStyle = 'openstreetmap',
  onLocate,
  tracking = false,
  activityMode = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileRef = useRef(null)
  const routeRef = useRef(null)
  const markersRef = useRef(null)
  const locationMarkerRef = useRef(null)
  const followRef = useRef(true)
  const lastFocusedLocation = useRef(null)
  const [tileError, setTileError] = useState(false)
  const [bearing, setBearing] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      rotate: true,
      touchRotate: true,
      dragRotate: true,
    })
    mapRef.current = map
    map.attributionControl.setPosition(activityMode ? 'topleft' : 'bottomright')
    markersRef.current = L.layerGroup().addTo(map)
    map.on('dragstart', () => { followRef.current = false })
    map.on('rotate', () => setBearing(map.getBearing()))

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      tileRef.current = null
      routeRef.current = null
      markersRef.current = null
      locationMarkerRef.current = null
    }
  }, [activityMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const provider = tileStyles[mapStyle] && (mapStyle === 'openstreetmap' || stadiaKey)
      ? mapStyle
      : 'openstreetmap'
    const style = tileStyles[provider]
    if (tileRef.current) map.removeLayer(tileRef.current)

    const tileLayer = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: 19,
      maxNativeZoom: provider === 'openstreetmap' ? 19 : 20,
      crossOrigin: true,
    })
    tileLayer.on('tileerror', () => setTileError(true))
    tileLayer.on('tileload', () => setTileError(false))
    tileLayer.addTo(map)
    tileRef.current = tileLayer
  }, [mapStyle])

  useEffect(() => {
    const map = mapRef.current
    const markerGroup = markersRef.current
    if (!map || !markerGroup) return

    if (routeRef.current) map.removeLayer(routeRef.current)
    markerGroup.clearLayers()

    const validPoints = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    if (validPoints.length > 1) {
      routeRef.current = L.polyline(validPoints.map((point) => [point.latitude, point.longitude]), {
        color,
        weight: 5,
        opacity: .94,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    }

    if (startPoint && Number.isFinite(startPoint.latitude) && Number.isFinite(startPoint.longitude)) {
      L.marker([startPoint.latitude, startPoint.longitude], { icon: makeMarker('I', 'start'), keyboard: true })
        .bindPopup(`<strong>Inicio</strong>${startPoint.timestamp ? `<br>${new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(startPoint.timestamp))}` : ''}`)
        .addTo(markerGroup)
    }

    if (endPoint && Number.isFinite(endPoint.latitude) && Number.isFinite(endPoint.longitude)) {
      L.marker([endPoint.latitude, endPoint.longitude], { icon: makeMarker('F', 'finish'), keyboard: true })
        .bindPopup(`<strong>Final</strong>${endPoint.timestamp ? `<br>${new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(endPoint.timestamp))}` : ''}`)
        .addTo(markerGroup)
    }

    if (validPoints.length > 1 && !tracking && !location) {
      map.fitBounds(L.latLngBounds(validPoints.map((point) => [point.latitude, point.longitude])).pad(.2), { maxZoom: 17 })
    }
  }, [color, endPoint, location, points, startPoint, tracking])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return

    const coordinates = [location.latitude, location.longitude]
    if (!locationMarkerRef.current) {
      locationMarkerRef.current = L.marker(coordinates, {
        icon: L.divIcon({
          className: 'current-location-shell',
          html: '<span class="current-location-dot"></span>',
          iconSize: [25, 25],
          iconAnchor: [12, 12],
        }),
        zIndexOffset: 1000,
        interactive: false,
      }).addTo(map)
    } else {
      locationMarkerRef.current.setLatLng(coordinates)
    }

    const firstFix = !lastFocusedLocation.current
    if (firstFix || (tracking && followRef.current)) {
      map.setView(coordinates, Math.max(map.getZoom(), 16), { animate: !firstFix, duration: .5 })
      lastFocusedLocation.current = location
    }
  }, [location, tracking])

  function locate() {
    if (location && mapRef.current) {
      followRef.current = true
      mapRef.current.setView([location.latitude, location.longitude], Math.max(mapRef.current.getZoom(), 16), { animate: true })
    }
    onLocate?.()
  }

  function rotateMap() {
    const map = mapRef.current
    if (map) map.setBearing((map.getBearing() + 45) % 360)
  }

  function resetNorth(event) {
    event.preventDefault()
    event.stopPropagation()
    mapRef.current?.setBearing(0)
  }

  return (
    <div className="map-viewport">
      <div className="leaflet-map" ref={containerRef} aria-label="Mapa real de OpenStreetMap con tu ubicación y recorrido" />
      <button
        className="map-compass"
        style={{ '--map-bearing': `${-bearing}deg` }}
        aria-label={`Girar mapa 45 grados; orientación actual ${Math.round(bearing)} grados. Doble clic para norte`}
        title="Pulsa para girar 45°. Doble clic para volver al norte."
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); rotateMap() }}
        onDoubleClick={resetNorth}
      >
        <span className="compass-n">N</span><span className="compass-ne">NE</span><span className="compass-e">E</span><span className="compass-se">SE</span>
        <span className="compass-s">S</span><span className="compass-sw">SO</span><span className="compass-w">O</span><span className="compass-nw">NO</span>
        <i className="compass-pointer" />
      </button>
      {tileError && <div className="map-tile-error" role="status">No se pudieron cargar algunos mosaicos. Comprueba tu conexión.</div>}
      <div className="map-zoom">
        <button aria-label="Acercar mapa" onClick={() => mapRef.current?.zoomIn()}><Icon name="plus" size={16} /></button>
        <button aria-label="Alejar mapa" onClick={() => mapRef.current?.zoomOut()}><Icon name="minus" size={16} /></button>
        <button aria-label="Centrar mapa en mi ubicación" onClick={locate}><Icon name="target" size={16} /></button>
      </div>
      {mapStyle !== 'openstreetmap' && !stadiaKey && <div className="map-provider-notice">Configura VITE_STADIA_MAPS_API_KEY para activar Stadia Maps y OpenMapTiles.</div>}
    </div>
  )
}

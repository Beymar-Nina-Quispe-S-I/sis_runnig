import { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import './MapCanvas.css'

const sampleRoute = 'M 105 316 C 142 288, 164 299, 181 264 S 216 236, 248 251 S 285 261, 296 220 S 321 188, 352 199 S 385 206, 405 167 S 449 143, 478 158'

export default function MapCanvas({ points, color }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef(null)
  const plottedPoints = points.length ? (() => {
    const referenceLatitude = points[0].latitude * Math.PI / 180
    const projected = points.map((point) => ({
      x: (point.longitude - points[0].longitude) * Math.cos(referenceLatitude),
      y: -(point.latitude - points[0].latitude),
    }))
    const minX = Math.min(...projected.map((point) => point.x))
    const maxX = Math.max(...projected.map((point) => point.x))
    const minY = Math.min(...projected.map((point) => point.y))
    const maxY = Math.max(...projected.map((point) => point.y))
    const width = Math.max(maxX - minX, 0.00001)
    const height = Math.max(maxY - minY, 0.00001)
    const scale = Math.min(430 / width, 240 / height)
    const centerX = projected[projected.length - 1].x
    const centerY = projected[projected.length - 1].y
    return projected.map((point) => ({
      x: 300 + (point.x - centerX) * scale,
      y: 195 + (point.y - centerY) * scale,
    }))
  })() : []
  const route = points.length
    ? plottedPoints.length > 1 ? plottedPoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ') : ''
    : sampleRoute
  const marker = plottedPoints[plottedPoints.length - 1] || { x: 300, y: 195 }

  function pointerDown(event) {
    drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event) {
    if (drag.current) setOffset({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y })
  }

  return (
    <div className="map-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      <svg className="map-art" viewBox="0 0 600 390" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa de recorridos movible">
        <defs>
          <pattern id="map-grid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M 52 0 L 0 0 0 52" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".14" /></pattern>
          <pattern id="park-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#70c9a5" opacity=".2" /></pattern>
        </defs>
        <g transform={`translate(${offset.x} ${offset.y})`}>
          <rect x="-500" y="-400" width="1600" height="1200" fill="url(#map-grid)" />
          <path d="M-30 65 116 104 246 82 390 120 628 85M-25 210 116 177 240 206 365 184 640 238M-25 349 124 318 264 352 403 314 636 358M67 -20 98 99 72 192 127 306 105 440M244 -20 211 81 264 206 235 350 280 450M425 -25 384 119 422 212 384 315 427 440M557 -15 515 104 556 209 520 328 566 430" fill="none" stroke="currentColor" strokeWidth="2" opacity=".14" />
          <path d="m-20 142 148-24 112 27 136-14 244 30M-10 278l130-25 140 30 134-28 218 34" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 7" opacity=".18" />
          <path d="M375 42c60-37 153-8 169 44 14 48-40 83-93 72-41-9-98-28-126-2-22 20-9 71 42 100 48 28 88 61 48 95-38 32-112 6-137-27-35-47-81-38-110-14-36 29-78 20-98-8-27-39-5-79 32-98 45-24 51-70 6-100-31-21-83-37-64-72 23-42 106-54 161-35 45 15 68 64 115 45z" fill="url(#park-dots)" stroke="#77c8a9" strokeWidth="1" opacity=".68" />
          <path d="M0 24 602 367M-4 378 600 14" stroke="currentColor" strokeWidth="5" opacity=".08" />
          <path d="M0 24 602 367M-4 378 600 14" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 8" opacity=".18" />
          <path d={route} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".22" transform="translate(0 3)" />
          <path d={route} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {points.length === 0 && <circle cx="105" cy="316" r="5" fill="#f2bc78" stroke="#1b2b35" strokeWidth="3" />}
          {points.length === 0 && <circle cx="478" cy="158" r="5" fill={color} stroke="#1b2b35" strokeWidth="3" />}
          <circle cx={marker.x} cy={marker.y} r="15" fill={color} opacity=".15" />
          <circle cx={marker.x} cy={marker.y} r="8" fill={color} stroke="#e9fbff" strokeWidth="2.5" />
          <circle cx={marker.x} cy={marker.y} r="2.5" fill="#143044" />
        </g>
      </svg>
      <div className="map-compass" aria-label="Brújula: norte, noreste, este, sureste, sur, suroeste, oeste y noroeste">
        <span className="compass-n">N</span><span className="compass-ne">NE</span><span className="compass-e">E</span><span className="compass-se">SE</span>
        <span className="compass-s">S</span><span className="compass-sw">SO</span><span className="compass-w">O</span><span className="compass-nw">NO</span>
        <i className="compass-pointer" />
      </div>
      <div className="map-location-tag"><Icon name="locate" size={13} /> {location ? 'POSICIÓN ACTUAL' : 'ZONA DE ENTRENAMIENTO'}</div>
      <div className="map-zoom"><button aria-label="Centrar mapa" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOffset({ x: 0, y: 0 })}><Icon name="target" size={16} /></button></div>
    </div>
  )
}

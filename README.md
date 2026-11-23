# Ritmo · Run club

Aplicación web progresiva para registrar carreras, consultar estadísticas y completar retos. La aplicación y los datos funcionan sin conexión después de cargarlos; los mapas reales necesitan conexión para solicitar mosaicos nuevos.

## Desarrollo

```sh
npm install
npm run dev
```

La aplicación muestra cartografía real de OpenStreetMap por defecto. Opcionalmente, configura una clave de Stadia Maps para elegir sus estilos Alidade Smooth y OpenMapTiles Outdoors:

1. Copia `.env.example` a `.env.local`.
2. Añade tu clave pública de Stadia Maps a `VITE_STADIA_MAPS_API_KEY`.
3. Reinicia Vite y elige el proveedor en Ajustes → Cartografía.

OpenStreetMap muestra atribución visible y sus mosaicos se solicitan conforme a la política del proveedor. No se descargan mosaicos en bloque; los ya cargados dependen de la caché HTTP del proveedor/navegador.

Para comprobar la versión de producción:

```sh
npm run build
npm run preview
```

## Ubicación y privacidad

- El registro utiliza la geolocalización de alta precisión del navegador y necesita permiso de ubicación.
- El GPS requiere HTTPS o `localhost`; la aplicación no envía la ubicación a un servidor.
- Las actividades y los ajustes se guardan en `localStorage` del dispositivo. Borrar los datos del navegador elimina ese historial.
- La auto-pausa se activa tras 5 segundos sin movimiento GPS. Pantalla encendida y creación de video dependen de las capacidades del navegador y del dispositivo.
- Durante una carrera, la brújula gira el mapa en pasos de 45°; un doble clic vuelve al norte y en pantalla táctil también se puede girar con dos dedos.
- La vista de carrera solo se abre en espera; el cronómetro y el GPS no empiezan hasta pulsar “Iniciar actividad”. Intentar salir de una carrera activa requiere confirmación.
- La vista de actividad muestra solo el mapa, el GPS y las métricas. Al finalizar, puedes guardar o descartar; las carreras guardadas aparecen en Recorridos con su trazado y los marcadores de inicio y final.
- El mapa centrado en la posición requiere permiso GPS y mosaicos con conexión a internet. El seguimiento y el guardado local continúan funcionando sin conexión, pero no se garantiza la cartografía mientras estés offline.
- Stadia Maps y OpenMapTiles son proveedores opcionales de mosaicos raster y requieren una clave propia de Stadia Maps. Leaflet muestra los mapas y las rutas en el navegador; MapLibre Android es una tecnología nativa de Android y no es necesaria para esta PWA.

## Organización

- `src/features/tracker`: seguimiento GPS y almacenamiento local de actividades.
- `src/features/map`: Leaflet, mosaicos reales y visualización de la ruta GPS.
- `src/features/activity`: vista de carrera, guardado de actividad y exportación de video.
- `src/features/settings`: preferencias de entrenamiento y apariencia.
- `src/App.jsx` y `src/App.css`: navegación, páginas y estilos generales.

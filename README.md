# Ritmo · Run club

Aplicación web progresiva para registrar carreras, consultar estadísticas y completar retos. La interfaz y los datos funcionan sin conexión después de cargar la aplicación; las actividades y preferencias se guardan localmente en el navegador.

## Desarrollo

```sh
npm install
npm run dev
```

Para comprobar la versión de producción:

```sh
npm run build
npm run preview
```

## Ubicación y privacidad

- El registro utiliza la geolocalización de alta precisión del navegador y necesita permiso de ubicación.
- El GPS requiere HTTPS o `localhost`; la aplicación no envía la ubicación a un servidor.
- Las actividades y los ajustes se guardan en `localStorage` del dispositivo. Borrar los datos del navegador elimina ese historial.
- Auto-pausa, pantalla encendida y creación de video dependen de las capacidades del navegador y del dispositivo.
- El mapa incluido es un esquema local sin calles cartográficas; la posición y la ruta registradas sí se dibujan a partir de las coordenadas GPS.

## Organización

- `src/features/tracker`: seguimiento GPS y almacenamiento local de actividades.
- `src/features/map`: mapa esquemático y visualización de la ruta.
- `src/features/activity`: registro de actividad y exportación de video.
- `src/features/settings`: preferencias de entrenamiento y apariencia.
- `src/App.jsx` y `src/App.css`: navegación, páginas y estilos generales.

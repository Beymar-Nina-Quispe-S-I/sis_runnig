import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Estrategia de actualización: 'prompt' solicita al usuario, 'autoUpdate' actualiza automáticamente
      // Para uso personal se recomienda 'autoUpdate' para evitar interrupciones
      registerType: 'autoUpdate',
      
      // Incluir recursos adicionales en la caché (si tienes iconos, etc.)
      includeAssets: ['favicon.ico', 'icons/*.png'],
      
      // Configuración del Manifest: determina cómo se ve al "agregar a pantalla de inicio"
      manifest: {
        name: 'Mi Registro de Atletismo',
        short_name: 'Atletismo',
        description: 'Aplicación personal de registro de trayectorias offline',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone', // Apariencia similar a una app nativa
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      
      // Configuración de Workbox: controla qué archivos se almacenan en caché
      workbox: {
        // Almacenar en caché todos los archivos js, css, html generados después de la compilación
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Limpiar automáticamente cachés antiguas
        cleanupOutdatedCaches: true,
      },
      
     
    })
  ]
})
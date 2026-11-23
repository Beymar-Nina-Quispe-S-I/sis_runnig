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
      includeAssets: ['ritmo-icon.svg'],
      
      // Configuración del Manifest: determina cómo se ve al "agregar a pantalla de inicio"
      manifest: {
        name: 'Ritmo · Run club',
        short_name: 'Ritmo',
        description: 'Entrena, registra tus recorridos y progresa sin conexión.',
        lang: 'es',
        theme_color: '#0c131d',
        background_color: '#0c131d',
        display: 'standalone', // Apariencia similar a una app nativa
        icons: [
          {
            src: '/ritmo-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
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
import L from 'leaflet'

/**
 * leaflet-rotate (ver MapView.tsx) está escrito para cargarse como un
 * <script> clásico que deja `L` como variable global — su código de
 * parcheo lee `L.Map`, `L.extend`, etc. de ese global, no de un import
 * propio. Con Vite/ESM el paquete "leaflet" no toca `window`, así que sin
 * esto el import de "leaflet-rotate" revienta al evaluarse (L is not
 * defined). Este módulo solo existe para exponer `L` en window antes de
 * que "leaflet-rotate" se importe — los imports de un archivo corren en
 * orden, así que importar este archivo primero garantiza el orden.
 */
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L
}

export default L

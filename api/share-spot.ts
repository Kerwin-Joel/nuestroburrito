// Vercel Serverless Function — sirve una página con meta Open Graph para que
// WhatsApp (y Facebook/Twitter) muestren una tarjeta bonita al compartir un
// spot, en vez de un link pelado. La SPA no puede hacer esto sola: el crawler
// de WhatsApp no ejecuta JS, solo lee el HTML inicial, y el de una SPA no
// trae ni título ni imagen del spot.
//
// Un humano que abre el link real (sin la app, o si Android no verificó el
// App Link) cae aquí un instante y se redirige solo a la app web real.
// Si SÍ tiene la app instalada, Android intercepta la URL antes de llegar
// acá — ver el intent-filter de nuestroburrito.com/api/share-spot en
// AndroidManifest.xml.
export default async function handler(req: any, res: any) {
  const id = typeof req.query.id === 'string' ? req.query.id : ''
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const appUrl = `https://www.nuestroburrito.com/app/explorar?spot=${encodeURIComponent(id)}`

  let title = 'Burrito · Piura de verdad'
  let description = 'Descubre spots reales de Piura, recomendados por locales.'
  let image = 'https://www.nuestroburrito.com/imagotipo.png'

  if (id && supabaseUrl && anonKey) {
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/spots?id=eq.${encodeURIComponent(id)}&select=name,description,photo_url,local_tip`,
        { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
      )
      const rows = await r.json()
      const spot = Array.isArray(rows) ? rows[0] : null
      if (spot) {
        title = `${spot.name} · Burrito`
        description = spot.local_tip || spot.description || description
        if (spot.photo_url) image = spot.photo_url
      }
    } catch {
      // Si Supabase falla, se sirve la tarjeta genérica de la marca en vez de romper el link.
    }
  }

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600')
  res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Burrito" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="https://www.nuestroburrito.com/api/share-spot?id=${encodeURIComponent(id)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0;url=${esc(appUrl)}" />
<script>location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body>
  <p>Abriendo <a href="${esc(appUrl)}">Burrito</a>…</p>
</body>
</html>`)
}

/**
 * shareSpot — Comparte un spot vía Web Share API.
 *
 * Estrategia de imagen:
 * 1. Intenta adjuntar la foto del spot como archivo (Files API) →
 *    aparece en el share sheet nativo de iOS/Android.
 * 2. Fallback: share solo con texto + URL (sin imagen adjunta).
 * 3. Último fallback: copiar URL al portapapeles.
 *
 * La imagen del preview en WhatsApp/Telegram viene del og:image
 * de index.html (logo de Burrito) — no del archivo adjunto.
 */

export interface ShareSpotPayload {
  id: string
  name: string
  localTip?: string
  category?: string
  photoUrl?: string   // URL de la foto del spot para adjuntar
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unsupported'

// Intenta obtener la foto del spot como File para adjuntarla al share
async function fetchSpotImageFile(url: string, name: string): Promise<File | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const ext = blob.type.includes('png') ? 'png' : 'jpg'
    return new File([blob], `${name.toLowerCase().replace(/\s+/g, '-')}.${ext}`, { type: blob.type })
  } catch {
    return null
  }
}

export async function shareSpot(spot: ShareSpotPayload): Promise<ShareResult> {
  const origin = window.location.origin
  const url = `${origin}/app/explorar?spot=${spot.id}`

  const text = spot.localTip
    ? `Hola lo descubrí en nuestroburrito.com 🏇🎉\n💡 ${spot.localTip}`
    : `Lo descubrí en nuestroburrito.com 🌯\nDescubre ${spot.name} y el Piura real.`

  // ── Intento A: share con imagen adjunta (Files API) ──
  if (spot.photoUrl && navigator.share && navigator.canShare) {
    const file = await fetchSpotImageFile(spot.photoUrl, spot.name)
    if (file) {
      const payloadWithFile: ShareData = {
        title: `${spot.name} — Burrito`,
        text,
        url,
        files: [file],
      }
      if (navigator.canShare(payloadWithFile)) {
        try {
          await navigator.share(payloadWithFile)
          return 'shared'
        } catch (err: any) {
          if (err?.name === 'AbortError') return 'cancelled'
          // Continúa al share sin archivo
        }
      }
    }
  }

  // ── Intento B: share solo texto + URL (sin imagen adjunta) ──
  const payload: ShareData = {
    title: `${spot.name} — Burrito`,
    text,
    url,
  }
  if (navigator.share && navigator.canShare?.(payload)) {
    try {
      await navigator.share(payload)
      return 'shared'
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }

  // ── Fallback: copiar URL al portapapeles ──
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'unsupported'
  }
}

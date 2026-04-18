import { useState, useEffect } from 'react'

interface TiktokEmbedData {
  html: string
  thumbnail_url: string // TikTok oEmbed uses snake_case
  title: string
  author_name: string
}

export interface TiktokEmbedResponse {
  data: TiktokEmbedData | null
  loading: boolean
  error: boolean
}

export function useTiktokEmbed(url: string): TiktokEmbedResponse {
  const [data, setData] = useState<TiktokEmbedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(false)

    // TikTok oEmbed API: https://www.tiktok.com/oembed?url={url}
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error('TikTok embed failed')
        return res.json()
      })
      .then((json) => {
        if (isMounted) {
          setData(json)
        }
      })
      .catch((err) => {
        console.error('TikTok oEmbed error:', err)
        if (isMounted) {
          setError(true)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [url])

  return { data, loading, error }
}

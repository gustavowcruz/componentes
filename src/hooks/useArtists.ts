import { useEffect, useRef, useState } from 'react'
import { fetchArtists, type Artist } from '../services/artistsApi'
import { FALLBACK_ARTISTS } from '../data/artistsFallback'
import { normalize } from '../lib/normalize'

function filterLocal(query: string): Artist[] {
  const q = normalize(query)
  if (!q) return FALLBACK_ARTISTS
  return FALLBACK_ARTISTS.filter((a) =>
    [a.nome, a.genero, a.pais].some((f) => normalize(f).includes(q)),
  )
}

export function useArtists(debounceMs = 250) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Artist[]>(FALLBACK_ARTISTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const data = await fetchArtists(query, controller.signal)
        setResults(data)
        setOffline(false)
        setError(null)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = (err as Error).message
        if (msg.startsWith('API_OFFLINE:')) {
          // Fallback: busca local continua funcionando sem a API
          setResults(filterLocal(query))
          setOffline(true)
          setError(null)
        } else {
          setOffline(false)
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [query, debounceMs])

  return { query, setQuery, results, setResults, loading, error, offline }
}

export interface Artist {
  id: string
  nome: string
  genero: string
  pais: string
  _upsert?: 'found' | 'created'
}

export const API_OFFLINE_MESSAGE =
  'API desligada — rode `npm run dev:all` (ou `node server/index.js` em outro terminal) para buscar/criar no artists.json.'

function isNetworkFailure(err: unknown): boolean {
  // fetch fora do ar (proxy ECONNREFUSED, API desligada) cai aqui como TypeError
  return err instanceof TypeError
}

export async function fetchArtists(query: string, signal?: AbortSignal): Promise<Artist[]> {
  let res: Response
  try {
    res = await fetch(`/api/artists?q=${encodeURIComponent(query)}`, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    if (isNetworkFailure(err)) throw new Error(`API_OFFLINE: ${API_OFFLINE_MESSAGE}`, { cause: err })
    throw err
  }
  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      if (data?.error) detail = ` (${data.error})`
    } catch {
      /* mantém mensagem genérica */
    }
    throw new Error(`Falha ao buscar artistas${detail}`)
  }
  return res.json()
}

export async function createArtist(input: {
  nome: string
  genero: string
  pais: string
}): Promise<Artist> {
  let res: Response
  try {
    res = await fetch('/api/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch (err) {
    if (isNetworkFailure(err)) throw new Error(`API_OFFLINE: ${API_OFFLINE_MESSAGE}`, { cause: err })
    throw err
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Falha ao criar artista')
  return data
}

import { useMemo, useRef, useState } from 'react'
import { useArtists } from '../hooks/useArtists'
import { createArtist, type Artist } from '../services/artistsApi'
import { normalize } from '../lib/normalize'
import './ArtistSearchUpsert.css'

interface Props {
  onSelect?: (artist: Artist) => void
  onCreate?: (artist: Artist) => void
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = normalize(text).indexOf(normalize(q))
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export default function ArtistSearchUpsert({ onSelect, onCreate }: Props) {
  const { query, setQuery, results, setResults, loading, error, offline } = useArtists()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<Artist | null>(null)
  const [creating, setCreating] = useState(false)
  const [genero, setGenero] = useState('')
  const [pais, setPais] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const exactMatch = useMemo(
    () => results.some((a) => normalize(a.nome) === normalize(query)),
    [results, query],
  )

  const showCreateOption = query.trim().length >= 2 && !exactMatch
  const totalOptions = results.length + (showCreateOption ? 1 : 0)

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  function pickArtist(artist: Artist) {
    setSelected(artist)
    setQuery(artist.nome)
    setOpen(false)
    setCreating(false)
    onSelect?.(artist)
    showToast(`Selecionado: ${artist.nome}`)
  }

  async function handleCreate() {
    const nome = query.trim()
    if (nome.length < 2) {
      setFormError('Digite ao menos 2 letras para criar.')
      return
    }
    setFormError(null)
    setCreating(true)
    try {
      const created = await createArtist({ nome, genero: genero.trim() || 'Desconhecido', pais: pais.trim() || 'Desconhecido' })
      if (created._upsert === 'found') {
        // UPSERT: já existia — comporta-se como busca
        setResults((prev) =>
          prev.some((a) => a.id === created.id) ? prev : [created, ...prev],
        )
        pickArtist(created)
        showToast(`"${created.nome}" já existia — selecionado.`)
      } else {
        setResults((prev) => [created, ...prev])
        pickArtist(created)
        onCreate?.(created)
        showToast(`"${created.nome}" criado em artists.json!`)
      }
      setGenero('')
      setPais('')
    } catch (e) {
      const msg = (e as Error).message
      if (msg.startsWith('API_OFFLINE:')) {
        // Sem API: cria só em memória (não grava no JSON) e avisa
        const local: Artist = {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          nome,
          genero: genero.trim() || 'Desconhecido',
          pais: pais.trim() || 'Desconhecido',
        }
        setResults((prev) => [local, ...prev])
        pickArtist(local)
        setFormError('API desligada — artista criado só na tela. Rode `npm run dev:all` para gravar no artists.json.')
      } else {
        setFormError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (i + 1) % Math.max(totalOptions, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + totalOptions) % Math.max(totalOptions, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) pickArtist(results[activeIndex])
      else if (showCreateOption) void handleCreate()
      else if (results.length === 1) pickArtist(results[0])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setCreating(false)
    }
  }

  return (
    <div className="upsert">
      <div className="upsert-field">
        <span className="upsert-icon" aria-hidden>⌕</span>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls="artist-listbox"
          aria-autocomplete="list"
          className="upsert-input"
          placeholder="Buscar artista… ex: anitta, mpb, k-pop"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
            setSelected(null)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && <span className="upsert-spinner" aria-label="carregando" />}
        {query && (
          <button
            className="upsert-clear"
            aria-label="limpar busca"
            onClick={() => {
              setQuery('')
              setSelected(null)
              setOpen(true)
              inputRef.current?.focus()
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="upsert-dropdown">
          {offline && (
            <div className="upsert-offline">
              ⚡ Modo offline — API desligada. Busca local ativa.
              Para gravar no JSON: <code>npm run dev:all</code>
            </div>
          )}
          {error && <div className="upsert-error">⚠ {error}</div>}

          {!loading && results.length === 0 && !showCreateOption && (
            <div className="upsert-empty">Digite ao menos 2 letras para buscar ou criar.</div>
          )}

          <ul id="artist-listbox" role="listbox" className="upsert-list">
            {results.map((artist, i) => (
              <li key={artist.id}>
                <button
                  role="option"
                  aria-selected={selected?.id === artist.id}
                  className={`upsert-option ${i === activeIndex ? 'active' : ''} ${selected?.id === artist.id ? 'selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pickArtist(artist)}
                >
                  <span className="upsert-avatar">{artist.nome.slice(0, 1).toUpperCase()}</span>
                  <span className="upsert-meta">
                    <strong><Highlight text={artist.nome} query={query} /></strong>
                    <small>{artist.genero} · {artist.pais}</small>
                  </span>
                  <span className="upsert-badge">existe</span>
                </button>
              </li>
            ))}

            {showCreateOption && (
              <li>
                <button
                  className={`upsert-option create ${activeIndex === results.length ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(results.length)}
                  onClick={() => void handleCreate()}
                >
                  <span className="upsert-avatar plus">＋</span>
                  <span className="upsert-meta">
                    <strong>Criar “{query.trim()}”</strong>
                    <small>Não encontrado — grava novo registro no JSON via fs</small>
                  </span>
                </button>
              </li>
            )}
          </ul>

          {showCreateOption && (
            <div className="upsert-create-form">
              <div className="upsert-row">
                <label>
                  Gênero
                  <input value={genero} onChange={(e) => setGenero(e.target.value)} placeholder="Ex: MPB, Pop, Rock" />
                </label>
                <label>
                  País
                  <input value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Ex: Brasil" />
                </label>
              </div>
              {formError && <div className="upsert-error">⚠ {formError}</div>}
              <button className="upsert-submit" disabled={creating} onClick={() => void handleCreate()}>
                {creating ? 'Salvando…' : `Salvar "${query.trim()}" no artists.json`}
              </button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="upsert-selected">
          <div>
            <small>Selecionado</small>
            <strong>{selected.nome}</strong>
            <span>{selected.genero} · {selected.pais}</span>
          </div>
          <code>find ✓</code>
        </div>
      )}

      {toast && <div className="upsert-toast" role="status">{toast}</div>}
    </div>
  )
}

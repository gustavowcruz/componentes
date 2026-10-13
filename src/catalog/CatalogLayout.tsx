import { useEffect, useMemo, useState } from 'react'
import { REGISTRY } from './registry'
import CodeBlock from './CodeBlock'
import './catalog.css'

type Tab = 'preview' | 'codigo' | 'props'

function slugFromHash(): string {
  const m = window.location.hash.match(/^#\/([\w-]+)/)
  return m ? m[1] : REGISTRY[0].slug
}

export default function CatalogLayout() {
  const [slug, setSlug] = useState(slugFromHash)
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState<Tab>('preview')

  useEffect(() => {
    const onHash = () => {
      setSlug(slugFromHash())
      setTab('preview')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const entry = REGISTRY.find((e) => e.slug === slug) ?? REGISTRY[0]
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return REGISTRY
    return REGISTRY.filter((e) => e.name.toLowerCase().includes(q))
  }, [filter])

  const Demo = entry.demo

  return (
    <div className="cat">
      <aside className="cat-side">
        <div className="cat-brand">
          <span className="cat-logo">◼</span>
          <div>
            <strong>componentes</strong>
            <small>{REGISTRY.filter((e) => !e.comingSoon).length} prontos · {REGISTRY.filter((e) => e.comingSoon).length} em breve</small>
          </div>
        </div>
        <div className="cat-search">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar componentes…"
            aria-label="Filtrar componentes"
          />
        </div>
        <nav className="cat-nav">
          {visible.map((e) => (
            <a
              key={e.slug}
              href={e.comingSoon ? undefined : `#/${e.slug}`}
              aria-disabled={e.comingSoon}
              className={`cat-item ${e.slug === entry.slug ? 'active' : ''} ${e.comingSoon ? 'soon' : ''}`}
              onClick={e.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <span className="cat-item-name">{e.name}</span>
              {e.comingSoon
                ? <span className="cat-tag">em breve</span>
                : <span className="cat-dot" aria-hidden />}
            </a>
          ))}
          {visible.length === 0 && <div className="cat-empty">Nenhum componente encontrado.</div>}
        </nav>
        <div className="cat-foot">React + Vite · dark minimal</div>
      </aside>

      <main className="cat-main">
        <header className="cat-head">
          <div>
            <h1>{entry.name}</h1>
            <p>{entry.desc}</p>
          </div>
          {!entry.comingSoon && (
            <div className="cat-tabs" role="tablist">
              {(['preview', 'codigo', 'props'] as Tab[]).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? 'active' : ''}
                  onClick={() => setTab(t)}
                >
                  {t === 'preview' ? 'Preview' : t === 'codigo' ? 'Código' : 'Props'}
                </button>
              ))}
            </div>
          )}
        </header>

        {entry.comingSoon || !Demo ? (
          <div className="cat-soon">
            <strong>Em breve</strong>
            <p>Este slot está reservado. Adicione o demo em <code>src/catalog/demos</code> e registre em <code>src/catalog/registry.tsx</code>.</p>
          </div>
        ) : tab === 'preview' ? (
          <section className="cat-preview"><Demo /></section>
        ) : tab === 'codigo' ? (
          <section>{entry.usage && <CodeBlock code={entry.usage} />}</section>
        ) : (
          <section className="cat-props">
            <table>
              <thead><tr><th>Prop</th><th>Tipo</th><th>Default</th><th>Descrição</th></tr></thead>
              <tbody>
                {(entry.props ?? []).map((p) => (
                  <tr key={p.name}>
                    <td><code>{p.name}</code></td>
                    <td><code>{p.type}</code></td>
                    <td>{p.def}</td>
                    <td>{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  )
}

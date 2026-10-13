import { useState } from 'react'
import ArtistSearchUpsert from './components/ArtistSearchUpsert'
import type { Artist } from './services/artistsApi'
import './App.css'

export default function App() {
  const [lastEvent, setLastEvent] = useState<string>('Nenhuma ação ainda. Busque ou crie um artista.')

  return (
    <div className="page">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <main className="card">
        <header className="card-head">
          <span className="pill">React · JSON · fs · Upsert</span>
          <h1>Busca <em>ou</em> cria artistas</h1>
          <p>
            Padrão <code>Creatable Autocomplete</code> + <code>Find-or-Create (Upsert)</code>:
            se o registro existe no <code>artists.json</code>, filtra e seleciona.
            Se não existe, cria via API com <code>fs</code>.
          </p>
        </header>

        <ArtistSearchUpsert
          onSelect={(a: Artist) => setLastEvent(`find ✓ — "${a.nome}" já existia e foi selecionado.`)}
          onCreate={(a: Artist) => setLastEvent(`created ＋ — "${a.nome}" gravado em data/artists.json.`)}
        />

        <footer className="card-foot">
          <div className="status" role="status">{lastEvent}</div>
          <div className="hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>Enter</kbd> selecionar / criar</span>
            <span><kbd>Esc</kbd> fechar</span>
          </div>
          <code className="cmd">API: node server/index.js · Front: npm run dev</code>
        </footer>
      </main>
    </div>
  )
}

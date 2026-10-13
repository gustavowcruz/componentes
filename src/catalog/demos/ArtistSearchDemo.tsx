import { useState } from 'react'
import ArtistSearchUpsert from '../../components/ArtistSearchUpsert'
import type { Artist } from '../../services/artistsApi'

export default function ArtistSearchDemo() {
  const [lastEvent, setLastEvent] = useState<string>('Nenhuma ação ainda. Busque ou crie um artista.')

  return (
    <div className="demo-stack">
      <ArtistSearchUpsert
        onSelect={(a: Artist) => setLastEvent(`find — "${a.nome}" já existia e foi selecionado.`)}
        onCreate={(a: Artist) => setLastEvent(`created — "${a.nome}" gravado em data/artists.json.`)}
      />
      <div className="demo-status" role="status">{lastEvent}</div>
      <div className="demo-hints">
        <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> selecionar / criar</span>
        <span><kbd>Esc</kbd> fechar</span>
      </div>
    </div>
  )
}

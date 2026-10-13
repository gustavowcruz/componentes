import type { ComponentType } from 'react'
import ArtistSearchDemo from './demos/ArtistSearchDemo'

export interface PropDoc {
  name: string
  type: string
  def: string
  desc: string
}

export interface CatalogEntry {
  slug: string
  name: string
  desc: string
  demo?: ComponentType
  usage?: string
  props?: PropDoc[]
  comingSoon?: boolean
}

const ARTIST_USAGE = `import ArtistSearchUpsert from './components/ArtistSearchUpsert'

function Exemplo() {
  return (
    <ArtistSearchUpsert
      onSelect={(a) => console.log('existe:', a.nome)}
      onCreate={(a) => console.log('criado:', a.id)}
    />
  )
}`

export const REGISTRY: CatalogEntry[] = [
  {
    slug: 'artist-search-upsert',
    name: 'ArtistSearchUpsert',
    desc: 'Creatable Autocomplete com Find-or-Create (Upsert): filtra artists.json e cria o registro via API com fs quando não existe.',
    demo: ArtistSearchDemo,
    usage: ARTIST_USAGE,
    props: [
      { name: 'onSelect', type: '(a: Artist) => void', def: '—', desc: 'Chamado ao selecionar um registro existente.' },
      { name: 'onCreate', type: '(a: Artist) => void', def: '—', desc: 'Chamado ao criar um novo registro.' },
    ],
  },
  {
    slug: 'button',
    name: 'Button',
    desc: 'Slot reservado para um botão do catálogo.',
    comingSoon: true,
  },
  {
    slug: 'modal',
    name: 'Modal',
    desc: 'Slot reservado para um modal do catálogo.',
    comingSoon: true,
  },
]

// Para adicionar um componente novo: crie o demo em
// src/catalog/demos e acrescente uma entrada acima.

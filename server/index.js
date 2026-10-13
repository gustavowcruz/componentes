import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '..', 'data', 'artists.json')

const SEED = [
  { id: '1', nome: 'Anitta', genero: 'Pop', pais: 'Brasil' },
  { id: '2', nome: 'Caetano Veloso', genero: 'MPB', pais: 'Brasil' },
  { id: '3', nome: 'Gilberto Gil', genero: 'Tropicalia', pais: 'Brasil' },
  { id: '4', nome: 'Marisa Monte', genero: 'MPB', pais: 'Brasil' },
  { id: '5', nome: 'Djavan', genero: 'MPB', pais: 'Brasil' },
  { id: '6', nome: 'Billie Eilish', genero: 'Alt Pop', pais: 'EUA' },
  { id: '7', nome: 'Kendrick Lamar', genero: 'Hip Hop', pais: 'EUA' },
  { id: '8', nome: 'Rosalia', genero: 'Flamenco Pop', pais: 'Espanha' },
  { id: '9', nome: 'Burna Boy', genero: 'Afrobeats', pais: 'Nigéria' },
  { id: '10', nome: 'BTS', genero: 'K-Pop', pais: 'Coreia do Sul' },
  { id: '11', nome: 'Rita Lee', genero: 'Rock', pais: 'Brasil' },
  { id: '12', nome: 'Milton Nascimento', genero: 'MPB', pais: 'Brasil' },
]

const app = express()
app.use(cors())
app.use(express.json())

function normalize(str) {
  return (str ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function ensureDb() {
  try {
    await access(DB_PATH, constants.F_OK)
  } catch {
    await mkdir(path.dirname(DB_PATH), { recursive: true })
    await writeFile(DB_PATH, JSON.stringify(SEED, null, 2) + '\n', 'utf-8')
    console.log(`Banco criado em ${DB_PATH}`)
  }
}

async function readArtists() {
  await ensureDb()
  const raw = (await readFile(DB_PATH, 'utf-8')).replace(/^\uFEFF/, '')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}

async function writeArtists(artists) {
  await writeFile(DB_PATH, JSON.stringify(artists, null, 2) + '\n', 'utf-8')
}

// Healthcheck — use para confirmar que o proxy está alcançando a API
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: DB_PATH })
})

// FIND — busca/filtro (se existir, retorna)
app.get('/api/artists', async (req, res) => {
  try {
    const q = normalize(req.query.q)
    const artists = await readArtists()
    if (!q) return res.json(artists)
    const filtered = artists.filter((a) =>
      [a.nome, a.genero, a.pais].some((f) => normalize(f).includes(q)),
    )
    res.json(filtered)
  } catch (err) {
    console.error('GET /api/artists falhou:', err)
    res.status(500).json({ error: `Falha ao ler artists.json (${err.message})` })
  }
})

// UPSERT (find-or-create) — se não existir, cria com fs
app.post('/api/artists', async (req, res) => {
  try {
    const nome = (req.body?.nome ?? '').trim()
    const genero = (req.body?.genero ?? '').trim() || 'Desconhecido'
    const pais = (req.body?.pais ?? '').trim() || 'Desconhecido'

    if (nome.length < 2) {
      return res.status(400).json({ error: 'Nome precisa ter ao menos 2 letras.' })
    }

    const artists = await readArtists()
    const exists = artists.find((a) => normalize(a.nome) === normalize(nome))
    if (exists) {
      // Já existe: comportamento de busca — devolve o registro (sem duplicar)
      return res.status(200).json({ ...exists, _upsert: 'found' })
    }

    const created = { id: randomUUID(), nome, genero, pais }
    artists.push(created)
    await writeArtists(artists)
    res.status(201).json({ ...created, _upsert: 'created' })
  } catch (err) {
    console.error('POST /api/artists falhou:', err)
    res.status(500).json({ error: `Falha ao gravar artists.json (${err.message})` })
  }
})

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '127.0.0.1'
app.listen(PORT, HOST, () => {
  console.log(`API artists rodando em http://${HOST}:${PORT}`)
  console.log(`DB: ${DB_PATH}`)
})

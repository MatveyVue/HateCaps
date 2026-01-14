import axios from 'axios'

const API_URL =
  import.meta.env.VITE_SWIFTGIFTS_API_URL ||
  'https://api-swiftgifts.vercel.app/api/aggregator'
const API_KEY = import.meta.env.VITE_SWIFTGIFTS_API_KEY
const CACHE_TTL_MS = 5 * 60 * 1000

function buildCacheKey(payload, page) {
  const marketKey = Array.isArray(payload.market) ? payload.market.join(',') : payload.market ?? 'null'
  const parts = [
    payload.name,
    payload.model,
    payload.symbol,
    payload.backdrop,
    payload.number ?? 'null',
    marketKey,
    payload.from ?? 'null',
    payload.to ?? 'null',
    payload.receiver ?? 'null',
    page,
  ]
  return `swiftgifts:${parts.map((part) => String(part)).join('|')}`
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.ts !== 'number') return null
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
  }
}

function getReceiverId() {
  const rawId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
  const receiver = Number(rawId)
  if (!Number.isFinite(receiver)) {
    throw new Error('Missing Telegram user id')
  }
  return receiver
}

export async function fetchGiftPage(payload, page) {
  if (!API_KEY) {
    throw new Error('Missing VITE_SWIFTGIFTS_API_KEY')
  }

  const requestPayload = {
    ...payload,
    receiver: getReceiverId(),
  }
  const cacheKey = buildCacheKey(requestPayload, page)
  const cached = readCache(cacheKey)
  if (cached) {
    return cached
  }

  const response = await axios.post(`${API_URL}?page=${page}`, requestPayload, {
    headers: {
      accept: 'application/json',
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
  })

  const data = response.data
  const items = Array.isArray(data) ? data : data.items || []
  writeCache(cacheKey, items)
  return items
}

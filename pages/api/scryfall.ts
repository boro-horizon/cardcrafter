// pages/api/scryfall.ts

const cache = new Map<string, { timestamp: number; data: any }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export default async function handler(req, res) {
  const { type, query, url } = req.query

  let scryfallUrl = ''
  if (url) {
    // for next_page, fully qualified Scryfall URL
    scryfallUrl = decodeURIComponent(url as string)
  } else if (type === 'set') {
    scryfallUrl = https://api.scryfall.com/cards/search?q=set:${query}&order=collector_number
  } else if (type === 'search') {
    scryfallUrl = https://api.scryfall.com/cards/search?q=${encodeURIComponent(query as string)}
  } else {
    return res.status(400).json({ error: 'Invalid request type' })
  }

  // Caching key
  const cacheKey = scryfall:${scryfallUrl}
  const now = Date.now()

  // Check cache
  if (cache.has(cacheKey)) {
    const { timestamp, data } = cache.get(cacheKey)!
    if (now - timestamp < CACHE_DURATION) {
      return res.status(200).json(data)
    }
  }

  try {
    const response = await fetch(scryfallUrl, {
      headers: {
        'User-Agent': 'CardCrafterApp/1.0 (contact: your-email@example.com)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Scryfall' })
    }

    const data = await response.json()
    cache.set(cacheKey, { timestamp: now, data })

    return res.status(200).json(data)
  } catch (err) {
    console.error('Scryfall fetch error:', err)
    return res.status(500).json({ error: 'Server error fetching data from Scryfall' })
  }
}
// pages/api/scryfall.ts

const cache = new Map<string, { timestamp: number; data: any }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export default async function handler(req, res) {
  const { type, query, url } = req.query

  // Declare resolvedScryfallUrl only once here
  let resolvedScryfallUrl = ''

  if (typeof url === 'string' && url.length > 0) {
    resolvedScryfallUrl = decodeURIComponent(url)
  } else if (type === 'set' && typeof query === 'string') {
    resolvedScryfallUrl = https://api.scryfall.com/cards/search?q=set:${query}&order=collector_number
  } else if (type === 'search' && typeof query === 'string') {
    resolvedScryfallUrl = https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}
  } else {
    return res.status(400).json({ error: 'Invalid request parameters' })
  }

  const cacheKey = scryfall:${resolvedScryfallUrl}
  const now = Date.now()

  if (cache.has(cacheKey)) {
    const { timestamp, data } = cache.get(cacheKey)!
    if (now - timestamp < CACHE_DURATION) {
      return res.status(200).json(data)
    }
  }

  try {
    const response = await fetch(resolvedScryfallUrl, {
      headers: {
        'User-Agent': 'CardCrafterApp/1.0 (contact: your-email@example.com)',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Scryfall' })
    }

    const data = await response.json()
    cache.set(cacheKey, { timestamp: now, data })

    return res.status(200).json(data)
  } catch (error) {
    console.error('Fetch error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
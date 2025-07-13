import type { NextApiRequest, NextApiResponse } from 'next'

const cache = new Map<string, { timestamp: number; data: any }>()
const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cardName } = req.query

  if (!cardName || typeof cardName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid cardName' })
  }

  const encodedName = encodeURIComponent(cardName.trim())
  const resolvedScryfallUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodedName}`
  const cacheKey = `scryfall:${resolvedScryfallUrl}`
  const now = Date.now()

  if (cache.has(cacheKey)) {
    const { timestamp, data } = cache.get(cacheKey)!
    if (now - timestamp < CACHE_DURATION) {
      return res.status(200).json(data)
    }
  }

  try {
    const response = await fetch(resolvedScryfallUrl)
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

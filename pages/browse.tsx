// pages/browse.tsx

import { useEffect, useState } from 'react'

type Card = {
  id: string
  name: string
  image_uris?: {
    small: string
  }
  prices?: {
    usd: string
    usd_foil: string
  }
  set_name: string
  collector_number: string
}

const BrowsePage = () => {
  const [sets, setSets] = useState<{ code: string; name: string }[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

  useEffect(() => {
    // Load MTG set list from Scryfall
    const loadSets = async () => {
      const res = await fetch('https://api.scryfall.com/sets')
      const data = await res.json()
      const filtered = data.data
        .filter((s: any) => s.set_type === 'expansion' || s.set_type === 'core')
        .map((s: any) => ({ code: s.code, name: s.name }))
      setSets(filtered)
    }
    loadSets()
  }, [])

  const fetchCards = async (type: 'set' | 'search' | 'page', query: string) => {
    let apiUrl = ''

    if (type === 'set') {
      apiUrl = "/api/scryfall?type=set&query=${query}"
    } else if (type === 'search') {
      apiUrl = "/api/scryfall?type=search&query=${encodeURIComponent(query)}"
    } else if (type === 'page') {
      apiUrl = "/api/scryfall?url=${encodeURIComponent(query)}"
    }

    const res = await fetch(apiUrl)
    const data = await res.json()

    setCards(data.data)
    setNextPageUrl(data.next_page || null)
  }

  const handleSetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const setCode = e.target.value
    setSelectedSet(setCode)
    fetchCards('set', setCode)
  }

  const handleSearch = () => {
    if (searchTerm.trim().length > 0) {
      fetchCards('search', searchTerm)
    }
  }

  const handleNextPage = () => {
    if (nextPageUrl) {
      fetchCards('page', nextPageUrl)
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Browse MTG Cards</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <select
          className="border rounded px-3 py-2"
          onChange={handleSetSelect}
          value={selectedSet}
        >
          <option value="">Select a set</option>
          {sets.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search any card..."
          className="border rounded px-3 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>

        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}
          className="ml-auto px-4 py-2 bg-gray-200 rounded"
        >
          {viewMode === 'list' ? 'Card View' : 'List View'}
        </button>
      </div>

      {cards.length > 0 && (
        <div className={viewMode === 'card' ? 'grid grid-cols-2 sm:grid-cols-4 gap-4' : ''}>
          {cards.map((card) => (
            <div key={card.id} className="mb-4 border p-2 rounded bg-white shadow-sm">
              {viewMode === 'card' && card.image_uris?.small ? (
                <img src={card.image_uris.small} alt={card.name} className="w-full mb-2" />
              ) : null}
              <div className="text-sm font-medium">{card.name}</div>
              <div className="text-xs text-gray-600">{card.set_name} #{card.collector_number}</div>
              <div className="text-sm font-bold text-green-700">
                ${card.prices?.usd ?? 'N/A'} USD
              </div>
            </div>
          ))}
        </div>
      )}

      {nextPageUrl && (
        <div className="mt-6">
          <button onClick={handleNextPage} className="bg-gray-800 text-white px-4 py-2 rounded">
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

export default BrowsePage
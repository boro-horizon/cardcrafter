// pages/browse.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { saveAs } from 'file-saver'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Card {
  id?: string
  name: string
  set_name: string
  set: string
  collector_number: string
  rarity?: string
  oracle_text?: string
  image_uris?: { normal: string }
  prices?: { usd?: string }
  owned?: boolean
  quantity?: number
}

export default function Browse() {
  const [cards, setCards] = useState<Card[]>([])
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sets, setSets] = useState<{ code: string; name: string }[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cardsPerPage, setCardsPerPage] = useState(20)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [rarityFilter, setRarityFilter] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState('all')
  const [sortOption, setSortOption] = useState('name')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [showCardText, setShowCardText] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    fetchSets()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.length > 1) fetchAutocomplete(query)
      else setSuggestions([])
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (selectedSet) {
      fetchSetCards(selectedSet, page)
    }
  }, [selectedSet, page, cardsPerPage, rarityFilter, ownershipFilter, sortOption, user])

  async function fetchSets() {
    const res = await fetch('https://api.scryfall.com/sets')
    const data = await res.json()
    if (data?.data) {
      const legalSets = data.data.filter((s: any) => s.set_type !== 'funny')
      setSets(legalSets.map((s: any) => ({ code: s.code, name: s.name })))
    }
  }

  async function fetchSetCards(setCode: string, page = 1) {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=e%3A${setCode}&page=${page}`
    )
    const data = await res.json()
    if (!data?.data) return

    // Sort
    const sorted = [...data.data].sort((a, b) => {
      if (sortOption === 'set') return a.collector_number.localeCompare(b.collector_number)
      return a.name.localeCompare(b.name)
    })

    // Filter rarity & ownership
    let filtered = sorted
    if (rarityFilter) filtered = filtered.filter(c => c.rarity === rarityFilter)
    if (ownershipFilter === 'owned' || ownershipFilter === 'unowned') {
      if (!user) filtered = filtered.filter(() => false) // no cards if not logged in for ownership filter
      else {
        const { data: collection } = await supabase
          .from('collections')
          .select('card_name, collector_number, quantity')
          .eq('user_id', user.id)

        filtered = filtered.filter(card => {
          const owned = collection?.find(
            c => c.card_name === card.name && c.collector_number === card.collector_number
          )
          if (ownershipFilter === 'owned') return Boolean(owned)
          else return !owned
        })

        // Attach ownership info for UI
        filtered = filtered.map(card => {
          const owned = collection?.find(
            c => c.card_name === card.name && c.collector_number === card.collector_number
          )
          return { ...card, owned: Boolean(owned), quantity: owned?.quantity || 0 }
        })
      }
    } else if (user) {
      // Attach ownership info but no filtering
      const { data: collection } = await supabase
        .from('collections')
        .select('card_name, collector_number, quantity')
        .eq('user_id', user.id)

      filtered = filtered.map(card => {
        const owned = collection?.find(
          c => c.card_name === card.name && c.collector_number === card.collector_number
        )
        return { ...card, owned: Boolean(owned), quantity: owned?.quantity || 0 }
      })
    }

    setCards(filtered)
    setTotalPages(Math.ceil(data.total_cards / cardsPerPage))
  }

  async function fetchAutocomplete(q: string) {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`
    )
    const data = await res.json()
    if (data?.data) setSuggestions(data.data)
  }

  async function searchCards(name: string) {
    setShowSuggestions(false)
    setQuery(name)

    let res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    )
    if (res.status === 404) {
      res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`)
    }
    const data = await res.json()
    const results = Array.isArray(data.data) ? data.data : [data]

    if (user) {
      const { data: collection } = await supabase
        .from('collections')
        .select('card_name, collector_number, quantity')
        .eq('user_id', user.id)

      const enhanced = results.map(card => {
        const owned = collection?.find(
          c => c.card_name === card.name && c.collector_number === card.collector_number
        )
        return { ...card, owned: Boolean(owned), quantity: owned?.quantity || 0 }
      })
      setCards(enhanced)
    } else {
      setCards(results)
    }
  }

  async function saveToCollection(card: Card) {
    if (!user) return alert('Please login')
    const { error } = await supabase.from('collections').upsert({
      user_id: user.id,
      card_name: card.name,
      set_name: card.set_name,
      collector_number: card.collector_number,
      quantity: 1,
      added_at: new Date().toISOString(),
      price_at_addition: parseFloat(card.prices?.usd ?? '0') || null,
    })
    if (error) {
      console.error(error)
      alert('Error saving card')
    } else {
      alert(`${card.name} saved to collection`)
    }
  }

  function exportSelected() {
    const rows = Array.from(selectedCards).map(id => {
      const c = cards.find(card => `${card.name}-${card.collector_number}` === id)
      return `${c?.name},${c?.set_name},${c?.collector_number},${c?.prices?.usd ?? ''}`
    })
    const csv = ['Name,Set,Collector #,Price', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    saveAs(blob, 'selected-cards.csv')
  }

  const filteredCards = cards.filter(card => {
    const matchRarity = rarityFilter ? card.rarity === rarityFilter : true
    const matchOwned =
      ownershipFilter === 'owned' ? card.owned : ownershipFilter === 'unowned' ? !card.owned : true
    return matchRarity && matchOwned
  })

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortOption === 'set') return a.set.localeCompare(b.set)
    return a.name.localeCompare(b.name)
  })

  return (
    <>
      <main className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Browse Cards</h1>

        {/* Search box */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search cards by name..."
            className="w-full p-2 border border-gray-300 rounded"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // delay to allow click
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute bg-white border border-gray-300 w-full max-h-48 overflow-auto z-10 rounded shadow-md">
              {suggestions.map(s => (
                <li
                  key={s}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => searchCards(s)}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Set selection */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <select
            value={selectedSet}
            onChange={e => {
              setSelectedSet(e.target.value)
              setPage(1)
            }}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Select a set</option>
            {sets.map(s => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={cardsPerPage}
            onChange={e => setCardsPerPage(parseInt(e.target.value))}
            className="p-2 border border-gray-300 rounded"
          >
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>

          <select
            value={rarityFilter}
            onChange={e => setRarityFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">All rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
          </select>

          <select
            value={ownershipFilter}
            onChange={e => setOwnershipFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="all">All cards</option>
            <option value="owned">Owned only</option>
            <option value="unowned">Unowned only</option>
          </select>

          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="set">Sort by Set Number</option>
          </select>

          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value as 'grid' | 'list')}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCardText}
              onChange={e => setShowCardText(e.target.checked)}
            />
            Show Card Text
          </label>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Cards display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-4 gap-4' : 'space-y-4'}>
          {sortedCards.map(card => {
            const id = `${card.name}-${card.collector_number}`
            return (
              <div
                key={id}
                onClick={() => {
                  const newSet = new Set(selectedCards)
                  if (newSet.has(id)) newSet.delete(id)
                  else newSet.add(id)
                  setSelectedCards(newSet)
                }}
                className={`bg-white rounded shadow p-3 flex flex-col cursor-pointer transition-all duration-300
                  ${selectedCards.has(id) ? 'ring-4 ring-blue-500 scale-105' : 'ring-0 scale-100'}
                `}
                style={{ minHeight: viewMode === 'list' ? 'auto' : '350px' }}
              >
                {viewMode === 'grid' && card.image_uris?.normal && (
                  <img
                    src={card.image_uris.normal}
                    alt={card.name}
                    className="w-full h-[250px] object-contain mb-2 rounded"
                  />
                )}
                <h2 className="font-semibold text-sm">{card.name}</h2>
                <p className="text-xs text-gray-600">{card.set_name}</p>
                <p className="text-xs text-gray-600">
                  #{card.collector_number} • {card.rarity}
                </p>
                {showCardText && card.oracle_text && (
                  <p className="text-xs italic mt-1">{card.oracle_text}</p>
                )}
                <p className="text-sm font-medium mt-1">${card.prices?.usd ?? '—'}</p>
                {card.owned && <p className="text-xs text-green-600">Owned: {card.quantity}</p>}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      saveToCollection(card)
                    }}
                    className="bg-primary text-white py-1 px-3 rounded hover:bg-primaryLight"
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Card = {
  id: string
  name: string
  set: string
  collector_number: string
  prices?: {
    usd: string | null
  }
}

export default function Browse() {
  const [sets, setSets] = useState<any[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [prevPages, setPrevPages] = useState<string[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('https://api.scryfall.com/sets')
      .then(res => res.json())
      .then(data => {
        const mtgSets = data.data.filter((set: any) => set.set_type !== 'funny')
        setSets(mtgSets)
      })
  }, [])

  useEffect(() => {
    if (selectedSet) {
      const url = "https://api.scryfall.com/cards/search?q=set:${selectedSet}&order=collector_number"
      loadCards(url, true)
    }
  }, [selectedSet])

  const loadCards = async (url: string, reset = false) => {
    try {
      const res = await fetch(url)
      const data = await res.json()

      setCards(data?.data ?? [])
      setNextPage(data.next_page ?? null)

      if (reset) {
        setPrevPages([])
      } else if (data?.data?.length > 0) {
        setPrevPages(prev => [...prev, url])
      }
    } catch (err) {
      console.error('Error loading cards:', err)
    }
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) return
    const query = encodeURIComponent(searchTerm)
    const url = "https://api.scryfall.com/cards/search?q=${query}"
    loadCards(url, true)
    setSelectedSet('')
  }

  const goToNext = () => {
    if (nextPage) loadCards(nextPage)
  }

  const goToPrev = () => {
    if (prevPages.length > 1) {
      const pages = [...prevPages]
      pages.pop()
      const prevUrl = pages.pop()!
      setPrevPages(pages)
      loadCards(prevUrl)
    }
  }

  const addToCollection = async (card: Card) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Please sign in.')

    const quantity = quantities[card.id] ?? 1

    const { data: existing } = await supabase
      .from('collections')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('card_name', card.name)
      .eq('set', card.set)
      .eq('collector_number', card.collector_number)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('collections')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
    } else {
      await supabase.from('collections').insert({
        user_id: user.id,
        card_name: card.name,
        set: card.set,
        collector_number: card.collector_number,
        quantity,
      })
    }

    alert("Added ${quantity}x ${card.name} to your collection.")
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Browse Cards</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="border p-2 rounded w-full md:w-1/2"
        >
          <option value="">-- Select MTG Set --</option>
          {sets.map(set => (
            <option key={set.code} value={set.code}>
              {set.name} ({set.code.toUpperCase()})
            </option>
          ))}
        </select>

        <div className="flex flex-row gap-2 w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search any card name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded flex-grow"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </div>
      </div>

      {cards.length > 0 ? (
        <>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th>Set</th>
                <th>#</th>
                <th>Price (CAD)</th>
                <th>Qty</th>
                <th>Add</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const usd = card.prices?.usd ? parseFloat(card.prices.usd) : null
                const cad = usd ? (usd * 1.35).toFixed(2) : 'N/A'

                return (
                  <tr key={card.id} className="border-t">
                    <td className="p-2">{card.name}</td>
                    <td className="text-center">{card.set.toUpperCase()}</td>
                    <td className="text-center">{card.collector_number}</td>
                    <td className="text-center">${cad}</td>
                    <td className="text-center">
                      <input
                        type="number"
                        min={1}
                        value={quantities[card.id] ?? 1}
                        onChange={(e) =>
                          setQuantities({ ...quantities, [card.id]: parseInt(e.target.value) })
                        }
                        className="w-16 border rounded px-1"
                      />
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => addToCollection(card)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex justify-between mt-6">
            <button
              onClick={goToPrev}
              disabled={prevPages.length <= 1}
              className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={!nextPage}
              className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-500">No cards found. Select a set or enter a search above.</p>
      )}
    </div>
  )
}
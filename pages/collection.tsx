// pages/collection.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CollectionCard {
  id: number
  card_name: string
  set_name: string
  collector_number: string
  quantity: number
  price_at_addition?: string | null
  // Add fields for marketPrice, buylistPrice, priceDiff later
  marketPrice?: number
  buylistPrice?: number
  priceDiff?: number
}

export default function Collection() {
  const [cards, setCards] = useState<CollectionCard[]>([])
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedForSell, setSelectedForSell] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Load user session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // Redirect or handle unauthenticated
        window.location.href = '/login'
        return
      }
      setUser(data.session.user)
      loadCollection(data.session.user.id)
    })
  }, [])

  async function loadCollection(userId: string) {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error(error)
      return
    }

    // TODO: Fetch current prices from market and buylist APIs here
    // For now, just set data:
    setCards(data ?? [])
  }

  // Toggles card selection for selling
  function toggleSelect(id: number) {
    setSelectedForSell(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addToSellList() {
    // For demo, save sell list to localStorage or supabase sell_list table later
    const selectedCards = cards.filter(c => selectedForSell.has(c.id))
    console.log('Add to sell list:', selectedCards)
    alert(`Added ${selectedCards.length} cards to your Sell List.`)
    setSelectedForSell(new Set()) // clear selection
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">My Collection</h1>

        <div className="mb-4 flex gap-4 items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            List View
          </button>

          <button
            onClick={addToSellList}
            disabled={selectedForSell.size === 0}
            className="ml-auto bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Add Selected to Sell List
          </button>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white p-2 rounded shadow-sm border relative"
              >
                <input
                  type="checkbox"
                  checked={selectedForSell.has(card.id)}
                  onChange={() => toggleSelect(card.id)}
                  className="absolute top-2 left-2"
                />
                <strong>{card.card_name}</strong>
                <div>Set: {card.set_name}</div>
                <div>Collector #: {card.collector_number}</div>
                <div>Quantity: {card.quantity}</div>
                <div>Price at addition: ${card.price_at_addition ?? 'N/A'}</div>
                {/* TODO: Show marketPrice, buylistPrice, priceDiff here */}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th></th>
                <th className="border border-gray-300 px-2">Name</th>
                <th className="border border-gray-300 px-2">Set</th>
                <th className="border border-gray-300 px-2">Qty</th>
                <th className="border border-gray-300 px-2">Price Added</th>
                <th className="border border-gray-300 px-2">Market Price</th>
                <th className="border border-gray-300 px-2">Buylist Price</th>
                <th className="border border-gray-300 px-2">Price Diff</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="text-center">
                  <td className="border border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedForSell.has(card.id)}
                      onChange={() => toggleSelect(card.id)}
                    />
                  </td>
                  <td className="border border-gray-300 px-2">{card.card_name}</td>
                  <td className="border border-gray-300 px-2">{card.set_name}</td>
                  <td className="border border-gray-300 px-2">{card.quantity}</td>
                  <td className="border border-gray-300 px-2">${card.price_at_addition ?? 'N/A'}</td>
                  <td className="border border-gray-300 px-2">${card.marketPrice ?? '-'}</td>
                  <td className="border border-gray-300 px-2">${card.buylistPrice ?? '-'}</td>
                  <td className="border border-gray-300 px-2">{card.priceDiff ? `$${card.priceDiff.toFixed(2)}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}

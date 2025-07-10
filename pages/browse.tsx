import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Image from 'next/image'

type Card = {
  id: string
  name: string
  set: string
  collector_number: string
  image_uris?: {
    small: string
  }
}

export default function Browse() {
  const [sets, setSets] = useState<any[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card')
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
      fetch("https://api.scryfall.com/cards/search?q=set:${selectedSet}")
        .then(res => res.json())
        .then(data => {
          setCards(data?.data ?? [])
        })
    }
  }, [selectedSet])

  const addToCollection = async (card: Card) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('You must be signed in.')

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

    alert("Added ${quantity} x ${card.name} to your collection.")
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Browse MTG Sets</h2>

      <div className="mb-4 flex gap-4 flex-wrap">
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select a Set</option>
          {sets.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name} ({set.code.toUpperCase()})
            </option>
          ))}
        </select>

        <button
          onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
          className="bg-gray-200 px-3 py-2 rounded text-sm"
        >
          Switch to {viewMode === 'card' ? 'List' : 'Card'} View
        </button>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="border p-2 rounded">
              {card.image_uris?.small ? (
                <Image
                  src={card.image_uris.small}
                  alt={card.name}
                  width={146}
                  height={204}
                />
              ) : (
                <div className="w-[146px] h-[204px] bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  No image
                </div>
              )}
              <div className="mt-1">
                <strong className="text-sm">{card.name}</strong>
                <div className="flex gap-2 mt-1 items-center">
                  <input
                    type="number"
                    min={1}
                    value={quantities[card.id] ?? 1}
                    onChange={(e) =>
                      setQuantities({ ...quantities, [card.id]: parseInt(e.target.value) })
                    }
                    className="w-16 border rounded px-1 text-sm"
                  />
                  <button
                    onClick={() => addToCollection(card)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th>Set</th>
              <th>#</th>
              <th>Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-t">
                <td className="p-2">{card.name}</td>
                <td className="text-center">{card.set.toUpperCase()}</td>
                <td className="text-center">{card.collector_number}</td>
                <td className="text-center">
                  <input
                    type="number"
                    min={1}
                    value={quantities[card.id] ?? 1}
                    onChange={(e) =>
                      setQuantities({ ...quantities, [card.id]: parseInt(e.target.value) })
                    }
                    className="w-14 border rounded px-1 text-sm"
                  />
                </td>
                <td>
                  <button
                    onClick={() => addToCollection(card)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
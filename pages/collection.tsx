import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CollectionPage() {
  const [cardName, setCardName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState('')
  const [collection, setCollection] = useState<any[]>([])

  const fetchCollection = async () => {
    const user = await supabase.auth.getUser()
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.data.user?.id)
    setCollection(data ?? [])
  }

  const addCard = async () => {
    const user = await supabase.auth.getUser()
    if (!user.data.user) return
    const { error } = await supabase.from('collections').insert({
      user_id: user.data.user.id,
      card_name: cardName,
      quantity,
      price_at_addition: price ? parseFloat(price) : null,
    })
    if (error) alert(error.message)
    else {
      setCardName('')
      setQuantity(1)
      setPrice('')
      fetchCollection()
    }
  }

  useEffect(() => {
    fetchCollection()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Your Card Collection</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Card Name"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="border p-2 w-20 rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 w-28 rounded"
        />
        <button onClick={addCard} className="bg-green-600 text-white px-4 rounded">
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {collection.map((card) => (
          <li key={card.id} className="border p-2 rounded shadow">
            <strong>{card.card_name}</strong> — {card.quantity} × ${card.price_at_addition ?? "?"}
          </li>
        ))}
      </ul>
    </div>
  )
}
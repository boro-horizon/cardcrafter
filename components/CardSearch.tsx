import { useState } from 'react'

export default function CardSearch() {
  const [name, setName] = useState('')
  const [card, setCard] = useState<any>(null)

  const searchCard = async () => {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`)
    const data = await res.json()
    setCard(data)
  }

  return (
    <div>
      <input
        type="text"
        className="border px-2 py-1 rounded mr-2"
        placeholder="Enter MTG card name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={searchCard} className="bg-blue-600 text-white px-4 py-1 rounded">
        Search
      </button>

      {card && card.image_uris && (
        <div className="mt-4">
          <img src={card.image_uris.normal} alt={card.name} />
          <p><strong>{card.name}</strong></p>
          <p>Price (USD): ${card.prices.usd || "N/A"}</p>
        </div>
      )}
    </div>
  )
}
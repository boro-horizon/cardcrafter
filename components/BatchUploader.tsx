import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type CardEntry = {
  card_name: string
  set: string
  collector_number: string
  quantity: number
}

export default function BatchUploader({ onUpload }: { onUpload: () => void }) {
  const [rawInput, setRawInput] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const parseLine = (line: string): CardEntry | null => {
    const parts = line.split(/[\s,]+/)
    if (parts.length < 4) return null
    const quantity = parseInt(parts[3])
    if (isNaN(quantity)) return null
    return {
      card_name: parts[0],
      set: parts[1],
      collector_number: parts[2],
      quantity,
    }
  }

  const uploadBatch = async (cards: CardEntry[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('You must be signed in.')

    for (const card of cards) {
      const { data: existing } = await supabase
        .from('collections')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('card_name', card.card_name)
        .eq('set', card.set)
        .eq('collector_number', card.collector_number)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('collections')
          .update({ quantity: existing.quantity + card.quantity })
          .eq('id', existing.id)
      } else {
        await supabase.from('collections').insert({
          user_id: user.id,
          card_name: card.card_name,
          set: card.set,
          collector_number: card.collector_number,
          quantity: card.quantity,
        })
      }
    }

    setRawInput('')
    setCsvFile(null)
    onUpload()
    alert('Batch upload complete!')
  }

  const handleTextUpload = () => {
    const lines = rawInput.trim().split('\n')
    const cards = lines.map(parseLine).filter(Boolean) as CardEntry[]
    if (!cards.length) return alert('No valid entries')
    uploadBatch(cards)
  }

  const handleCSVUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      const entries = lines.slice(1).map((line) => {
        const [card_name, set, collector_number, quantityStr] = line.split(',')
        return {
          card_name: card_name.trim(),
          set: set.trim(),
          collector_number: collector_number.trim(),
          quantity: parseInt(quantityStr.trim()),
        }
      }).filter(card => !isNaN(card.quantity))
      uploadBatch(entries)
    }
    reader.readAsText(file)
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Batch Add Cards</h3>
      <textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="Card Name, Set, Number, Quantity"
        rows={6}
        className="w-full border p-2 rounded mb-2"
      />
      <button
        onClick={handleTextUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Upload Text
      </button>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setCsvFile(file)
            handleCSVUpload(file)
          }
        }}
        className="file:mr-2 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-gray-100"
      />
    </div>
  )
}
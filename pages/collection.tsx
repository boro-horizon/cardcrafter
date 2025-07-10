import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import BatchUploader from '../components/BatchUploader'

export default function CollectionPage() {
  const [collection, setCollection] = useState<any[]>([])

  const fetchCollection = async () => {
    const user = await supabase.auth.getUser()
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.data.user?.id)
    setCollection(data ?? [])
  }

  useEffect(() => {
    fetchCollection()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Your Card Collection</h2>

      <BatchUploader onUpload={fetchCollection} />

      <ul className="space-y-2">
        {collection.map((card) => (
          <li key={card.id} className="border p-2 rounded shadow text-sm">
            <strong>{card.card_name}</strong> ({card.set} #{card.collector_number}) — {card.quantity}
          </li>
        ))}
      </ul>
    </div>
  )
}
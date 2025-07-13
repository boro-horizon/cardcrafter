// pages/index.tsx
import Link from 'next/link'


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-6 max-w-xl">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">CardCrafter</h1>
        <p className="text-gray-700 mb-6 text-lg">
          Track your Magic: The Gathering collection, check market prices, and manage your cards
          with ease.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" className="bg-blue-600 text-white px-5 py-3 rounded shadow">
            Get Started
          </Link>
          <Link href="/collection" className="bg-gray-200 text-gray-800 px-5 py-3 rounded">
            View Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
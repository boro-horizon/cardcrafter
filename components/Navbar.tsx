import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-primary text-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex gap-8 items-center">
        <Link href="/" className="font-bold text-2xl hover:text-primaryLight">
          CardCrafter
        </Link>

        <Link href="/browse" className="hover:text-primaryLight transition">
          Browse
        </Link>
        <Link href="/collection" className="hover:text-primaryLight transition">
          Collection
        </Link>
      </div>

      <div className="text-sm flex items-center gap-4">
        {user ? (
          <>
            <span className="whitespace-nowrap">
              Signed in as <strong>{user.email}</strong>
            </span>
            <button
              onClick={logout}
              className="bg-accent px-3 py-1 rounded text-primary font-semibold hover:bg-accent/90 transition"
              aria-label="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="underline hover:text-primaryLight transition"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

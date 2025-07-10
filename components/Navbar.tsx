import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null)
    })
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  return (
    <nav className="flex justify-between items-center bg-gray-800 text-white px-4 py-3">
      <div className="flex gap-4">
        <Link href="/">Home</Link>
	<Link href="/browse">Browse</Link>
        <Link href="/collection">Collection</Link>
      </div>
      <div className="flex gap-3 items-center">
        {userEmail ? (
          <>
            <span>{userEmail}</span>
            <button onClick={logout} className="text-sm underline">Logout</button>
          </>
        ) : (
          <>
            <Link href="/signup">Signup</Link>
            <Link href="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}
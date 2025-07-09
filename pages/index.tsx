import Head from 'next/head'
import CardSearch from '../components/CardSearch'

export default function Home() {
  return (
    <>
      <Head>
        <title>CardCrafter Lite</title>
      </Head>
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">CardCrafter Lite</h1>
        <CardSearch />
      </main>
    </>
  )
}
import Match3Game from "@/components/game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-100 to-purple-100">
      <h1 className="text-4xl font-bold text-center mb-6 text-indigo-800">Три в ряд</h1>
      <Match3Game />
    </main>
  )
}


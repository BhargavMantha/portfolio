import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="w-full h-screen bg-primary flex items-center justify-center flex-col">
      <h1 className="text-4xl font-bold text-white mb-4">Vite + React + TypeScript</h1>
      <div className="glass-panel p-8">
        <button
          className="glass-button"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p className="text-neutral-gray mt-4">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App

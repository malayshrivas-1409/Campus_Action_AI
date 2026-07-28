import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Campus Action AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Intelligent Notice Management & Eligibility Engine
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome
            </h2>
            <p className="text-gray-600 mb-6">
              This is the beginning of your campus action platform. Get started by logging in or creating an account.
            </p>
            
            <button
              onClick={() => setCount((count) => count + 1)}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors mb-4"
            >
              Get Started ({count})
            </button>
            
            <p className="text-sm text-gray-500">
              Powered by Campus Action AI v0.1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

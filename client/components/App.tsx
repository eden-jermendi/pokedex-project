import { useState, useEffect } from 'react'
import { getPokemon } from '../apiClient.ts'
import { Pokemon, LoadingState } from '../../models/pokemon.ts'
import '../styles/main.css'

function App() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pokemonId, setPokemonId] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const handleClearResults = () => {
    setPokemon(null)
    setError(null)
    setLoadingState('idle')
  }

  const handleGetRandomPokemon = () => {
    const randomId = Math.floor(Math.random() * 905) + 1
    setPokemonId(randomId)
  }

  const handleFetchPokemon = async (id: number | string) => {
    setLoadingState('loading')
    setError(null)
    try {
      const data = await getPokemon(id)
      setPokemon(data)
      // IMPORTANT: Update pokemonId state if the search was by name
      setPokemonId(data.id)
      setLoadingState('success')
    } catch (err) {
      console.error(err)
      setError('Failed to fetch Pokémon. Please try again.')
      setLoadingState('error')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm) {
      handleFetchPokemon(searchTerm.toLowerCase())
    }
  }

  // Fetches a random pokemon on initial load
  useEffect(() => {
    handleGetRandomPokemon()
  }, [])

  // Fetches a pokemon whenever the ID changes
  useEffect(() => {
    // We check pokemonId to avoid running on initial mount when it's 1
    // and the random fetch is already running.
    if (pokemonId) {
      handleFetchPokemon(pokemonId)
    }
  }, [pokemonId])

  return (
    <div className="app-container">
      <h1>Pokemon Explorer</h1>
      <p>
        This example demonstrates a simple API integration with error handling,
        loading states, and TypeScript integration.
      </p>

      <div className="header-controls">
        {/* LEFT GROUP: All action buttons */}
        <div className="button-group">
          {/* Item 1: The "Random" button, on its own */}
          <button
            onClick={handleGetRandomPokemon}
            disabled={loadingState === 'loading'}
            className="button"
          >
            Random
          </button>

          {/* Item 2: A new div for the middle group */}
          <div className="center-buttons">
            <button
              onClick={() => setPokemonId(pokemonId - 1)}
              disabled={pokemonId <= 1 || loadingState === 'loading'}
              className="button"
            >
              Previous
            </button>
            <button
              onClick={() => setPokemonId(pokemonId + 1)}
              disabled={loadingState === 'loading'}
              className="button"
            >
              Next
            </button>
          </div>

          {/* Item 3: The "Clear" button, on its own */}
          <button
            onClick={handleClearResults}
            disabled={loadingState === 'loading'}
            className="button"
          >
            Clear
          </button>
        </div>

        {/* RIGHT GROUP: The search form */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter name or ID"
            disabled={loadingState === 'loading'}
          />
          <button
            type="submit"
            disabled={loadingState === 'loading'}
            className="button"
          >
            Search
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loadingState === 'loading' && (
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Loading Pokemon data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success State */}
      {pokemon && loadingState === 'success' && (
        <div className="pokemon-card">
          <h2 className="pokemon-name">
            {pokemon.name} #{pokemon.id}
          </h2>
          <img
            src={
              pokemon.sprites.other['official-artwork'].front_default ||
              pokemon.sprites.front_default ||
              ''
            }
            alt={pokemon.name}
            className="pokemon-image"
          />
          <div className="pokemon-info">
            <div className="info-item">
              <h3 className="pokemon-ability">Types:</h3>
              <ul className="types-list">
                {pokemon.types.map((type) => (
                  <li key={type.slot} className="pokemon-type">
                    {type.type.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="info-item">
              <h3 className="pokemon-ability">Abilities:</h3>
              <ul className="types-list">
                {pokemon.abilities.map((ability) => (
                  <li key={ability.slot} className="pokemon-type">
                    {ability.ability.name}
                    {ability.is_hidden && ' (Hidden)'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Idle State */}
      {!pokemon && loadingState === 'idle' && (
        <div>
          <p>{`Click "Random" to start!
`}</p>
        </div>
      )}
    </div>
  )
}

export default App

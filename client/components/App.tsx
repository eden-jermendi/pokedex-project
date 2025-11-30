import { useState } from 'react'
import { getRandomPokemon } from '../apiClient.ts'
import { Pokemon, LoadingState } from '../../models/pokemon.ts'
import '../styles/main.css'

function App() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleGetRandomPokemon = async () => {
    // Show loading spinner and clear previous errors
    setLoadingState('loading')
    setError(null)

    try {
      // Fetch a random Pokemon from the API
      const data = await getRandomPokemon()
      // Update state with the fetched Pokemon
      setPokemon(data)
      setLoadingState('success')
    } catch (err) {
      // Log the error for debugging
      console.error('Error fetching random Pokemon:', err)
      // Show an error message to the user
      setError('Failed to fetch random Pokemon. Please try again.')
      setLoadingState('error')
      // Clear any old Pokemon data
      setPokemon(null)
    }
  }

  return (
    <div className="app-container">
      <h1>Pokemon Explorer</h1>
      <p>
        This example demonstrates a simple API integration with error handling,
        loading states, and TypeScript integration.
      </p>

      <div className="search-form">
        <button
          onClick={handleGetRandomPokemon}
          disabled={loadingState === 'loading'}
          className="button"
        >
          {loadingState === 'loading' ? 'Loading...' : 'Get Random Pokemon'}
        </button>
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
      {loadingState === 'idle' && (
        <div>
          <p>{`Click "Get Random Pokemon" to start!`}</p>
        </div>
      )}
    </div>
  )
}

export default App

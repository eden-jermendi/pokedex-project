import { useState, useEffect, useRef } from 'react'
import { getPokemon } from '../apiClient.ts'
import { Pokemon, LoadingState, TYPE_COLORS } from '../../models/pokemon.ts'
import '../styles/main.css'

function App() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pokemonId, setPokemonId] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null) // Ref for the audio element

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

  const playCry = () => {
    if (pokemon && audioRef.current) {
      const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/${pokemon.id}.ogg`
      audioRef.current.src = cryUrl
      audioRef.current.play().catch((error) => console.error('Error playing audio:', error))
    }
  }

  useEffect(() => {
    handleFetchPokemon(pokemonId)
  }, [pokemonId])

  return (
    <div className="pokedex">
      <div className="pokedex-header">
        <div className="camera-lens" />
        <div className="lights">
          <div className="light red" />
          <div className="light yellow" />
          <div className="light green" />
        </div>
      </div>

      <div className="pokedex-screen-container">
        <div className="screen-header">
          <div className="speaker" />
          <div className="speaker" />
        </div>
        <div className="pokedex-screen">
          {loadingState === 'loading' && (
            <div className="loading-container">
              <div className="loading-spinner">🔄</div>
              <p>Loading...</p>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          {pokemon && loadingState === 'success' && (
            <div className="pokemon-card">
              <h2 className="pokemon-name">{pokemon.name}</h2>
              <p className="pokemon-id-display">#{pokemon.id}</p>
              <div className="pokemon-image-container">
                <img
                  src={
                    pokemon.sprites.other['official-artwork'].front_default ||
                    pokemon.sprites.front_default ||
                    ''
                  }
                  alt={pokemon.name}
                  className="pokemon-image"
                />
              </div>
              <div className="pokemon-info">
                <div className="info-item">
                  <h3>Types</h3>
                  <ul className="types-list">
                    {pokemon.types.map((type) => {
                      const typeStyle = TYPE_COLORS[type.type.name] || {
                        background: '#ccc',
                        text: '#000',
                      }
                      return (
                        <li
                          key={type.slot}
                          className="pokemon-type"
                          style={{
                            backgroundColor: typeStyle.background,
                            color: typeStyle.text,
                          }}
                        >
                          {type.type.name}
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div className="info-item">
                  <h3>Abilities</h3>
                  <ul className="abilities-list">
                    {pokemon.abilities.map((ability) => (
                      <li key={ability.slot} className="pokemon-ability">
                        {ability.ability.name}
                        {ability.is_hidden && ' (H)'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {!pokemon && loadingState === 'idle' && (
            <div>
              <p>Press the green button for a random Pokémon!</p>
            </div>
          )}
        </div>
        <div className="aux-controls">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name or ID"
              disabled={loadingState === 'loading'}
            />
            <button
              type="submit"
              className="aux-btn"
              disabled={loadingState === 'loading'}
            >
              Search
            </button>
          </form>
        </div>
      </div>
      <audio ref={audioRef} preload="auto" /> {/* Audio element for cries */}
      <div className="pokedex-controls">
        <div className="d-pad">
          <button
            className="d-pad-btn up"
            onClick={() => setPokemonId(pokemonId + 10)}
            disabled={loadingState === 'loading'}
          />
          <button
            className="d-pad-btn left"
            onClick={() => setPokemonId(pokemonId - 1)}
            disabled={pokemonId <= 1 || loadingState === 'loading'}
          />
          <div className="d-pad-btn center" />
          <button
            className="d-pad-btn right"
            onClick={() => setPokemonId(pokemonId + 1)}
            disabled={loadingState === 'loading'}
          />
          <button
            className="d-pad-btn down"
            onClick={() => setPokemonId(pokemonId - 10)}
            disabled={pokemonId <= 10 || loadingState === 'loading'}
          />
        </div>
        {/* Play Cry Button */}
        <button
          className="play-cry-button"
          onClick={playCry}
          disabled={!pokemon || loadingState === 'loading'}
        >
          🔊
        </button>
        <div className="action-buttons">
          <button
            className="action-btn green"
            onClick={handleGetRandomPokemon}
            disabled={loadingState === 'loading'}
          >
            RANDOM
          </button>
          <button
            className="action-btn blue"
            onClick={handleClearResults}
            disabled={loadingState === 'loading'}
          >
            CLEAR
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

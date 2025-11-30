// Pokemon API response types
// Documentation: https://pokeapi.co/docs/v2

export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  sprites: PokemonSprites
  types: PokemonType[]
  abilities: PokemonAbility[]
  stats: PokemonStat[]
}

export interface PokemonSprites {
  front_default: string | null // Fallback image
  other: {
    'official-artwork': {
      front_default: string | null
    }
  }
}

export interface PokemonType {
  slot: number
  type: {
    name: string
  }
}

export interface PokemonAbility {
  ability: {
    name: string
  }
  is_hidden: boolean
  slot: number
}

export interface PokemonStat {
  base_stat: number
  stat: {
    name: string
  }
}

// For loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

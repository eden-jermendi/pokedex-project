import request from 'superagent'
import { Pokemon } from '../models/pokemon.ts'

/**
 * Fetches a Pokemon by ID or name from the PokeAPI
 *
 * @param identifier - Pokemon name (like "pikachu") or ID number (like 25)
 * @returns Promise that resolves to Pokemon data
 */
export async function getPokemon(identifier: string | number): Promise<Pokemon> {
  // Build the API URL - convert to lowercase for names
  const url = `https://pokeapi.co/api/v2/pokemon/${identifier.toString().toLowerCase()}`

  const response = await request.get(url)
  return response.body
}

/**
 * Fetches a random Pokemon (ID between 1-1010)
 */
export async function getRandomPokemon(): Promise<Pokemon> {
  // Generate a random ID number
  const randomId = Math.floor(Math.random() * 1010) + 1

  // Use our existing getPokemon function
  return getPokemon(randomId)
}

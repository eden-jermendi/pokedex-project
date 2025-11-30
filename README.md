# Consuming External APIs - Client-side API Integration

Learn how to integrate external APIs into React applications using modern JavaScript, proper error handling, and TypeScript best practices.

## Learning Objectives

By completing this exercise, you will be able to:

- **Fetch data** from external APIs using the modern fetch API
- **Handle asynchronous operations** with async/await and proper error handling
- **Manage component state** for loading, success, and error states
- **Type API responses** using TypeScript interfaces
- **Test API integration** with mock data and testing utilities
- **Validate and sanitize** data from external sources
- **Understand CORS** and browser security considerations

## Prerequisites

Before starting this exercise, you should be familiar with:

- React functional components and hooks (useState, useEffect)
- JavaScript promises and async/await
- TypeScript basics (interfaces, types)
- Basic HTTP concepts (GET requests, status codes)

## Setup

### 0. Cloning and installation

- [ ] Clone this repo, navigate to it, install packages, and start the server with `npm run dev`
  <details style="padding-left: 2em">
    <summary>Tip</summary>

  ```sh
  cd consuming-clientside-apis
  npm i
  npm run dev
  ```

  </details>

## Exercise Structure

This exercise is structured as a progressive learning experience with three levels:

### Level 1: Basic API Integration (Guided)
- [ ] Complete the guided example with improved error handling
- [ ] Learn fetch API fundamentals and TypeScript integration

### Level 2: Independent Implementation
- [ ] Choose and integrate a new API from our curated list
- [ ] Implement proper loading states and user feedback

### Level 3: Advanced Features
- [ ] Add data validation and caching
- [ ] Write tests for your API integration
- [ ] Handle edge cases and errors gracefully

## Level 1: Guided Example (Pokemon API)

We've provided a simplified working example using the Pokemon API. Your task is to understand how it works and then modify it.

### Step 1: Explore the Working Example

- [ ] Run `npm run dev` and click the "Get Random Pokemon" button.
- [ ] Observe how loading states and errors are handled.

### Step 2: Understand the Code Structure

- [ ] **API Layer** (`client/apiClient.ts`): See how we make HTTP requests using the `getPokemon` and `getRandomPokemon` functions.
- [ ] **Type Definitions** (`models/pokemon.ts`): Understand how TypeScript interfaces define the structure of the Pokemon API response.
- [ ] **React Component** (`client/components/App.tsx`): See how the UI manages state (`pokemon`, `loadingState`, `error`) and displays data. Note the comments that explain the different rendering states (idle, loading, success, error).

### Step 3 (Easy): Add a "Clear Results" button

- [ ] **Task**: Add a "Clear Results" button that resets the display, returning the component to the 'idle' state.

  <details>
    <summary>Click here for hints</summary>

    1.  **Add a button:** In `App.tsx`, add a new button to your JSX.
        ```tsx
        <button onClick={handleClearResults} className="button">Clear Results</button>
        ```

    2.  **Create a handler function:** This function will reset the `pokemon`, `error`, and `loadingState` back to their initial values.
        ```tsx
        const handleClearResults = () => {
          setPokemon(null)
          setError(null)
          setLoadingState('idle')
        }
        ```
  </details>

### Step 4 (Medium): Fetch data on page load

- [ ] **Task**: Use the `useEffect` hook to fetch a random Pokemon when the page first loads. The "Get Random Pokemon" button should still work for subsequent requests.

  <details>
    <summary>Click here for hints</summary>

    1.  **Import `useEffect`:** First, you need to import the `useEffect` hook from React. Find the line at the top of `App.tsx` that starts with `import { useState }` and add `useEffect` to it.
        ```tsx
        import { useState, useEffect } from 'react'
        ```

    2.  **Call `useEffect`:** Add the following code to your `App` component, after the state declarations. This will call your `handleGetRandomPokemon` function when the component is first rendered.
        ```tsx
        useEffect(() => {
          handleGetRandomPokemon()
        }, [])
        ```

    3.  **Understanding the empty array `[]`:** The empty array `[]` as the second argument to `useEffect` is called the "dependency array". When it's empty, it tells React to only run the effect once, after the initial render. This is perfect for fetching initial data. If you were to omit it, the effect would run after *every* render, causing an infinite loop of API requests!

  </details>

### Step 5 (Hard): Navigate the Pokédex

- [ ] **Task**: Transform the app into a Pokédex explorer. Add "Next" and "Previous" buttons that allow users to browse Pokémon by their Pokédex number.

  <details>
    <summary>Click here for hints</summary>

    1.  **Add state for the Pokémon ID:** In `App.tsx`, you'll need to keep track of the current Pokémon's ID. Start with Pokémon #1 (Bulbasaur).

        ```tsx
        const [pokemonId, setPokemonId] = useState(1)
        ```

    2.  **Create a `useEffect` that fetches by ID:** This effect will run whenever `pokemonId` changes. You can create a new handler function for this.

        ```tsx
        useEffect(() => {
          handleFetchPokemon(pokemonId)
        }, [pokemonId]) // This effect now runs whenever pokemonId changes!

        const handleFetchPokemon = async (id: number) => {
          setLoadingState('loading')
          setError(null)
          try {
            // Use the existing API client function to get a specific Pokémon
            const data = await getPokemon(id)
            setPokemon(data)
            setLoadingState('success')
          } catch (err) {
            console.error(err)
            setError('Failed to fetch Pokémon.')
            setLoadingState('error')
          }
        }
        ```

    3.  **Add "Next" and "Previous" buttons:** Add buttons to your JSX that update the `pokemonId` state.

        ```tsx
        <div>
          <button
            onClick={() => setPokemonId(pokemonId - 1)}
            disabled={pokemonId <= 1}
            className="button"
          >
            Previous
          </button>
          <button onClick={() => setPokemonId(pokemonId + 1)} className="button">
            Next
          </button>
        </div>
        ```

    4.  **What about the random button?** You can keep the "Get Random Pokemon" button. You would just need to modify its handler to generate a random ID and update the `pokemonId` state, which would then automatically trigger your `useEffect`!

        ```tsx
        const handleGetRandomPokemon = () => {
          const randomId = Math.floor(Math.random() * 905) + 1
          setPokemonId(randomId)
        }
        ```

  </details>

### Step 6 (Challenging): Implement search functionality

- [ ] **Task**: Re-implement the search functionality.

  <details>
    <summary>Click here for hints</summary>

    1.  **Add state for the search term:** You'll need a place to store the user's input.
        ```tsx
        const [searchTerm, setSearchTerm] = useState('')
        ```

    2.  **Create the search form:** Add a form to your JSX with an input and a button.
        ```tsx
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Pokemon name or ID"
          />
          <button type="submit">Search</button>
        </form>
        ```

    3.  **Handle the form submission:** Create a function to handle the `onSubmit` event of the form.
        ```tsx
        const handleSearch = (e: React.FormEvent) => {
          e.preventDefault()
          // What should happen when the form is submitted?
        }
        ```

    4.  **Fetch the Pokemon:** Inside your `handleSearch` function, you'll need to call an async function that fetches the pokemon data. This function will be very similar to the `handleGetRandomPokemon` function.

  </details>

## Level 2: Choose Your Own API

### API Categories by Difficulty

<details>
  <summary>🟢 Beginner-Friendly APIs (Simple responses, reliable)</summary>

- **Dog API** (https://dog.ceo/dog-api): Random dog pictures
- **Cat Facts** (https://catfact.ninja): Random cat facts
- **Bored API** (https://www.boredapi.com): Activity suggestions
- **Random Fox** (https://randomfox.ca/floof): Fox pictures

</details>

<details>
  <summary>🟡 Intermediate APIs (More complex data structures)</summary>

- **PokeAPI** (https://pokeapi.co/docs/v2): Pokemon data
- **Star Wars API** (https://swapi.dev): Star Wars universe
- **REST Countries** (https://restcountries.com): Country information
- **Open-Meteo** (https://open-meteo.com/): Weather data

</details>

<details>
  <summary>🔴 Advanced APIs (Complex responses, multiple endpoints)</summary>

- **NASA APIs** (https://api.nasa.gov): Space data (some endpoints are CORS-friendly)
- **GitHub API** (https://docs.github.com/en/rest): Repository data
- **JSONPlaceholder** (https://jsonplaceholder.typicode.com): Mock REST API

</details>

### Discovering API Response Structure

Before you can create TypeScript interfaces, you need to understand what data the API returns. Here are several approaches:

<details style="padding-left: 2em">
  <summary>Method 1: Browser DevTools (Recommended)</summary>

1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Visit the API URL directly (e.g., `https://dog.ceo/api/breeds/image/random`)
4. Click on the request in the Network tab
5. Look at the **Response** tab to see the JSON structure

Example for Dog API:
```json
{
  "message": "https://images.dog.ceo/breeds/hound-afghan/n02088094_1007.jpg",
  "status": "success"
}
```

</details>

<details style="padding-left: 2em">
  <summary>Method 2: Console Logging</summary>

1. Write a quick fetch request to test the API:
```javascript
fetch('https://dog.ceo/api/breeds/image/random')
  .then(response => response.json())
  .then(data => console.log(data))
```

2. Check the browser console to see the response structure
3. Use this to build your TypeScript interface

</details>

<details style="padding-left: 2em">
  <summary>Method 3: API Documentation</summary>

Many APIs provide example responses in their documentation:
- **Dog API**: https://dog.ceo/dog-api/documentation
- **Cat Facts**: https://catfact.ninja/#/
- **PokeAPI**: https://pokeapi.co/docs/v2

Look for sections labeled "Response" or "Example Response"

</details>

<details style="padding-left: 2em">
  <summary>Method 4: Online Interface Generators</summary>

1. Visit https://app.quicktype.io/
2. Paste your JSON response into the left panel
3. Select "TypeScript" from the language dropdown
4. Copy the generated interfaces

This is especially helpful for complex APIs with nested objects.

</details>

### Implementation Steps

1. **Discover the API Structure**: Use one of the methods above to understand the response format
2. **Create Types**: Define TypeScript interfaces based on what you discovered
3. **Write API Function**: Create a function in `apiClient.ts` using fetch
4. **Update Component**: Modify App.tsx to use your new API
5. **Handle Edge Cases**: Add proper error handling and loading states

## Level 3: Advanced Features (Stretch!)

### Data Validation

- [ ] Add runtime validation for API responses
- [ ] Handle malformed or unexpected data gracefully
- [ ] Sanitize user inputs if your API accepts parameters

### Caching

- [ ] Implement basic caching to avoid repeated requests
- [ ] Consider using localStorage for persistence

### Testing

- [ ] Write unit tests for your API functions
- [ ] Mock API responses for reliable testing
- [ ] Test error conditions and edge cases

## Security Considerations

### CORS (Cross-Origin Resource Sharing)
When working with APIs in the browser, you may encounter CORS errors. This is a security feature that protects users. APIs must explicitly allow browser requests.

### Data Validation
Always validate data from external sources:
- Check for required fields
- Validate data types
- Sanitize any user-displayable content

### API Keys
This exercise focuses on public APIs that don't require keys. In production:
- Never expose API keys in client-side code
- Use environment variables and backend proxies
- Implement rate limiting

## Testing Your Implementation

Run the test suite to verify your implementation:

```sh
npm test
```

The tests check for:
- Proper error handling
- TypeScript type safety
- Loading state management
- Data validation

## Common Issues and Solutions

<details>
  <summary>CORS Errors</summary>
  
  If you see a CORS error, the API doesn't support browser requests. Try:
  - Choosing a different API from our list
  - Using a CORS proxy (not recommended for production)
  - Implementing a backend route (advanced)
</details>

<details>
  <summary>Network Timeouts</summary>
  
  Some APIs are slow or unreliable. Implement:
  - Timeout handling
  - Retry logic
  - User feedback for slow requests
</details>

<details>
  <summary>Rate Limiting</summary>
  
  Many APIs limit request frequency. Handle this by:
  - Caching responses
  - Showing appropriate error messages
  - Implementing exponential backoff
</details>

## Resources

- [MDN Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Submitting this Challenge for Marking

This challenge can be used for the following trello assessment(s): 
- **WD02 - Build a Javascript application that consumes a restful JSON API** (Complete Level 2)

---

[Provide feedback on this repo](https://docs.google.com/forms/d/e/1FAIpQLSfw4FGdWkLwMLlUaNQ8FtP2CTJdGDUv6Xoxrh19zIrJSkvT4Q/viewform?usp=pp_url&entry.1958421517=consuming-external-apis)

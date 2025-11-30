/**
 * @file This file showcases advanced techniques for consuming APIs in a robust and performant way.
 * These patterns are designed to handle real-world challenges like network latency,
 * rate limiting, and data consistency.
 * Realistically in the course we'll get a library to handle a lot of these things for us,
 * but it is cool to see how it might work if implemented manually!
 */

import { Pokemon } from '../../models/pokemon.ts'

// ===================================================================================
// Example 1: Custom In-Memory Cache
// ===================================================================================
/**
 * A generic in-memory cache to store frequently accessed data, reducing redundant API calls.
 * This implementation uses a Map and a Time-To-Live (TTL) to automatically expire stale data.
 * Caching is a fundamental optimization for improving application speed and reducing API costs.
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number // Time-to-live in milliseconds

  /**
   * @param ttlMs The duration in milliseconds for which a cache entry is considered valid.
   */
  constructor(ttlMs: number = 300000) {
    // 5 minutes default
    this.ttl = ttlMs
  }

  /**
   * Retrieves an entry from the cache if it exists and has not expired.
   * @param key A unique identifier for the cache entry.
   * @returns The cached data or null if not found or expired.
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key) // Evict expired entry
      return null
    }

    return entry.data
  }

  /**
   * Adds or updates an entry in the cache.
   * @param key A unique identifier for the cache entry.
   * @param data The data to be stored.
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Returns the number of entries currently in the cache.
   */
  size(): number {
    return this.cache.size
  }
}

// ===================================================================================
// Example 2: API Client with Caching and Retry Logic
// ===================================================================================
/**
 * A more sophisticated API client that integrates caching, request timeouts, and automatic retries.
 * This pattern makes API interactions more resilient to transient network failures.
 * It uses "exponential backoff" to wait progressively longer between retries,
 * preventing the client from overwhelming a struggling server.
 */
class AdvancedApiClient {
  private cache = new SimpleCache<any>(300000) // 5-minute cache
  private baseUrl: string
  private defaultTimeout: number
  private maxRetries: number

  constructor(baseUrl: string, timeout = 10000, maxRetries = 3) {
    this.baseUrl = baseUrl
    this.defaultTimeout = timeout
    this.maxRetries = maxRetries
  }

  /**
   * Makes a network request with built-in caching, timeout, and retry capabilities.
   * @param endpoint The API endpoint to request (e.g., '/pokemon/ditto').
   * @param options Configuration for the request, including caching and retry behavior.
   * @returns A promise that resolves with the API response data.
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & {
      useCache?: boolean
      retries?: number
    } = {},
  ): Promise<T> {
    const {
      useCache = true,
      retries = this.maxRetries,
      ...fetchOptions
    } = options
    const url = `${this.baseUrl}${endpoint}`
    const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`

    // Attempt to retrieve from cache for non-POST requests
    if (useCache && fetchOptions.method !== 'POST') {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.log(`[CACHE] Hit for: ${endpoint}`)
        return cached as T
      }
    }

    let lastError: Error | null = null

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.defaultTimeout,
        )

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache successful GET responses
        if (useCache && response.status === 200) {
          this.cache.set(cacheKey, data)
        }

        return data as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        // Do not retry on client-side or "not found" errors
        if (
          lastError.message.includes('404') ||
          lastError.message.includes('400')
        ) {
          break
        }

        // Wait before retrying (e.g., 1s, 2s, 4s)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.log(
            `[RETRY] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Request failed after all retries.')
  }
}

// ===================================================================================
// Example 3: React Hook for API State Management (`useApi`)
// ===================================================================================
/**
 * A custom React hook that simplifies managing the lifecycle of an API request:
 * loading, data, and error states. It also handles request cancellation
 * to prevent memory leaks and race conditions when a component unmounts
 * or its dependencies change before a request completes.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Cancel any pending request from the previous render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      setData(result)
    } catch (err) {
      // Ignore abort errors, which are expected on cleanup
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()

    // Cleanup function to abort the request if the component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// ===================================================================================
// Example 4: Debounced Search Hook (`useDebouncedSearch`)
// ===================================================================================
/**
 * A hook that builds on `useApi` to provide debounced search functionality.
 * Debouncing delays the execution of a function until a certain amount of time
 * has passed without it being called. This is essential for search inputs
 * to prevent firing an API request on every keystroke, saving resources and
 * improving user experience.
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300,
) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Effect to update the debounced query value after the specified delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay])

  // The API call is only triggered when the `debouncedQuery` changes
  const apiState = useApi(
    () =>
      debouncedQuery ? searchFn(debouncedQuery) : Promise.resolve(null as T),
    [debouncedQuery],
  )

  return {
    ...apiState,
    query,
    setQuery,
    isSearching: query !== debouncedQuery || apiState.loading,
  }
}

// ===================================================================================
// Example 5: Pagination Hook (`usePagination`)
// ===================================================================================
/**
 * A custom hook for handling "infinite scroll" or paginated data.
 * It manages the state for loaded items, the current page, and whether more
 * data is available. This pattern is crucial for efficiently displaying large datasets
 * without overwhelming the browser or the backend API.
 */
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  hasMore: boolean
}

export function usePagination<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetchPage(page)
      setItems((prev) => [...prev, ...response.items])
      setHasMore(response.hasMore)
      setPage((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items')
    } finally {
      setLoading(false)
    }
  }, [fetchPage, page, loading, hasMore])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  return { items, loading, error, hasMore, loadMore, reset }
}

// ===================================================================================
// Example 6: Background Sync for Offline Support
// ===================================================================================
/**
 * A class that provides a basic offline queue for API requests.
 * If the application is offline, outgoing requests are stored. When the connection
 * is restored, the queued requests are automatically sent. This is a simplified
 * version of what a Service Worker might do for a full Progressive Web App (PWA).
 */
class BackgroundSync {
  private pendingRequests: Array<{
    url: string
    options: RequestInit
    timestamp: number
  }> = []

  private isOnline = navigator.onLine

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processPendingRequests()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Attempts to make a request, queuing it if the application is offline.
   */
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    if (this.isOnline) {
      try {
        return await fetch(url, options)
      } catch (error) {
        this.queueRequest(url, options)
        throw error
      }
    } else {
      this.queueRequest(url, options)
      throw new Error('Currently offline. Request has been queued.')
    }
  }

  private queueRequest(url: string, options: RequestInit) {
    this.pendingRequests.push({
      url,
      options,
      timestamp: Date.now(),
    })
  }

  private async processPendingRequests() {
    const requestsToProcess = [...this.pendingRequests]
    this.pendingRequests = []

    for (const request of requestsToProcess) {
      try {
        await fetch(request.url, request.options)
        console.log(
          `[SYNC] Successfully synced queued request to ${request.url}`,
        )
      } catch (error) {
        console.error(`[SYNC] Failed to sync request to ${request.url}:`, error)
        // Re-queue if it's a recent failure (e.g., within 1 hour)
        if (Date.now() - request.timestamp < 3600000) {
          this.pendingRequests.push(request)
        }
      }
    }
  }
}

// ===================================================================================
// Example 7: Performance Monitoring
// ===================================================================================
/**
 * A utility class to monitor the performance of API requests.
 * It wraps the `fetch` call to record the duration and status of each request.
 * This data can be used to identify slow endpoints, track error rates, and
 * gain insights into the overall health of the API integration.
 */
class ApiPerformanceMonitor {
  private metrics: Array<{
    url: string
    duration: number
    status: number
    timestamp: number
  }> = []

  /**
   * A wrapper around `fetch` that records performance metrics.
   */
  async monitoredFetch(url: string, options?: RequestInit): Promise<Response> {
    const startTime = performance.now()

    try {
      const response = await fetch(url, options)
      const duration = performance.now() - startTime

      this.recordMetric(url, duration, response.status)

      if (duration > 2000) {
        console.warn(
          `[PERF] Slow API request: ${url} took ${duration.toFixed(2)}ms`,
        )
      }

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(url, duration, 0) // Use status 0 for failed requests
      throw error
    }
  }

  private recordMetric(url: string, duration: number, status: number) {
    this.metrics.push({
      url,
      duration,
      status,
      timestamp: Date.now(),
    })

    // For simplicity, keep only the last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  /**
   * Calculates and returns aggregate statistics about the collected metrics.
   */
  getStats() {
    if (this.metrics.length === 0) return null

    const durations = this.metrics.map((m) => m.duration)
    const successCount = this.metrics.filter(
      (m) => m.status >= 200 && m.status < 300,
    ).length
    const successRate = (successCount / this.metrics.length) * 100

    return {
      averageResponseTime:
        durations.reduce((a, b) => a + b, 0) / durations.length,
      maxResponseTime: Math.max(...durations),
      minResponseTime: Math.min(...durations),
      successRate: successRate,
      totalRequests: this.metrics.length,
    }
  }
}

// ===================================================================================
// Usage Examples
// ===================================================================================

// 1. Initialize the advanced API client for the Pokemon API.
const pokemonApi = new AdvancedApiClient('https://pokeapi.co/api/v2')

// 2. Example of using the custom hooks within a React component.
export function PokemonSearchComponent() {
  // `useCallback` ensures the search function is not recreated on every render.
  const searchPokemon = useCallback(async (query: string) => {
    return pokemonApi.request<Pokemon>(`/pokemon/${query.toLowerCase()}`)
  }, [])

  const { data, loading, error, query, setQuery, isSearching } =
    useDebouncedSearch(searchPokemon)

  // ... component renders UI based on the state (data, loading, error)
  return null // Placeholder for UI
}

// 3. Wrap fetch calls with the performance monitor.
const monitor = new ApiPerformanceMonitor()
export const monitoredFetch = (url: string, options?: RequestInit) =>
  monitor.monitoredFetch(url, options)

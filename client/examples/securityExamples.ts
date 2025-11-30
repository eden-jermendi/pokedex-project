/**
 * @file This file provides examples of crucial security practices for client-side API consumption.
 * These functions and classes help mitigate common vulnerabilities like Cross-Site Scripting (XSS),
 * insecure requests, and data leakage.
 * Realistically in the course we'll work with simple apps that don't go too deep into security,
 * but it is cool to see how it might work if implemented!
 */

// ===================================================================================
// Example 1: Input Sanitization
// ===================================================================================
/**
 * A function to sanitize user-provided input before it's used in an API query.
 * This helps prevent injection attacks where a malicious user might try to insert
 * harmful scripts or query fragments. This is a basic example; for production,
 * consider using a well-vetted library like DOMPurify.
 *
 * @param input The raw string from a user input field.
 * @returns A sanitized string, stripped of common malicious characters.
 */
export function sanitizeInput(input: string): string {
  // A simple approach: remove characters that could be used in XSS attacks.
  return input
    .trim() // Remove leading/trailing whitespace
    .replace(/[<>&"/]/g, '') // Strip HTML/XML characters
    .replace(/javascript:/gi, '') // Remove "javascript:" protocol attempts
    .substring(0, 100) // Enforce a reasonable length to prevent abuse
}

// ===================================================================================
// Example 2: URL Validation
// ===================================================================================
/**
 * Validates a URL to ensure it meets specific security criteria before being used in a fetch request.
 * This is critical when API endpoints might be dynamic. It enforces HTTPS and restricts
 * requests to a whitelist of trusted domains, preventing the client from making requests
 * to malicious or unintended servers.
 *
 * @param url The URL string to validate.
 * @returns `true` if the URL is secure and from an allowed domain, otherwise `false`.
 */
export function isValidApiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Rule 1: Enforce HTTPS to ensure encrypted communication.
    if (urlObj.protocol !== 'https:') {
      console.error('Security Error: URL must use HTTPS.')
      return false
    }
    
    // Rule 2: Use a whitelist of allowed API domains.
    const allowedDomains = [
      'pokeapi.co',
      'dog.ceo',
      'catfact.ninja',
      'api.github.com'
    ]
    
    // Check if the hostname is exactly one of the allowed domains or a subdomain of one.
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    // The URL constructor will throw an error for invalid URL formats.
    return false
  }
}

// ===================================================================================
// Example 3: Response Data Validation
// ===================================================================================
/**
 * A type guard to validate the structure of an API response at runtime.
 * APIs can change, or return unexpected data. Blindly trusting the shape of
 * response data can lead to runtime errors. This function checks if the response
 * object has the expected properties and types.
 *
 * @param response The unknown data received from an API.
 * @returns `true` if the response matches the expected `ApiResponse` interface.
 */
interface ApiResponse {
  data: unknown
  timestamp: string
  source: string
}

export function validateApiResponse(response: unknown): response is ApiResponse {
  if (typeof response !== 'object' || response === null) {
    return false
  }
  
  const obj = response as Record<string, unknown>
  
  // Check for presence and basic type of each expected key.
  return (
    'data' in obj &&
    typeof obj.timestamp === 'string' &&
    typeof obj.source === 'string'
  )
}

// ===================================================================================
// Example 4: Client-Side Rate Limiting
// ===================================================================================
/**
 * A simple client-side rate limiter to prevent sending too many requests in a short period.
 * While true rate limiting is enforced by the server, client-side limiting is a good
 * practice to avoid hitting server limits, reduce unnecessary network traffic, and
 * prevent accidental abuse.
 */
class RateLimiter {
  private requestTimestamps: number[] = []
  private maxRequests: number
  private timeWindowMs: number

  constructor(maxRequests: number = 60, timeWindowMs: number = 60000) { // e.g., 60 requests per minute
    this.maxRequests = maxRequests
    this.timeWindowMs = timeWindowMs
  }

  /**
   * Checks if a new request is allowed based on the rate limit.
   * @returns `true` if the request can proceed, `false` if it's rate-limited.
   */
  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove timestamps that are outside the current time window.
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindowMs
    )
    
    // If we are below the max request count, allow the request.
    if (this.requestTimestamps.length < this.maxRequests) {
      this.requestTimestamps.push(now)
      return true
    }
    
    return false
  }

  /**
   * Calculates how long to wait until the next request can be made.
   * @returns The waiting time in milliseconds.
   */
  getTimeUntilNextRequest(): number {
    if (this.requestTimestamps.length < this.maxRequests) {
      return 0
    }
    
    const oldestRequest = this.requestTimestamps[0]
    return this.timeWindowMs - (Date.now() - oldestRequest)
  }
}

// ===================================================================================
// Example 5: Secure API Client
// ===================================================================================
/**
 * An API client that integrates several security measures: URL validation,
 * rate limiting, and secure defaults for fetch options. This provides a centralized
 * place to enforce security policies for all outgoing API calls.
 */
export class SecureApiClient {
  private rateLimiter: RateLimiter
  
  constructor() {
    this.rateLimiter = new RateLimiter(60, 60000) // 60 requests per minute
  }

  async secureRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    // 1. Check rate limit before making the request.
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getTimeUntilNextRequest()
      throw new Error(`Rate limited. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    // 2. Validate the URL against a whitelist.
    if (!isValidApiUrl(url)) {
      throw new Error('Invalid or unauthorized API URL provided.')
    }

    // 3. Set secure defaults for the fetch request.
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // `credentials: 'omit'` prevents sending cookies or auth headers to third-party APIs.
      credentials: 'omit',
      // `mode: 'cors'` is the default, but being explicit ensures cross-origin safety.
      mode: 'cors',
    }

    const response = await fetch(url, secureOptions)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // In a real app, you would validate the response data structure here.
    // e.g., if (!validateMySpecificDataType(data)) { throw new Error('Invalid response data'); }
    
    return data as T
  }
}

// ===================================================================================
// Example 6: HTML Escaping for Displaying Data
// ===================================================================================
/**
 * A utility to escape HTML content before rendering it in the DOM.
 * If you must use `dangerouslySetInnerHTML` in React (which should be rare),
 * or if you're manipulating the DOM directly, escaping API data prevents
 * Stored XSS attacks, where malicious HTML from an API response could be executed.
 *
 * @param unsafe A string from an API that may contain HTML characters.
 * @returns A string with special HTML characters replaced by their entities.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ===================================================================================
// Example 7: Environment-Specific Configuration
// ===================================================================================
/**
 * Manages different API configurations for development and production environments.
 * This prevents leaking production keys or hitting production endpoints during
 * development. It uses an environment variable (like `NODE_ENV`) to select the
 * appropriate configuration.
 */
export class ApiConfig {
  static readonly ENDPOINTS = {
    development: {
      pokemon: 'https://pokeapi.co/api/v2',
      timeout: 10000,
      retries: 3
    },
    production: {
      pokemon: 'https://pokeapi.co/api/v2',
      timeout: 5000,
      retries: 1
    }
  } as const

  static getConfig() {
    const env = process.env.NODE_ENV || 'development'
    return this.ENDPOINTS[env as keyof typeof this.ENDPOINTS] || this.ENDPOINTS.development
  }
}

// ===================================================================================
// Example 8: Centralized API Error Handler
// ===================================================================================
/**
 * A centralized handler to process API errors and generate user-friendly messages.
 * This pattern ensures that sensitive technical details from error objects are not
 * exposed to the end-user, which could be a security risk. It also provides
 * consistent and helpful feedback.
 */
export class ApiErrorHandler {
  static handle(error: unknown): string {
    // Log the full technical error for developers (e.g., to a monitoring service).
    console.error('API Error:', error)
      
    // Return a generic, safe message to the user.
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
        return 'A network error occurred. Please check your internet connection and try again.'
      }
      if (error.message.includes('timeout')) {
        return 'The request took too long to complete. Please try again.'
      }
      if (error.message.includes('404')) {
        return 'The requested resource could not be found.'
      }
      if (error.message.includes('Rate limited')) {
        return error.message; // Show the user-friendly rate limit message.
      }
    }
    
    // Default message for all other errors.
    return 'An unexpected error occurred. Please try again later.'
  }
}

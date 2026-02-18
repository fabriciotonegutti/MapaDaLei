/**
 * ClassificaAI HTTP client with automatic OAuth2 token caching.
 * Sprint 2: Real integration with classifica-ai FastAPI backend.
 */

const BASE_URL = process.env.CLASSIFICA_AI_URL ?? 'http://localhost:8000'
const EMAIL = process.env.CLASSIFICA_AI_EMAIL ?? 'admin@classifica.ai'
const PASSWORD = process.env.CLASSIFICA_AI_PASSWORD ?? 'admin123'

// Token valid for 24h; refresh 5 min before expiry
const REFRESH_MARGIN_MS = 5 * 60 * 1000

export class ClassificaAIClient {
  private token: string | null = null
  private tokenExpiry: number = 0

  async getToken(): Promise<string> {
    const now = Date.now()

    if (this.token && now < this.tokenExpiry - REFRESH_MARGIN_MS) {
      return this.token
    }

    const form = new URLSearchParams()
    form.append('username', EMAIL)
    form.append('password', PASSWORD)
    form.append('grant_type', 'password')

    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[classifica-ai] Auth failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { access_token: string; token_type: string }
    this.token = data.access_token

    // JWT exp is in seconds from epoch; decode it or just assume 24h
    try {
      const payload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString())
      this.tokenExpiry = payload.exp ? payload.exp * 1000 : now + 24 * 60 * 60 * 1000
    } catch {
      this.tokenExpiry = now + 24 * 60 * 60 * 1000
    }

    return this.token
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async get(path: string, queryParams?: Record<string, string>): Promise<unknown> {
    const headers = await this.authHeaders()
    let url = `${BASE_URL}${path}`
    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString()
      url = `${url}?${qs}`
    }

    const res = await fetch(url, { headers, cache: 'no-store' })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[classifica-ai] GET ${path} failed (${res.status}): ${text}`)
    }

    return res.json()
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const headers = await this.authHeaders()

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[classifica-ai] POST ${path} failed (${res.status}): ${text}`)
    }

    return res.json()
  }
}

// Singleton — shared across all server-side invocations in the same process
export const classificaAI = new ClassificaAIClient()

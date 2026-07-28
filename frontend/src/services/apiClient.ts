export class APIError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!v) return 'http://127.0.0.1:8081'
  return v.replace(/\/$/, '')
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // ignore
    }
    throw new APIError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

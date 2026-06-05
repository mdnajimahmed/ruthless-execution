const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const apiConfig = { baseURL: API_BASE_URL, timeout: 30000 };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: { error?: string } = {};
    try { errorData = await response.json(); } catch {}
    throw new ApiError(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// ─── token refresh ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const { tokenStorage } = await import('./auth');
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    tokenStorage.set(data.token);
    tokenStorage.setRefresh(data.refreshToken);
    return data.token as string;
  } catch {
    return null;
  }
}

function forceLogout() {
  const { tokenStorage } = { tokenStorage: { clear: () => { localStorage.removeItem('auth_token'); localStorage.removeItem('refresh_token'); } } };
  tokenStorage.clear();
  const loginPath = `${import.meta.env.BASE_URL ?? '/'}login`;
  if (!window.location.pathname.includes('login')) {
    window.location.href = loginPath;
  }
}

// ─── request ─────────────────────────────────────────────────────────────────

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _retry = false,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { tokenStorage } = await import('./auth');
  const token = tokenStorage.get();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !_retry) {
    // Attempt silent refresh once
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefresh().finally(() => { isRefreshing = false; refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return apiRequest<T>(endpoint, options, true);
    }
    forceLogout();
    throw new ApiError('Session expired', 401);
  }

  return handleResponse<T>(response);
}

export const api = {
  get:    <T>(endpoint: string)            => apiRequest<T>(endpoint, { method: 'GET' }),
  post:   <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'POST',  body: data ? JSON.stringify(data) : undefined }),
  put:    <T>(endpoint: string, data?: unknown) => apiRequest<T>(endpoint, { method: 'PUT',   body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string)            => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

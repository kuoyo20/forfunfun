export const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

/**
 * HR auth headers. Token comes from VITE_HR_AUTH_TOKEN env var (build-time)
 * or localStorage (set via Settings page).
 */
export function hrHeaders(): Record<string, string> {
  const token =
    import.meta.env.VITE_HR_AUTH_TOKEN ??
    localStorage.getItem("hr-auth-token") ??
    "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function hrFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...hrHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function hrFetchUpload(path: string, body: FormData): Promise<Response> {
  const token =
    import.meta.env.VITE_HR_AUTH_TOKEN ??
    localStorage.getItem("hr-auth-token") ??
    "";
  return fetch(`${API}${path}`, {
    method: "POST",
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

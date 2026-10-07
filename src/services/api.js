const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://rhyzome-back.onrender.com";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || data?.error || `Error HTTP ${response.status}`);
  return data;
}

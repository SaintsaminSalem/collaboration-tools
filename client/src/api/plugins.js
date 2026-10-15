import { authHeaders } from "./auth";

const BASE = "http://localhost:4000/api/plugins";

export async function getCatalog() {
  const res = await fetch(`${BASE}/catalog`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

export async function getInstalled() {
  const res = await fetch(`${BASE}/installed`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load installed plugins");
  return res.json();
}

export async function installPlugin(pluginId) {
  const res = await fetch(`${BASE}/install`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ pluginId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Install failed");
  }
  return res.json();
}

export async function uninstallPlugin(pluginId) {
  await fetch(`${BASE}/install/${encodeURIComponent(pluginId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

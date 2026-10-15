import { authHeaders } from "./auth";

const BASE = "http://localhost:4000/api/databases";

export async function getDatabase(id) {
  const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function createDatabase(name = "Untitled Database") {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function updateDatabase(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function listRows(databaseId) {
  const res = await fetch(`${BASE}/${databaseId}/rows`, { headers: authHeaders() });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function createRow(databaseId) {
  const res = await fetch(`${BASE}/${databaseId}/rows`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ values: {} }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function updateRow(databaseId, rowId, values, expectedVersion) {
  const res = await fetch(`${BASE}/${databaseId}/rows/${rowId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ values, expectedVersion }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 409) throw new Error("conflict");
  return res.json();
}

export async function deleteRow(databaseId, rowId) {
  const res = await fetch(`${BASE}/${databaseId}/rows/${rowId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error("unauthorized");
}

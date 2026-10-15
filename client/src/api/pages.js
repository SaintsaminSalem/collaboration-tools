import { authHeaders } from "./auth";

const BASE = "http://localhost:4000/api/pages";

export async function listPages() {
  const res = await fetch(BASE, { headers: authHeaders() });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function createPage(title = "Untitled") {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function renamePage(id, title) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
}

export async function deletePage(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error("unauthorized");
}

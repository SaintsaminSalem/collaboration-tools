import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { getToken, getUser } from "../api/auth";

const COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635",
  "#34d399", "#22d3ee", "#60a5fa", "#a78bfa",
  "#f472b6", "#fb7185",
];

function colorForUser(id) {
  let hash = 0;
  const s = String(id || "anon");
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function useYDoc(pageId) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const docRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !pageId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const persistence = new IndexeddbPersistence(pageId, doc);
    persistence.on("synced", () => setReady(true));

    const provider = new WebsocketProvider(
      "ws://localhost:4000/ws",
      pageId,
      doc,
      { params: { token }, connect: navigator.onLine }
    );
    providerRef.current = provider;

    const user = getUser();
    provider.awareness.setLocalStateField("user", {
      name: user?.name || "Anonymous",
      color: colorForUser(user?.id),
    });

    provider.on("status", ({ status }) => setConnected(status === "connected"));

    const goOnline = () => provider.connect();
    const goOffline = () => setConnected(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      provider.destroy();
      persistence.destroy();
      doc.destroy();
    };
  }, [pageId]);

  return { doc: docRef.current, provider: providerRef.current, ready, connected };
}

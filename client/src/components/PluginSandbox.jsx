import React, { useEffect, useRef, useCallback } from "react";

/**
 * Loads a plugin inside a sandboxed iframe and exposes a tiny host API:
 *   storage.get / storage.set  — per-block Yjs-backed JSON state
 *
 * Security:
 * - iframe sandbox="allow-scripts" (no same-origin, no top-nav, no forms)
 * - only accepts messages with source === "collab-plugin"
 * - only allows methods in the allowlist derived from plugin permissions
 */
export default function PluginSandbox({ plugin, yMap, height = 120 }) {
  const iframeRef = useRef(null);
  const yMapRef = useRef(yMap);
  yMapRef.current = yMap;

  const allowed = new Set(plugin.permissions || []);

  const getStorage = useCallback(() => {
    const raw = yMapRef.current.get("pluginData");
    return raw === undefined ? null : raw;
  }, []);

  const setStorage = useCallback((value) => {
    const map = yMapRef.current;
    if (!map?.doc) return;
    map.doc.transact(() => {
      map.set("pluginData", value);
    });
  }, []);

  // Push storage changes into iframe when other clients edit
  useEffect(() => {
    const map = yMap;
    if (!map) return;

    const observer = () => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        {
          source: "collab-host",
          method: "storage:changed",
          params: { value: map.get("pluginData") ?? null },
        },
        "*"
      );
    };

    map.observe(observer);
    return () => map.unobserve(observer);
  }, [yMap]);

  useEffect(() => {
    function onMessage(event) {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      const data = event.data;
      if (!data || data.source !== "collab-plugin") return;

      const { id, method, params } = data;

      const reply = (result, error) => {
        iframe.contentWindow.postMessage(
          { source: "collab-host", id, result, error: error || null },
          "*"
        );
      };

      try {
        if (method === "storage.get") {
          if (!allowed.has("storage:block")) return reply(null, "permission denied: storage:block");
          return reply(getStorage());
        }
        if (method === "storage.set") {
          if (!allowed.has("storage:block")) return reply(null, "permission denied: storage:block");
          setStorage(params?.value);
          return reply({ ok: true });
        }
        if (method === "ping") {
          return reply({ pong: true, pluginId: plugin.id });
        }
        reply(null, `Unknown method: ${method}`);
      } catch (err) {
        reply(null, err.message || "host error");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [allowed, getStorage, setStorage, plugin.id]);

  // Plugins are served from the API server
  const src = `http://localhost:4000${plugin.entry}`;

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={plugin.name || plugin.id}
      sandbox="allow-scripts"
      // allow-scripts only — NO allow-same-origin (keeps origin opaque & safer)
      style={{
        width: "100%",
        height,
        border: "none",
        borderRadius: 8,
        background: "transparent",
        display: "block",
      }}
    />
  );
}

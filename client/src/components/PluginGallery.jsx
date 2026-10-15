import React, { useEffect, useState } from "react";
import { getCatalog, getInstalled, installPlugin } from "../api/plugins";

export default function PluginGallery({ open, onClose, onPick }) {
  const [catalog, setCatalog] = useState([]);
  const [installed, setInstalled] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [c, i] = await Promise.all([getCatalog(), getInstalled()]);
      setCatalog(c);
      setInstalled(i);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  const installedIds = new Set(installed.map((p) => p.id));

  const handleInstallAndAdd = async (plugin) => {
    setBusy(plugin.id);
    setError("");
    try {
      if (!installedIds.has(plugin.id)) {
        await installPlugin(plugin.id);
        await load();
      }
      onPick(plugin);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Plugins</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 13 }}>
          Plugins run in a sandboxed iframe and can only use declared permissions.
        </p>
        {error && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 8 }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {catalog.map((p) => {
            const isInstalled = installedIds.has(p.id);
            return (
              <div key={p.id} style={rowStyle}>
                <div style={{ fontSize: 28 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{p.description}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {p.permissions.join(", ")}
                  </div>
                </div>
                <button
                  disabled={busy === p.id}
                  onClick={() => handleInstallAndAdd(p)}
                  style={btnStyle}
                >
                  {busy === p.id ? "..." : isInstalled ? "Add to page" : "Install + Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalStyle = {
  width: 480, maxWidth: "92vw", background: "#fff", borderRadius: 12,
  padding: 20, fontFamily: "sans-serif", boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
};
const rowStyle = {
  display: "flex", gap: 12, alignItems: "center",
  border: "1px solid #eee", borderRadius: 10, padding: 12,
};
const btnStyle = {
  border: "1px solid #c7d2fe", background: "#eef2ff", color: "#3730a3",
  borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600,
};

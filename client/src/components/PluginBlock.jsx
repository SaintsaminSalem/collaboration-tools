import React, { useEffect, useState } from "react";
import PluginSandbox from "./PluginSandbox";
import { getCatalog, getInstalled } from "../api/plugins";

export default function PluginBlock({ yMap }) {
  const pluginId = yMap.get("pluginId");
  const [plugin, setPlugin] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [installed, catalog] = await Promise.all([getInstalled(), getCatalog()]);
        const found =
          installed.find((p) => p.id === pluginId) ||
          catalog.find((p) => p.id === pluginId);
        if (!cancelled) {
          if (!found) setError("Plugin not found or not installed");
          else setPlugin(found);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    if (pluginId) load();
    return () => {
      cancelled = true;
    };
  }, [pluginId]);

  if (!pluginId) {
    return (
      <div style={{ padding: 12, color: "#b91c1c", fontSize: 13 }}>
        Plugin block missing pluginId
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, color: "#b91c1c", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (!plugin) {
    return <div style={{ padding: 12, color: "#999", fontSize: 13 }}>Loading plugin...</div>;
  }

  const height = plugin.id.includes("notes") ? 160 : 88;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        fontSize: 11, color: "#6b7280", padding: "4px 10px",
        background: "#fafafa", borderBottom: "1px solid #f0f0f0",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>{plugin.icon} {plugin.name}</span>
        <span style={{ opacity: 0.7 }}>sandboxed</span>
      </div>
      <PluginSandbox plugin={plugin} yMap={yMap} height={height} />
    </div>
  );
}

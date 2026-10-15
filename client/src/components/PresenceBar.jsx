import React from "react";
import { usePresence } from "../hooks/usePresence";

export default function PresenceBar({ provider }) {
  const users = usePresence(provider);

  if (users.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: -8, marginBottom: 16 }}>
      {users.map((u) => (
        <div
          key={u.clientId}
          title={u.isLocal ? `${u.name} (you)` : u.name}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: u.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px #ddd",
            marginLeft: -8,
            fontFamily: "sans-serif",
          }}
        >
          {u.name.split(" ").map((w) => w[0]).join("")}
        </div>
      ))}
      <span style={{ marginLeft: 16, fontSize: 13, color: "#666", fontFamily: "sans-serif" }}>
        {users.length} {users.length === 1 ? "person" : "people"} viewing
      </span>
    </div>
  );
}

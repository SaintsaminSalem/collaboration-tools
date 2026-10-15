import React, { useState } from "react";
import { getLocalUser } from "../utils/userIdentity";

export default function NameBadge({ provider }) {
  const [user, setUser] = useState(getLocalUser());
  const [editing, setEditing] = useState(false);

  const save = (newName) => {
    const updated = { ...user, name: newName || user.name };
    setUser(updated);
    localStorage.setItem("collab-user", JSON.stringify(updated));
    if (provider) {
      provider.awareness.setLocalStateField("user", { name: updated.name, color: updated.color });
    }
    setEditing(false);
  };

  return (
    <div style={{ fontSize: 13, color: "#666", fontFamily: "sans-serif", padding: "8px 12px" }}>
      You are:{" "}
      {editing ? (
        <input
          autoFocus
          defaultValue={user.name}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save(e.target.value)}
          style={{ fontSize: 13, padding: "2px 4px" }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{ fontWeight: 600, color: user.color, cursor: "pointer" }}
        >
          {user.name} ✎
        </span>
      )}
    </div>
  );
}

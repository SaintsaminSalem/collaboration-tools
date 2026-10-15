import React, { useState, useEffect } from "react";
import { createDatabase } from "../api/databases";
import DatabaseView from "./DatabaseView";

export default function DatabaseBlock({ yMap }) {
  const [databaseId, setDatabaseId] = useState(yMap.get("databaseId") || null);

  useEffect(() => {
    const observer = () => setDatabaseId(yMap.get("databaseId") || null);
    yMap.observe(observer);
    return () => yMap.unobserve(observer);
  }, [yMap]);

  const handleCreate = async () => {
    const db = await createDatabase("Untitled Database");
    yMap.doc.transact(() => yMap.set("databaseId", db._id));
  };

  if (!databaseId) {
    return (
      <button
        onClick={handleCreate}
        style={{
          padding: "10px 14px", border: "1px dashed #ccc", borderRadius: 8,
          background: "#fafafa", cursor: "pointer", color: "#555", fontSize: 14,
        }}
      >
        + Create embedded database
      </button>
    );
  }

  return <DatabaseView databaseId={databaseId} />;
}

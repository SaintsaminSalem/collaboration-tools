import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getDatabase, updateDatabase, listRows, createRow, updateRow, deleteRow,
} from "../api/databases";

const TYPE_OPTIONS = ["text", "number", "checkbox", "select", "date"];
const OPTION_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6"];

export default function DatabaseView({ databaseId }) {
  const [db, setDb] = useState(null);
  const [rows, setRows] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // "table" | "board"
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("text");
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [dbData, rowData] = await Promise.all([getDatabase(databaseId), listRows(databaseId)]);
      setDb(dbData);
      setRows(Array.isArray(rowData) ? rowData : []);
    } catch (err) {
      console.error("Failed to load database:", err);
    }
  }, [databaseId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const handleTitleChange = async (e) => {
    const name = e.target.value;
    setDb((prev) => (prev ? { ...prev, name } : prev));
    await updateDatabase(databaseId, { name });
  };

  const addProperty = async () => {
    if (!newPropName.trim() || !db) return;
    const newProp = {
      id: crypto.randomUUID(),
      name: newPropName.trim(),
      type: newPropType,
      options: newPropType === "select" ? [] : undefined,
    };
    const updated = await updateDatabase(databaseId, {
      properties: [...(db.properties || []), newProp],
    });
    setDb(updated);
    setNewPropName("");
    setNewPropType("text");
    setAddingProp(false);
  };

  const addOptionToProperty = async (propId, label) => {
    if (!db) return;
    const color = OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)];
    const newOption = { id: crypto.randomUUID(), label, color };
    const properties = (db.properties || []).map((p) =>
      p.id === propId ? { ...p, options: [...(p.options || []), newOption] } : p
    );
    const updated = await updateDatabase(databaseId, { properties });
    setDb(updated);
    return newOption;
  };

  const addRow = async (initialValues = {}) => {
    const row = await createRow(databaseId);
    if (row) {
      const updatedValues = { ...(row.values || {}), ...initialValues };
      setRows((prev) => [...prev, { ...row, values: updatedValues }]);
      if (Object.keys(initialValues).length > 0) {
        await updateRow(databaseId, row._id, updatedValues, row.version);
      }
    }
  };

  const removeRow = async (rowId) => {
    await deleteRow(databaseId, rowId);
    setRows((prev) => prev.filter((r) => r._id !== rowId));
  };

  const commitCell = async (row, propId, value) => {
    const currentValues = row.values || {};
    const updatedValues = { ...currentValues, [propId]: value };

    setRows((prev) =>
      prev.map((r) => (r._id === row._id ? { ...r, values: updatedValues } : r))
    );
    try {
      const updated = await updateRow(databaseId, row._id, updatedValues, row.version);
      if (updated) {
        setRows((prev) => prev.map((r) => (r._id === row._id ? { ...updated, values: updated.values || {} } : r)));
      }
    } catch {
      await load();
    }
  };

  if (!db) return <div style={{ padding: 12, color: "#999" }}>Loading database...</div>;

  const properties = db.properties || [];
  const selectProp = properties.find((p) => p.type === "select");

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginTop: 4, background: "#fff" }}>
      {/* Header Bar: Title + View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingRight: 12 }}>
        <input
          value={db.name || ""}
          onChange={handleTitleChange}
          style={{
            border: "none", outline: "none", fontSize: 16, fontWeight: 600,
            padding: "10px 12px", fontFamily: "inherit", flex: 1
          }}
        />
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 6 }}>
          <button
            onClick={() => setViewMode("table")}
            style={{
              border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: viewMode === "table" ? "#fff" : "transparent",
              color: viewMode === "table" ? "#0f172a" : "#64748b",
              boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
            }}
          >
            📋 Table
          </button>
          <button
            onClick={() => setViewMode("board")}
            style={{
              border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: viewMode === "board" ? "#fff" : "transparent",
              color: viewMode === "board" ? "#0f172a" : "#64748b",
              boxShadow: viewMode === "board" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
            }}
          >
            📊 Board
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {properties.map((prop) => (
                    <th key={prop.id} style={thStyle}>
                      {prop.name} <span style={{ color: "#aaa", fontSize: 11 }}>({prop.type})</span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, width: 40 }}>
                    {addingProp ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", fontWeight: 400 }}>
                        <input
                          autoFocus
                          placeholder="Column name"
                          value={newPropName}
                          onChange={(e) => setNewPropName(e.target.value)}
                          style={{ width: 90, fontSize: 12, padding: "2px 4px" }}
                        />
                        <select
                          value={newPropType}
                          onChange={(e) => setNewPropType(e.target.value)}
                          style={{ fontSize: 12 }}
                        >
                          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={addProperty} style={{ fontSize: 12 }}>Add</button>
                      </div>
                    ) : (
                      <span onClick={() => setAddingProp(true)} style={{ cursor: "pointer" }}>+</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowValues = row.values || {};
                  return (
                    <tr key={row._id}>
                      {properties.map((prop) => (
                        <td key={prop.id} style={tdStyle}>
                          <Cell
                            prop={prop}
                            value={rowValues[prop.id]}
                            onChange={(val) => commitCell(row, prop.id, val)}
                            onAddOption={(label) => addOptionToProperty(prop.id, label)}
                          />
                        </td>
                      ))}
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span
                          onClick={() => removeRow(row._id)}
                          style={{ color: "#ccc", cursor: "pointer", fontSize: 12 }}
                          title="Delete row"
                        >
                          ✕
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            onClick={() => addRow()}
            style={{ padding: "8px 12px", cursor: "pointer", color: "#666", fontSize: 13, borderTop: "1px solid #eee" }}
          >
            + New row
          </div>
        </>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === "board" && (
        <KanbanBoard
          selectProp={selectProp}
          properties={properties}
          rows={rows}
          onCommitCell={commitCell}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onAddOption={addOptionToProperty}
        />
      )}
    </div>
  );
}

function KanbanBoard({ selectProp, properties, rows, onCommitCell, onAddRow, onRemoveRow, onAddOption }) {
  if (!selectProp) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
        ⚠️ To use Board View, add a column with type <b>"select"</b> (e.g. Status).
      </div>
    );
  }

  const options = selectProp.options || [];
  const columns = [
    { id: "", label: "Uncategorized", color: "#94a3b8" },
    ...options
  ];

  const firstProp = properties[0];

  return (
    <div style={{ display: "flex", gap: 12, padding: 12, overflowX: "auto", background: "#f8fafc", minHeight: 260 }}>
      {columns.map((col) => {
        const colRows = rows.filter((r) => (r.values || {})[selectProp.id] === col.id);

        return (
          <div key={col.id || "uncat"} style={{ width: 220, minWidth: 220, background: "#f1f5f9", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>
                ● {col.label} ({colRows.length})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {colRows.map((row) => {
                const titleVal = firstProp ? (row.values || {})[firstProp.id] : "";
                return (
                  <div key={row._id} style={{ background: "#fff", padding: 10, borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "relative" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      {titleVal || <i style={{ color: "#aaa" }}>Untitled</i>}
                    </div>

                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      <Cell
                        prop={selectProp}
                        value={(row.values || {})[selectProp.id]}
                        onChange={(val) => onCommitCell(row, selectProp.id, val)}
                        onAddOption={onAddOption}
                      />
                    </div>

                    <span
                      onClick={() => onRemoveRow(row._id)}
                      style={{ position: "absolute", top: 6, right: 6, color: "#cbd5e1", cursor: "pointer", fontSize: 11 }}
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onAddRow({ [selectProp.id]: col.id })}
              style={{ marginTop: 8, border: "none", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer", textAlign: "left", padding: "4px" }}
            >
              + New card
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Cell({ prop, value, onChange, onAddOption }) {
  const [local, setLocal] = useState(value ?? "");

  useEffect(() => setLocal(value ?? ""), [value]);

  if (prop.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }

  if (prop.type === "select") {
    const options = prop.options || [];
    const selected = options.find((o) => o.id === value);
    return (
      <select
        value={value || ""}
        onChange={async (e) => {
          if (e.target.value === "__new__") {
            const label = window.prompt("New option name:");
            if (!label) return;
            const newOption = await onAddOption(label);
            if (newOption) onChange(newOption.id);
          } else {
            onChange(e.target.value);
          }
        }}
        style={{
          fontSize: 12, padding: "2px 6px", borderRadius: 4, border: "none",
          background: selected ? selected.color : "#e2e8f0",
          color: selected ? "#fff" : "#334155", fontWeight: 600
        }}
      >
        <option value="">-</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        <option value="__new__">+ New option...</option>
      </select>
    );
  }

  if (prop.type === "date") {
    return (
      <input
        type="date"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        style={{ border: "none", fontSize: 13 }}
      />
    );
  }

  if (prop.type === "number") {
    return (
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local === "" ? null : Number(local))}
        style={{ border: "none", fontSize: 13, width: 80 }}
      />
    );
  }

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      style={{ border: "none", fontSize: 13, width: "100%", outline: "none" }}
    />
  );
}

const thStyle = {
  textAlign: "left", padding: "8px 12px", fontWeight: 600, fontSize: 12,
  color: "#555", borderBottom: "1px solid #eee", whiteSpace: "nowrap",
};
const tdStyle = { padding: "6px 12px", borderBottom: "1px solid #f2f2f2" };
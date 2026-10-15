import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listPages, createPage, deletePage } from "../api/pages";
import { getUser, clearSession } from "../api/auth";

export default function Sidebar() {
  const [pages, setPages] = useState([]);
  const [user] = useState(getUser());
  const navigate = useNavigate();
  const { pageId: activePageId } = useParams();

  const load = async () => {
    try {
      const data = await listPages();
      setPages(data);
    } catch {
      // unauthorized — parent will redirect
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const page = await createPage("Untitled");
    await load();
    navigate(`/page/${page._id}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this page?")) return;
    await deletePage(id);
    await load();
    if (activePageId === id) navigate("/");
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <div style={{
      width: 240,
      borderRight: "1px solid #eee",
      height: "100vh",
      padding: 12,
      boxSizing: "border-box",
      fontFamily: "sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <button
        onClick={handleCreate}
        style={{
          width: "100%",
          padding: "8px 10px",
          marginBottom: 12,
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
        }}
      >
        + New page
      </button>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {pages.map((p) => (
          <div
            key={p._id}
            onClick={() => navigate(`/page/${p._id}`)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              background: activePageId === p._id ? "#eef2ff" : "transparent",
              marginBottom: 2,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.icon || "📄"} {p.title}
            </span>
            <span
              onClick={(e) => handleDelete(e, p._id)}
              style={{ color: "#999", fontSize: 12, padding: "0 4px" }}
              title="Delete page"
            >
              ✕
            </span>
          </div>
        ))}

        {pages.length === 0 && (
          <div style={{ color: "#999", fontSize: 13, marginTop: 8 }}>
            No pages yet — create one above.
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {user?.name || "User"}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis" }}>
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "6px 8px", fontSize: 12,
            border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

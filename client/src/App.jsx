import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PageEditorRoute from "./components/PageEditorRoute";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { getToken, getUser, clearSession } from "./api/auth";

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());

  const handleAuth = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            token ? <Navigate to="/" replace /> : <LoginPage onAuth={handleAuth} />
          }
        />
        <Route
          path="/register"
          element={
            token ? <Navigate to="/" replace /> : <RegisterPage onAuth={handleAuth} />
          }
        />
        <Route
          path="/*"
          element={
            token ? (
              <WorkspaceLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function WorkspaceLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route path="/page/:pageId" element={<PageEditorRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 40, color: "#999", fontFamily: "sans-serif" }}>
      Select a page from the sidebar, or create a new one.
    </div>
  );
}

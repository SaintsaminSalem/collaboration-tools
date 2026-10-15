require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");

const { verifyToken } = require("./auth");
const { setupWSConnection } = require("./wsServer");
const databaseRoutes = require("./routes/databases");
const pageRoutes = require("./routes/pages");
const authRoutes = require("./routes/auth");
const pluginRoutes = require("./routes/plugins");

const app = express();
app.use(cors());
app.use(express.json());

// Plugin bundles (static HTML/JS) — public read, no secrets inside
app.use("/plugins", express.static(path.join(__dirname, "plugins")));

app.use("/api/auth", authRoutes);
app.use("/api/databases", databaseRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/plugins", pluginRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const user = verifyToken(token);
    req.user = user;
    req.pageId = decodeURIComponent(url.pathname.replace("/", ""));

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } catch (err) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
});

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req, { docName: req.pageId });
});

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
  server.listen(process.env.PORT || 4000, () =>
    console.log(`Server running on http://localhost:${process.env.PORT || 4000}`)
  );
}
start().catch((err) => {
  console.error("Failed to start server:", err.message);
});

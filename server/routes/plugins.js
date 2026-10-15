const router = require("express").Router();
const PluginInstall = require("../models/PluginInstall");
const { authMiddleware } = require("../middleware/authMiddleware");

// Official catalog (static for v1 — no arbitrary remote code upload)
const CATALOG = [
  {
    id: "com.example.counter",
    name: "Counter",
    description: "A simple collaborative counter widget",
    version: "1.0.0",
    permissions: ["ui:render", "storage:block"],
    entry: "/plugins/counter/index.html",
    icon: "🔢",
  },
  {
    id: "com.example.notes",
    name: "Sticky Note",
    description: "Colored sticky note block",
    version: "1.0.0",
    permissions: ["ui:render", "storage:block"],
    entry: "/plugins/notes/index.html",
    icon: "📝",
  },
];

router.use(authMiddleware);

// List catalog
router.get("/catalog", (req, res) => {
  res.json(CATALOG);
});

// List installed plugins for this workspace
router.get("/installed", async (req, res) => {
  const installs = await PluginInstall.find({ workspaceId: req.user.id, enabled: true });
  const installedIds = new Set(installs.map((i) => i.pluginId));
  const detailed = CATALOG.filter((p) => installedIds.has(p.id)).map((p) => ({
    ...p,
    installed: true,
  }));
  res.json(detailed);
});

// Install a catalog plugin
router.post("/install", async (req, res) => {
  const { pluginId } = req.body;
  const meta = CATALOG.find((p) => p.id === pluginId);
  if (!meta) return res.status(404).json({ error: "Plugin not in catalog" });

  const doc = await PluginInstall.findOneAndUpdate(
    { workspaceId: req.user.id, pluginId },
    { enabled: true, installedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ ...meta, installed: true, installId: doc._id });
});

// Uninstall
router.delete("/install/:pluginId", async (req, res) => {
  await PluginInstall.findOneAndUpdate(
    { workspaceId: req.user.id, pluginId: req.params.pluginId },
    { enabled: false }
  );
  res.status(204).end();
});

module.exports = router;

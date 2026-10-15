const router = require("express").Router();
const crypto = require("crypto");
const { DatabaseModel, RowModel } = require("../models/Database");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

async function assertDbOwner(dbId, userId) {
  return DatabaseModel.findOne({ _id: dbId, workspaceId: userId });
}

router.get("/", async (req, res) => {
  const dbs = await DatabaseModel.find({ workspaceId: req.user.id });
  res.json(dbs);
});

router.get("/:id", async (req, res) => {
  const db = await assertDbOwner(req.params.id, req.user.id);
  if (!db) return res.status(404).json({ error: "Database not found" });
  res.json(db);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  const db = await DatabaseModel.create({
    name: name || "Untitled Database",
    workspaceId: req.user.id,
    properties: [{ id: crypto.randomUUID(), name: "Name", type: "text" }],
    views: [
      { id: crypto.randomUUID(), name: "Table", type: "table", groupBy: null },
    ],
  });
  res.json(db);
});

router.patch("/:id", async (req, res) => {
  const owned = await assertDbOwner(req.params.id, req.user.id);
  if (!owned) return res.status(404).json({ error: "Database not found" });

  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.properties !== undefined) update.properties = req.body.properties;
  if (req.body.views !== undefined) update.views = req.body.views;

  const db = await DatabaseModel.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(db);
});

router.get("/:id/rows", async (req, res) => {
  const owned = await assertDbOwner(req.params.id, req.user.id);
  if (!owned) return res.status(404).json({ error: "Database not found" });
  const rows = await RowModel.find({ databaseId: req.params.id }).sort({ createdAt: 1 });
  res.json(rows);
});

router.post("/:id/rows", async (req, res) => {
  const owned = await assertDbOwner(req.params.id, req.user.id);
  if (!owned) return res.status(404).json({ error: "Database not found" });
  const row = await RowModel.create({
    databaseId: req.params.id,
    values: req.body.values || {},
  });
  res.json(row);
});

router.patch("/:id/rows/:rowId", async (req, res) => {
  const owned = await assertDbOwner(req.params.id, req.user.id);
  if (!owned) return res.status(404).json({ error: "Database not found" });

  const { values, expectedVersion } = req.body;
  const row = await RowModel.findOneAndUpdate(
    { _id: req.params.rowId, version: expectedVersion },
    { $set: { values }, $inc: { version: 1 }, updatedAt: new Date() },
    { new: true }
  );
  if (!row) return res.status(409).json({ error: "Version conflict, refetch row" });
  res.json(row);
});

router.delete("/:id/rows/:rowId", async (req, res) => {
  const owned = await assertDbOwner(req.params.id, req.user.id);
  if (!owned) return res.status(404).json({ error: "Database not found" });
  await RowModel.deleteOne({ _id: req.params.rowId });
  res.status(204).end();
});

module.exports = router;

const router = require("express").Router();
const mongoose = require("mongoose");
const Page = require("../models/Page");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

// List only this user's pages
router.get("/", async (req, res) => {
  const workspaceId = req.user.id;
  const pages = await Page.find({ workspaceId }).sort({ createdAt: 1 });
  res.json(pages);
});

// Create page in this user's workspace
router.post("/", async (req, res) => {
  const { title } = req.body;
  const page = await Page.create({
    title: title || "Untitled",
    workspaceId: req.user.id,
  });
  res.json(page);
});

// Rename / update — only if owned by this user
router.patch("/:id", async (req, res) => {
  const { title, icon } = req.body;
  const update = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (icon !== undefined) update.icon = icon;

  const page = await Page.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.user.id },
    update,
    { new: true }
  );
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json(page);
});

// Delete — only if owned by this user
router.delete("/:id", async (req, res) => {
  const page = await Page.findOneAndDelete({
    _id: req.params.id,
    workspaceId: req.user.id,
  });
  if (!page) return res.status(404).json({ error: "Page not found" });

  const db = mongoose.connection.db;
  await db.collection("pageupdates").deleteMany({ pageId: req.params.id });
  await db.collection("pagesnapshots").deleteMany({ pageId: req.params.id });

  res.status(204).end();
});

module.exports = router;

const mongoose = require("mongoose");
const Y = require("yjs");

const UpdateSchema = new mongoose.Schema({
  pageId: { type: String, index: true },
  seq: Number,
  update: Buffer,
  createdAt: { type: Date, default: Date.now },
});
const SnapshotSchema = new mongoose.Schema({
  pageId: { type: String, unique: true },
  state: Buffer,
  version: Number,
  updatedAt: { type: Date, default: Date.now },
});

const UpdateModel = mongoose.models.PageUpdate || mongoose.model("PageUpdate", UpdateSchema);
const SnapshotModel = mongoose.models.PageSnapshot || mongoose.model("PageSnapshot", SnapshotSchema);

const COMPACT_THRESHOLD = 100;

async function loadDoc(pageId) {
  const doc = new Y.Doc();
  const snapshot = await SnapshotModel.findOne({ pageId });
  if (snapshot) Y.applyUpdate(doc, snapshot.state);
  const updates = await UpdateModel.find({ pageId }).sort({ seq: 1 });
  updates.forEach((u) => Y.applyUpdate(doc, u.update));
  return doc;
}

async function persistUpdate(pageId, update) {
  const count = await UpdateModel.countDocuments({ pageId });
  await UpdateModel.create({ pageId, seq: count + 1, update: Buffer.from(update) });
  if (count + 1 >= COMPACT_THRESHOLD) await compact(pageId);
}

async function compact(pageId) {
  const doc = await loadDoc(pageId);
  const state = Buffer.from(Y.encodeStateAsUpdate(doc));
  await SnapshotModel.findOneAndUpdate(
    { pageId },
    { state, version: Date.now(), updatedAt: new Date() },
    { upsert: true }
  );
  await UpdateModel.deleteMany({ pageId });
  doc.destroy();
}

module.exports = { loadDoc, persistUpdate, compact };

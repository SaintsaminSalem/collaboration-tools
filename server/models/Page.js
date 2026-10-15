const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  workspaceId: { type: String, default: "default", index: true },
  title: { type: String, default: "Untitled" },
  icon: { type: String, default: "📄" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Page", PageSchema);

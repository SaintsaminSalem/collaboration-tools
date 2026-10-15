const mongoose = require("mongoose");

const PluginSchema = new mongoose.Schema({
  pluginId: { type: String, required: true }, // e.g. "com.example.counter"
  workspaceId: { type: String, required: true, index: true },
  enabled: { type: Boolean, default: true },
  installedAt: { type: Date, default: Date.now },
});

PluginSchema.index({ workspaceId: 1, pluginId: 1 }, { unique: true });

module.exports = mongoose.model("PluginInstall", PluginSchema);

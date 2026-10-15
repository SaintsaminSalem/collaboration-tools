const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
  id: String,
  name: String,
  type: { type: String, enum: ["text", "number", "select", "date", "relation", "checkbox"] },
  options: [{ id: String, label: String, color: String }],
});

const ViewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: "Table" },
  type: { type: String, enum: ["table", "board", "gallery"], default: "table" },
  groupBy: { type: String, default: null }, // property id for board
  filters: { type: mongoose.Schema.Types.Mixed, default: [] },
  sorts: { type: mongoose.Schema.Types.Mixed, default: [] },
});

const DatabaseSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  properties: [PropertySchema],
  views: {
    type: [ViewSchema],
    default: () => [
      {
        id: require("crypto").randomUUID(),
        name: "Table",
        type: "table",
        groupBy: null,
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

const RowSchema = new mongoose.Schema({
  databaseId: { type: String, index: true },
  values: { type: mongoose.Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = {
  DatabaseModel: mongoose.model("Database", DatabaseSchema),
  RowModel: mongoose.model("DatabaseRow", RowSchema),
};

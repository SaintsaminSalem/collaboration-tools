import { Schema } from "prosemirror-model";

export const richSchema = new Schema({
  nodes: {
    doc: { content: "text*" },
    text: { group: "inline" },
  },
  marks: {
    strong: {
      parseDOM: [{ tag: "strong" }, { tag: "b" }],
      toDOM: () => ["strong", 0],
    },
    em: {
      parseDOM: [{ tag: "em" }, { tag: "i" }],
      toDOM: () => ["em", 0],
    },
    underline: {
      parseDOM: [{ tag: "u" }],
      toDOM: () => ["u", 0],
    },
    strike: {
      parseDOM: [{ tag: "s" }, { tag: "strike" }],
      toDOM: () => ["s", 0],
    },
    code: {
      parseDOM: [{ tag: "code" }],
      toDOM: () => ["code", 0],
    },
  },
});

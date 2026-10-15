import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { toggleMark } from "prosemirror-commands";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo as yUndo, redo as yRedo } from "y-prosemirror";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { richSchema } from "../utils/richSchema";
import DatabaseBlock from "./DatabaseBlock";
import PluginBlock from "./PluginBlock";

const TYPE_STYLES = {
  paragraph: { fontSize: 16, fontWeight: 400 },
  heading1: { fontSize: 28, fontWeight: 700 },
  heading2: { fontSize: 22, fontWeight: 700 },
  heading3: { fontSize: 18, fontWeight: 600 },
  todo: { fontSize: 16, fontWeight: 400 },
  bullet: { fontSize: 16, fontWeight: 400 },
};

function ensureXmlFragment(yMap) {
  let existing = yMap.get("content");
  const isXmlFragment =
    existing &&
    typeof existing.toArray === "function" &&
    (existing.constructor?.name === "XmlFragment" || existing instanceof Y.XmlFragment);

  if (isXmlFragment) {
    try {
      const children = existing.toArray();
      let isClean = true;
      for (const child of children) {
        const isXmlElement = child && typeof child.toArray === "function" && child.nodeName !== undefined;
        const isXmlText = child && (child.constructor?.name === "XmlText" || child instanceof Y.XmlText);
        if (!isXmlElement && !isXmlText) {
          isClean = false;
          break;
        }
      }
      if (isClean) return existing;
    } catch (e) {}
  }

  const fresh = new Y.XmlFragment();
  const doc = yMap.doc;
  if (doc) doc.transact(() => yMap.set("content", fresh));
  else yMap.set("content", fresh);
  return fresh;
}

export default function Block({ id, yMap, awareness, onEnter, onBackspaceEmpty, onDelete }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [type, setType] = useState(yMap.get("type") || "paragraph");
  const [checked, setChecked] = useState(!!yMap.get("checked"));
  const [showToolbar, setShowToolbar] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  useEffect(() => {
    const observer = () => {
      setType(yMap.get("type") || "paragraph");
      setChecked(!!yMap.get("checked"));
    };
    yMap.observe(observer);
    return () => yMap.unobserve(observer);
  }, [yMap]);

  useEffect(() => {
    if (type === "database" || type === "plugin") return;
    if (!editorRef.current) return;

    let isMounted = true;
    const fragment = ensureXmlFragment(yMap);

    const plugins = [ySyncPlugin(fragment)];
    if (awareness) plugins.push(yCursorPlugin(awareness));
    plugins.push(yUndoPlugin());
    plugins.push(
      keymap({
        "Mod-z": yUndo,
        "Mod-y": yRedo,
        "Mod-Shift-z": yRedo,
        "Mod-b": toggleMark(richSchema.marks.strong),
        "Mod-i": toggleMark(richSchema.marks.em),
        "Mod-u": toggleMark(richSchema.marks.underline),
        Enter: () => {
          onEnter && onEnter();
          return true;
        },
        Backspace: (state) => {
          if (state.doc.textContent.length === 0) {
            onBackspaceEmpty && onBackspaceEmpty();
            return true;
          }
          return false;
        },
      })
    );
    plugins.push(history());

    const state = EditorState.create({ schema: richSchema, plugins });

    let view;
    const dispatchTransaction = (tr) => {
      if (!isMounted || !view || view.isDestroyed) return;
      try {
        view.updateState(view.state.apply(tr));
      } catch (err) {}
    };

    try {
      view = new EditorView(editorRef.current, {
        state,
        dispatchTransaction,
        handleDOMEvents: {
          focus: () => {
            setShowToolbar(true);
            return false;
          },
        },
      });
    } catch (err) {
      if (yMap.doc) yMap.doc.transact(() => yMap.set("content", new Y.XmlFragment()));
      return;
    }

    viewRef.current = view;
    return () => {
      isMounted = false;
      if (view) {
        view.destroy();
        viewRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yMap, type]);

  const applyMark = (markName) => {
    const view = viewRef.current;
    if (!view) return;
    toggleMark(richSchema.marks[markName])(view.state, view.dispatch);
    view.focus();
  };

  const changeType = (newType) => {
    yMap.doc.transact(() => yMap.set("type", newType));
  };

  const toggleChecked = () => {
    yMap.doc.transact(() => yMap.set("checked", !checked));
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "4px 0",
    position: "relative",
  };

  const dragHandle = (
    <span
      {...attributes}
      {...listeners}
      style={{ cursor: "grab", color: "#ccc", paddingTop: 4, userSelect: "none", touchAction: "none" }}
    >
      ⠿
    </span>
  );

  if (type === "database") {
    return (
      <div ref={setNodeRef} style={style}>
        {dragHandle}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
            <span onClick={onDelete} style={{ color: "#ccc", cursor: "pointer", fontSize: 12 }} title="Delete">🗑</span>
          </div>
          <DatabaseBlock yMap={yMap} />
        </div>
      </div>
    );
  }

  if (type === "plugin") {
    return (
      <div ref={setNodeRef} style={style}>
        {dragHandle}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
            <span onClick={onDelete} style={{ color: "#ccc", cursor: "pointer", fontSize: 12 }} title="Delete">🗑</span>
          </div>
          <PluginBlock yMap={yMap} />
        </div>
      </div>
    );
  }

  const textStyle = {
    ...TYPE_STYLES[type],
    flex: 1,
    minHeight: 24,
    textDecoration: type === "todo" && checked ? "line-through" : "none",
    color: type === "todo" && checked ? "#999" : "#111",
  };

  return (
    <div ref={setNodeRef} style={style} onBlur={() => setShowToolbar(false)}>
      {dragHandle}

      {type === "todo" && (
        <input type="checkbox" checked={checked} onChange={toggleChecked} style={{ marginTop: 6 }} />
      )}
      {type === "bullet" && <span style={{ paddingTop: 4 }}>•</span>}

      <div style={{ flex: 1, position: "relative" }}>
        {showToolbar && (
          <div style={{
            position: "absolute", top: -38, left: 0, display: "flex", alignItems: "center",
            gap: 2, background: "#222", padding: "4px 6px", borderRadius: 6, zIndex: 10,
          }}>
            <ToolbarBtn label="B" onClick={() => applyMark("strong")} bold />
            <ToolbarBtn label="I" onClick={() => applyMark("em")} italic />
            <ToolbarBtn label="U" onClick={() => applyMark("underline")} underline />
            <ToolbarBtn label="S" onClick={() => applyMark("strike")} strike />
            <ToolbarBtn label="</>" onClick={() => applyMark("code")} mono />
            <select
              value={type}
              onChange={(e) => changeType(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ marginLeft: 8, fontSize: 12 }}
            >
              <option value="paragraph">Text</option>
              <option value="heading1">Heading 1</option>
              <option value="heading2">Heading 2</option>
              <option value="heading3">Heading 3</option>
              <option value="todo">To-do</option>
              <option value="bullet">Bullet</option>
            </select>
            <span
              onMouseDown={(e) => { e.preventDefault(); onDelete && onDelete(); }}
              style={{ marginLeft: 8, color: "#f88", cursor: "pointer", fontSize: 13 }}
            >
              🗑
            </span>
          </div>
        )}
        <div ref={editorRef} style={textStyle} />
      </div>
    </div>
  );
}

function ToolbarBtn({ label, onClick, bold, italic, underline, strike, mono }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        background: "transparent", border: "none", color: "#fff",
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline ? "underline" : strike ? "line-through" : "none",
        fontFamily: mono ? "monospace" : "inherit",
        cursor: "pointer", padding: "3px 7px", fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

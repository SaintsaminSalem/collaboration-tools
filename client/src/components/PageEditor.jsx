import React, { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useYDoc } from "../hooks/useYDoc";
import { generateKeyBetween } from "../utils/fractionalIndex";
import { renamePage } from "../api/pages";
import Block from "./Block";
import PresenceBar from "./PresenceBar";
import PluginGallery from "./PluginGallery";

export default function PageEditor({ pageId, initialTitle }) {
  const { doc, provider, ready, connected } = useYDoc(pageId);
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState(initialTitle || "Untitled");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const titleDebounce = useRef(null);

  useEffect(() => {
    setTitle(initialTitle || "Untitled");
  }, [initialTitle, pageId]);

  const yBlocks = doc ? doc.getArray("blocks") : null;

  const syncFromY = useCallback(() => {
    if (!yBlocks) return;
    const arr = yBlocks.toArray().sort((a, b) => (a.get("order") > b.get("order") ? 1 : -1));
    setBlocks(arr.map((m) => ({ id: m.get("id"), map: m })));
  }, [yBlocks]);

  useEffect(() => {
    if (!yBlocks) return;
    syncFromY();
    yBlocks.observeDeep(syncFromY);
    return () => yBlocks.unobserveDeep(syncFromY);
  }, [yBlocks, syncFromY]);

  const createBlockMap = (order, type = "paragraph", extra = {}) => {
    const yMap = new Y.Map();
    yMap.set("id", crypto.randomUUID());
    yMap.set("type", type);
    yMap.set("checked", false);
    yMap.set("content", new Y.XmlFragment());
    yMap.set("order", order);
    Object.entries(extra).forEach(([k, v]) => yMap.set(k, v));
    return yMap;
  };

  const addBlock = () => {
    const lastOrder = blocks.length ? blocks[blocks.length - 1].map.get("order") : null;
    const newOrder = generateKeyBetween(lastOrder, null);
    const yMap = createBlockMap(newOrder);
    doc.transact(() => yBlocks.push([yMap]));
  };

  const addDatabaseBlock = () => {
    const lastOrder = blocks.length ? blocks[blocks.length - 1].map.get("order") : null;
    const newOrder = generateKeyBetween(lastOrder, null);
    const yMap = createBlockMap(newOrder, "database");
    doc.transact(() => yBlocks.push([yMap]));
  };

  const addPluginBlock = (plugin) => {
    const lastOrder = blocks.length ? blocks[blocks.length - 1].map.get("order") : null;
    const newOrder = generateKeyBetween(lastOrder, null);
    const yMap = createBlockMap(newOrder, "plugin", {
      pluginId: plugin.id,
      pluginData: null,
    });
    doc.transact(() => yBlocks.push([yMap]));
  };

  const insertBlockAfter = (afterId) => {
    const idx = blocks.findIndex((b) => b.id === afterId);
    const prevOrder = blocks[idx].map.get("order");
    const nextOrder = blocks[idx + 1] ? blocks[idx + 1].map.get("order") : null;
    const newOrder = generateKeyBetween(prevOrder, nextOrder);
    const yMap = createBlockMap(newOrder);
    doc.transact(() => {
      const arrIdx = yBlocks.toArray().findIndex((m) => m.get("id") === afterId);
      yBlocks.insert(arrIdx + 1, [yMap]);
    });
  };

  const deleteBlock = (blockId) => {
    doc.transact(() => {
      const arr = yBlocks.toArray();
      const idx = arr.findIndex((m) => m.get("id") === blockId);
      if (idx !== -1) yBlocks.delete(idx, 1);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);

    const prev = reordered[newIndex - 1] ? reordered[newIndex - 1].map.get("order") : null;
    const next = reordered[newIndex + 1] ? reordered[newIndex + 1].map.get("order") : null;
    const newOrder = generateKeyBetween(prev, next);

    doc.transact(() => {
      reordered[newIndex].map.set("order", newOrder);
    });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      renamePage(pageId, newTitle).catch(() => {});
    }, 500);
  };

  if (!ready) return <div>Loading offline copy...</div>;

  return (
    <div style={{ padding: "20px 40px", maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          padding: "6px 12px",
          marginBottom: 16,
          borderRadius: 6,
          display: "inline-block",
          background: connected ? "#d1fae5" : "#fee2e2",
          color: connected ? "#065f46" : "#991b1b"
        }}>
          {connected ? "Synced" : "Offline - changes saved locally"}
        </div>
        <PresenceBar provider={provider} />
      </div>

      <input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        style={{
          fontSize: 32, fontWeight: 700, border: "none", outline: "none",
          width: "100%", marginBottom: 16, fontFamily: "inherit"
        }}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((b) => (
            <Block
              key={b.id}
              id={b.id}
              yMap={b.map}
              awareness={provider ? provider.awareness : null}
              onEnter={() => insertBlockAfter(b.id)}
              onBackspaceEmpty={() => deleteBlock(b.id)}
              onDelete={() => deleteBlock(b.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={addBlock}>+ Add block</button>
        <button onClick={addDatabaseBlock}>+ Add database</button>
        <button onClick={() => setGalleryOpen(true)}>+ Add plugin</button>
      </div>

      <PluginGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onPick={addPluginBlock}
      />
    </div>
  );
}

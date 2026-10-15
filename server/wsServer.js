const Y = require("yjs");
const syncProtocol = require("y-protocols/sync.js");
const awarenessProtocol = require("y-protocols/awareness.js");
const encoding = require("lib0/encoding.js");
const decoding = require("lib0/decoding.js");
const { loadDoc, persistUpdate } = require("./yjs-mongo-persistence");

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

const rooms = new Map(); // pageId -> { doc, awareness, conns: Set<ws> }

async function getRoom(pageId) {
  if (rooms.has(pageId)) return rooms.get(pageId);

  const doc = await loadDoc(pageId);
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Set();

  doc.on("update", (update, origin) => {
    persistUpdate(pageId, update).catch(console.error);
    const message = encodeUpdateMessage(update);
    conns.forEach((ws) => {
      if (ws !== origin && ws.readyState === 1) ws.send(message);
    });
  });

  const room = { doc, awareness, conns };
  rooms.set(pageId, room);
  return room;
}

function encodeUpdateMessage(update) {
  const enc = encoding.createEncoder();
  encoding.writeVarUint(enc, MSG_SYNC);
  syncProtocol.writeUpdate(enc, update);
  return encoding.toUint8Array(enc);
}

async function setupWSConnection(ws, req, { docName }) {
  const room = await getRoom(docName);
  room.conns.add(ws);

  const syncEnc = encoding.createEncoder();
  encoding.writeVarUint(syncEnc, MSG_SYNC);
  syncProtocol.writeSyncStep1(syncEnc, room.doc);
  ws.send(encoding.toUint8Array(syncEnc));

  const states = room.awareness.getStates();
  if (states.size > 0) {
    const awEnc = encoding.createEncoder();
    encoding.writeVarUint(awEnc, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awEnc,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys()))
    );
    ws.send(encoding.toUint8Array(awEnc));
  }

  ws.on("message", (data) => {
    const buf = new Uint8Array(data);
    const dec = decoding.createDecoder(buf);
    const type = decoding.readVarUint(dec);

    if (type === MSG_SYNC) {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MSG_SYNC);
      syncProtocol.readSyncMessage(dec, enc, room.doc, ws);
      if (encoding.length(enc) > 1) ws.send(encoding.toUint8Array(enc));
    } else if (type === MSG_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(dec),
        ws
      );
      room.conns.forEach((other) => {
        if (other !== ws && other.readyState === 1) other.send(buf);
      });
    }
  });

  ws.on("close", () => {
    room.conns.delete(ws);
    if (room.conns.size === 0) {
      setTimeout(() => {
        if (room.conns.size === 0) rooms.delete(docName);
      }, 60000);
    }
  });
}

module.exports = { setupWSConnection };

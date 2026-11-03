import { io, type Socket } from "socket.io-client";
import { onCacheClear } from "./cache";
import { ensureAccess, refreshSession } from "./client";
import { socketUrl } from "./config";
import { tokenStore } from "./tokens";

/** Presence heartbeat (the gateway keeps presence for 60s; the collection asks for 25–45s). */
const HEARTBEAT_MS = 30_000;

let socket: Socket | null = null;
let users = 0;
let heartbeat: ReturnType<typeof setTimeout> | null = null;

function beat() {
  heartbeat = setTimeout(() => {
    if (socket?.connected) socket.emit("heartbeat", {});
    beat();
  }, HEARTBEAT_MS);
}

function stopBeat() {
  if (heartbeat) clearTimeout(heartbeat);
  heartbeat = null;
}

/** The current access token for each (re)connect, so a refreshed token is used after it rotates. */
function withToken(target: Socket) {
  const token = tokenStore.access() ?? "";
  target.auth = { token };
  // The gateway documents the handshake token as a query parameter (48Date-WebSockets `00`).
  target.io.opts.query = { token };
}

function create(): Socket {
  const next = io(socketUrl, { autoConnect: false, transports: ["websocket", "polling"], withCredentials: false });
  next.io.on("reconnect_attempt", () => withToken(next));
  // One token refresh per failure streak: a handshake still refused afterwards isn't retried in a loop.
  let refreshed = false;
  next.on("connect", () => {
    refreshed = false;
    beat();
  });
  next.on("disconnect", (reason) => {
    stopBeat();
    // The server closed the connection (an expired or missing token): refresh once and come back.
    if (reason !== "io server disconnect" || refreshed || users <= 0) return;
    refreshed = true;
    void refreshSession().then((ok) => {
      if (ok && users > 0) {
        withToken(next);
        next.connect();
      }
    });
  });
  // A rejected handshake: refresh the session once, then reconnect with the new token.
  next.on("connect_error", (error) => {
    if (refreshed || !/auth|token|unauthor/i.test(error.message)) return;
    refreshed = true;
    void refreshSession().then((ok) => {
      if (ok && users > 0) {
        withToken(next);
        next.connect();
      }
    });
  });
  return next;
}

/**
 * The Socket.IO connection, opened while at least one screen needs live events (a conversation,
 * the inbox, a game) and closed when the last one lets go. Call `release` when done.
 */
export function acquireSocket(): { socket: Socket; release: () => void } {
  socket ??= create();
  users += 1;
  const current = socket;
  // Connect only with a real token: after a reload the access token is fetched first (an empty
  // token makes the gateway accept and then drop the connection).
  if (!current.connected && !current.active && tokenStore.hasSession()) {
    void ensureAccess().then((token) => {
      if (!token || users <= 0 || socket !== current || current.connected) return;
      withToken(current);
      current.connect();
    });
  }
  let released = false;
  return {
    socket: current,
    release() {
      if (released) return;
      released = true;
      users -= 1;
      if (users <= 0 && socket === current) {
        users = 0;
        stopBeat();
        current.disconnect();
      }
    },
  };
}

/** Sign-out: close the connection so no event for the previous member arrives. */
onCacheClear(() => {
  stopBeat();
  socket?.disconnect();
  socket?.removeAllListeners();
  socket = null;
  users = 0;
});

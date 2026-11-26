import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import grader from './grade.mjs';
import chat from './chat.mjs';

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const allowedOrigin = process.env.PAGES_ORIGIN || 'https://iuphysics.github.io';
const limit = 8;
const minute = 60_000;
let quota = { count: 0, expires: 0 };
let chatQuota = { count: 0, expires: 0 };

const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PAGES_ORIGIN: new URL(allowedOrigin).origin,
  takeGradeSlot() {
    const now = Date.now();
    if (quota.expires <= now) quota = { count: 0, expires: now + minute };
    if (quota.count >= limit) return false;
    quota.count++;
    return true;
  },
  takeChatSlot() {
    const now = Date.now();
    if (chatQuota.expires <= now) chatQuota = { count: 0, expires: now + minute };
    if (chatQuota.count >= 10) return false;
    chatQuota.count++;
    return true;
  },
};

const server = createServer(async (incoming, outgoing) => {
  // A single shared quota limits the API balance used by this small study group.
  try {
    if (!incoming.url?.startsWith('/') || incoming.url.startsWith('//')) {
      outgoing.writeHead(400).end();
      return;
    }
    const request = new Request(new URL(incoming.url, 'http://localhost'), {
      method: incoming.method,
      headers: new Headers(incoming.headers),
      ...(incoming.method === 'POST' ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}),
    });
    const response = await (new URL(request.url).pathname === '/chat' ? chat : grader).fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (!outgoing.headersSent) outgoing.writeHead(500).end();
    else outgoing.destroy();
  }
});

server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(port, host, () => console.log(`Energetics grader listening on ${host}:${port}`));

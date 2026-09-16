import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import 'dotenv/config';
import { createHttpApp } from './http.js';
import { attachWebSocket } from './ws.js';
import { initializeAutoConnect } from './sessions.js';
const app = createHttpApp();
const server = http.createServer(app);
attachWebSocket(server);
if (process.env.NODE_ENV === 'production') {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  app.use(express.static(root));
  app.get('*', (_, res) => res.sendFile(path.join(root, 'index.html')));
}
await initializeAutoConnect();
server.listen(Number(process.env.PORT || 8080), () =>
  console.log('Ostad server listening on http://localhost:' + Number(process.env.PORT || 8080)),
);

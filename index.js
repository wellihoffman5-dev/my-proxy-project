import express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import wisp from 'wisp-server-node';

import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';

const app = express();
const server = createServer();
const PORT = process.env.PORT || 8080;

// Your own files first (index.html, uv.config.js, sw.js, proxy.js)
app.use(express.static(join(process.cwd(), 'public')));

// Proxy engine files, served from the folders the packages report
app.use('/uv/', express.static(uvPath));
app.use('/epoxy/', express.static(epoxyPath));
app.use('/baremux/', express.static(baremuxPath));

// Anything else is a 404
app.use((req, res) => {
    res.status(404).sendFile(join(process.cwd(), 'public', '404.html'));
});

server.on('request', (req, res) => {
    app(req, res);
});

// WebSocket connection the proxy uses to reach the internet
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy backend running on port ${PORT}`);
});

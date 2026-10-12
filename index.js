import express from 'express';
import { createServer } from 'node:http';
import { wispRoute } from 'wisp-server-node';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux';
import { join } from 'node:path';

const app = express();
const server = createServer();
const PORT = process.env.PORT || 8080;

// Serve frontend layout files from the public folder
app.use(express.static(join(process.cwd(), 'public')));

// Automatically route prebuilt proxy binaries out of node_modules
app.use('/uv/', express.static(uvPath));
app.use('/epoxy/', express.static(epoxyPath));
app.use('/baremux/', express.static(baremuxPath));

// Fallback 404 error layout routing
app.use((req, res) => {
    res.status(404).sendFile(join(process.cwd(), 'public', '404.html'));
});

// Pass normal HTTP traffic to Express routing mapping
server.on('request', (req, res) => {
    app(req, res);
});

// Pass secure proxy connection routing straight to the Wisp websocket server
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/wisp/')) {
        wispRoute(req, socket, head);
    } else {
        socket.end();
    }
});

// Force the server to listen on the correct environment host port binding
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy backend running on port ${PORT}`);
});

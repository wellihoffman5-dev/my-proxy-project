import express from 'express';
import { createServer } from 'node:http';
import { wispRoute } from 'wisp-server-node';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { join } from 'node:path';

const app = express();
const server = createServer();
const PORT = process.env.PORT || 8080;

// Serve your frontend public folder
app.use(express.static(join(process.cwd(), 'public')));

// Route the core Ultraviolet and Epoxy script folders
app.use('/uv/', express.static(uvPath));
app.use('/epoxy/', express.static(epoxyPath));

// Route Bare-Mux using a clean path string instead of an import variable
app.use('/baremux/', express.static(join(process.cwd(), 'node_modules', '@mercuryworkshop', 'bare-mux', 'dist')));

// Fallback error route
app.use((req, res) => {
    res.status(404).sendFile(join(process.cwd(), 'public', '404.html'));
});

server.on('request', (req, res) => {
    app(req, res);
});

server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/wisp/')) {
        wispRoute(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy backend running on port ${PORT}`);
});

import express from 'express';
import { createServer } from 'node:http';
import wisp from 'wisp-server-node';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { join } from 'node:path';

const app = express();
const server = createServer();
const PORT = process.env.PORT || 8080;

// Serve public directory frontend files
app.use(express.static(join(process.cwd(), 'public')));

// Map public tracking layers
app.use('/uv/', express.static(uvPath));
app.use('/epoxy/', express.static(epoxyPath));

// Route BareMux asset folder explicitly from node_modules
app.use('/baremux/', express.static(join(process.cwd(), 'node_modules', '@mercuryworkshop', 'bare-mux', 'dist')));

// Fallback 404 handler
app.use((req, res) => {
    res.status(404).sendFile(join(process.cwd(), 'public', '404.html'));
});

// Link Express application tracking straight to server instance
server.on('request', (req, res) => {
    app(req, res);
});

// Securely upgrade network traffic headers for proxy tracking
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

// Force container port connection
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy backend running on port ${PORT}`);
});

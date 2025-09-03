const { v2 } = require('webdav-server');
const express = require('express');
const basicAuth = require('basic-auth');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware de autenticación básica
const auth = (req, res, next) => {
    const credentials = basicAuth(req);
    
    if (!credentials || 
        credentials.name !== process.env.WEBDAV_USERNAME || 
        credentials.pass !== process.env.WEBDAV_PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="WebDAV Server"');
        return res.status(401).send('Acceso no autorizado');
    }
    next();
};

// Configuración del servidor WebDAV
const server = new v2.WebDAVServer({
    port: process.env.PORT || 3000,
    autoSave: {
        onServerStart: true,
        treeFilePath: './tree.json'
    },
    autoLoad: {
        treeFilePath: './tree.json'
    }
});

// Ruta principal para WebDAV
app.use('/webdav', auth, (req, res) => {
    server.executeRequest(req, res);
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'WebDAV Server is running' });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send('WebDAV Server - Usa un cliente WebDAV para acceder');
});

const PORT = process.env.PORT || 3000;

server.start(() => {
    console.log(`WebDAV Server running on port ${server.options.port}`);
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    server.stop(() => {
        console.log('WebDAV Server stopped');
        process.exit(0);
    });
});

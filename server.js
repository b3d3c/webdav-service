const { v2 } = require('webdav-server');
const express = require('express');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');

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

// Configuración del servidor WebDAV con soporte CalDAV
const server = new v2.WebDAVServer({
    port: process.env.PORT || 3000,
    autoSave: {
        onServerStart: true,
        treeFilePath: '/data/tree.json'
    },
    autoLoad: {
        treeFilePath: '/data/tree.json'
    },
    // Habilitar soporte para CalDAV
    enableCalDAV: true
});

// Crear estructura inicial para calendarios
server.afterRequest((ctx, next) => {
    const rootPath = '/';
    server.getFileSystem(rootPath, (e, rootFS) => {
        if (!e) {
            // Crear carpeta de calendarios si no existe
            rootFS.create('/calendars', true, () => {});
        }
    });
    next();
});

// Ruta principal para WebDAV/CalDAV
app.use('/webdav', auth, (req, res) => {
    server.executeRequest(req, res);
});

// Ruta específica para calendarios
app.use('/calendars', auth, (req, res) => {
    server.executeRequest(req, res);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'WebDAV/CalDAV Server is running' });
});

app.get('/', (req, res) => {
    res.send('WebDAV/CalDAV Server - Usa un cliente CalDAV para acceder');
});

const PORT = process.env.PORT || 3000;

server.start(() => {
    console.log(`WebDAV/CalDAV Server running on port ${server.options.port}`);
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const config = require('./config');
const asambleasRoutes = require('./modulos/asambleas/rutas');
const path = require('path');

const app = express();

// CONFIGURAR CORS
app.use(cors({
    origin: '*'
}));

// SETTINGS
app.set('port', config.app.port);

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Modificar esta línea para usar la nueva estructura de rutas
app.use('/api.asambleasdedios.gt/api/asambleas', asambleasRoutes);

// SERVIR IMAGENES ESTÁTICAMENTE
app.use('/api.asambleasdedios.gt/imagenes', express.static(path.join(__dirname, '..', 'imagenes')));

// SERVIR ARCHIVOS ESTÁTICAMENTE
app.use('/api.asambleasdedios.gt/archivos', express.static(path.join(__dirname, '..', 'archivos')));

module.exports = app;
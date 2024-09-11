const express = require('express');
const config = require('./config');
const asambleasRoutes = require('./modulos/asambleas/rutas');

const app = express();

// SETTINGS
app.set('port', config.app.port);

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RUTAS
app.use('/api/asambleas', asambleasRoutes);

module.exports = app;
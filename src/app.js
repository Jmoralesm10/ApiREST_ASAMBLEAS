const express = require('express');
const config = require('./config');
const login = require('./modulos/asambleas/rutas');

const app = express();

//SETTINGS
app.set('port', config.app.port);

//RUTAS
app.use('/api/login', login);


module.exports = app;
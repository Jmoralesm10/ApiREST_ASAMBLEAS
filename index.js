const app = require('./src/app');
const config = require('./src/config');

// Modificar la ruta raíz para que coincida con la ruta configurada
app.get('/api.asambleasdedios.gt/', (req, res) => {
    res.send('FUNCIONANDO');
});

app.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`Server is running on port ${config.app.port}`);
});

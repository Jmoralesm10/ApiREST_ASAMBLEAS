const app = require('./src/app');
const config = require('./src/config');

app.get('/', (req, res) => {
    res.send('FUNCIONANDO');
  });

app.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`Server is running on port ${config.app.port}`);
});
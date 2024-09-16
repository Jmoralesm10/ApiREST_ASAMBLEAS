require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT || 3000
    },
    db: {
        host: process.env.DB_HOST || '195.250.27.25',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Javier123.',
        database: process.env.DB_NAME || 'db_restapi'
    },
    jwtSecret: process.env.JWT_SECRET || 'clave_secreta_para_jwt'
}

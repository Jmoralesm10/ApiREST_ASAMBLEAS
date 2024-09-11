const db = require('../../DB/mysql');
const bcrypt = require('bcrypt');

const login = (req, res) => {
    const { email, password } = req.body;
    db.login(email, password, (error, result) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        // Aquí deberías manejar el resultado exitoso del login
        res.status(200).json(result);
    });
};

const registrarUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.registrarusuario({ email, password: hashedPassword }, (error, result) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }
            res.status(201).json(result);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', details: error.message });
    }
};

module.exports = {
    login,
    registrarUsuario
};
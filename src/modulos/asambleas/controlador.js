const db = require('../../DB/mysql');

const login = (req, res) => {
    const { email, password } = req.body;
    db.login(email, password, (error, result) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        
    });
};

module.exports = {
    login
};
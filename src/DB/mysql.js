const mysql = require('mysql');
const config = require('../config');

function login(user, password) {
    const query = `SELECT * FROM users WHERE user = '${user}' AND password = '${password}'`;
    return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });
}
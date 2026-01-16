const db = require('../database/db');

const User = {
  findByUsername: (username) => {
    return db('users').where({ username }).first();
  },
  
  findById: (id) => {
    return db('users').where({ id }).first().select('id', 'username', 'email', 'role');
  },

  create: (userData) => {
    return db('users').insert(userData).returning(['id', 'username', 'email', 'role']);
  }
};

module.exports = User;
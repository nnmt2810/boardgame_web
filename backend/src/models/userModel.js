const knex = require('knex')(require('../../knexfile').development);

const User = {
  findByUsername: (username) => {
    return knex('users').where({ username }).first();
  },
  
  findById: (id) => {
    return knex('users').where({ id }).first().select('id', 'username', 'email', 'role');
  },

  create: (userData) => {
    return knex('users').insert(userData).returning(['id', 'username', 'email', 'role']);
  }
};

module.exports = User;
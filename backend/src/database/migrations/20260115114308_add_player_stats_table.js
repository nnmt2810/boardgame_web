
exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.integer('total_wins').defaultTo(0);
    table.integer('snake_high_score').defaultTo(0);
  });
};


exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('total_wins');
    table.dropColumn('snake_high_score');
  });
};

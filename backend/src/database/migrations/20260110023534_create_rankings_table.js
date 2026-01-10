exports.up = function(knex) {
  return knex.schema.createTable('rankings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE');
    table.integer('high_score').defaultTo(0);
    table.integer('total_wins').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rankings');
};
exports.up = function(knex) {
  return knex.schema.createTable('ratings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE');
    table.integer('rating').notNullable(); // 1-5 stars
    table.timestamps(true, true);
    table.unique(['user_id', 'game_id']); // Một user chỉ rate một game một lần
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ratings');
};

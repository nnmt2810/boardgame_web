exports.up = function(knex) {
    return knex.schema.createTable('games', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable(); // Tên game
      table.string('code').unique().notNullable(); // Mã game
      table.integer('default_size').defaultTo(10); // Kích thước ma trận mặc định
      table.boolean('is_active').defaultTo(true);
      table.text('instruction'); // Hướng dẫn chơi
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('games');
  };
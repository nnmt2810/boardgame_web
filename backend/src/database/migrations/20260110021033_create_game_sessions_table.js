exports.up = function(knex) {
    return knex.schema.createTable('game_sessions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE');
      
      // Lưu trạng thái ma trận (Ví dụ: [[0,1,0],[2,0,1]...])
      table.jsonb('matrix_state').notNullable(); 
      
      table.integer('current_score').defaultTo(0);
      table.integer('time_elapsed').defaultTo(0); // Thời gian đã chơi
      table.string('status').defaultTo('playing'); // playing, saved, finished
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('game_sessions');
  };
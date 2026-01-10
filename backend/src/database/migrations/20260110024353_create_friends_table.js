exports.up = function(knex) {
  return knex.schema.createTable('friends', (table) => {
    table.increments('id').primary();
    // Người gửi lời mời
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    // Người nhận lời mời
    table.integer('friend_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    // Trạng thái
    table.string('status').defaultTo('pending'); 
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('friends');
};
exports.up = function(knex) {
  return knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    // Người gửi
    table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    // Người nhận
    table.integer('receiver_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    // Nội dung
    table.text('content').notNullable();
    // Trạng thái
    table.boolean('is_read').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
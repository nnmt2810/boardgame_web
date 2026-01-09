/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary(); // ID tự tăng
    table.string('username').notNullable().unique(); // Tên đăng nhập (duy nhất)
    table.string('password').notNullable(); // Mật khẩu (đã hash)
    table.string('email').notNullable().unique(); // Email (duy nhất)
    table.string('role').defaultTo('user'); // Role: user hoặc admin
    table.timestamps(true, true); // Tự động tạo cột created_at và updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users'); // Xóa bảng nếu cần rollback
};
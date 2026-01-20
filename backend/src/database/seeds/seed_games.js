exports.seed = async function(knex) {
  await knex('games').del();
  await knex('games').insert([
    { name: 'Caro hàng 5', code: 'caro5', default_size: 20, is_active: true },
    { name: 'Caro hàng 4', code: 'caro4', default_size: 15, is_active: true },
    { name: 'Tic-tac-toe', code: 'tictactoe', default_size: 3, is_active: true },
    { name: 'Rắn săn mồi', code: 'snake', default_size: 30, is_active: true },
    { name: 'Ghép hàng 3', code: 'memory', default_size: 8, is_active: true },
    { name: 'Bảng vẽ tự do', code: 'drawing', default_size: null, is_active: true },
    { name: 'Xếp hình', code: 'match3', default_size: null, is_active: true }
  ]);
};
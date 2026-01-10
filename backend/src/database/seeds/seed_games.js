exports.seed = async function(knex) {
  await knex('games').del();
  await knex('games').insert([
    { name: 'Caro hàng 5', code: 'caro_5', default_size: 20, is_active: true },
    { name: 'Caro hàng 4', code: 'caro_4', default_size: 15, is_active: true },
    { name: 'Tic-tac-toe', code: 'tictactoe', default_size: 3, is_active: true },
    { name: 'Rắn săn mồi', code: 'snake', default_size: 30, is_active: true },
    { name: 'Ghép hàng 3', code: 'match_3', default_size: 8, is_active: true }
  ]);
};
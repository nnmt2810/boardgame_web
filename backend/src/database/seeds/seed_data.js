const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Đảm bảo users đã được tạo
  const users = await knex('users').select('id');
  if (users.length === 0) {
    console.log('Vui lòng chạy seed_users trước!');
    return;
  }

  const userIds = users.map(u => u.id);
  const adminId = users.find(u => u.username === 'admin')?.id || userIds[0];
  const regularUserIds = userIds.filter(id => id !== adminId);

  // Seed Friends - ít nhất 3 mối quan hệ bạn bè
  await knex('friends').del();
  if (regularUserIds.length >= 2) {
    const friendData = [
      { user_id: regularUserIds[0], friend_id: regularUserIds[1], status: 'accepted' }
    ];
    
    // Thêm bạn bè thứ 2 nếu có đủ users
    if (regularUserIds.length >= 3) {
      friendData.push(
        { user_id: regularUserIds[0], friend_id: regularUserIds[2], status: 'accepted' },
        { user_id: regularUserIds[1], friend_id: regularUserIds[2], status: 'pending' }
      );
    }
    
    await knex('friends').insert(friendData);
    console.log(`✅ Đã tạo ${friendData.length} mối quan hệ bạn bè`);
  }

  // Seed Rankings - ít nhất 3 rankings cho mỗi game
  await knex('rankings').del();
  const games = await knex('games').select('id');
  
  for (const game of games) {
    for (let i = 0; i < Math.min(3, regularUserIds.length); i++) {
      await knex('rankings').insert({
        user_id: regularUserIds[i],
        game_id: game.id,
        high_score: Math.floor(Math.random() * 1000) + 100,
        total_wins: Math.floor(Math.random() * 10) + 1
      });
    }
  }

  // Seed Messages - ít nhất 3 tin nhắn
  await knex('messages').del();
  if (regularUserIds.length >= 2) {
    await knex('messages').insert([
      {
        sender_id: regularUserIds[0],
        receiver_id: regularUserIds[1],
        content: 'Xin chào! Bạn muốn chơi game không?',
        is_read: false
      },
      {
        sender_id: regularUserIds[1],
        receiver_id: regularUserIds[0],
        content: 'Chào bạn! Có, mình sẵn sàng!',
        is_read: true
      },
      {
        sender_id: regularUserIds[0],
        receiver_id: regularUserIds[1],
        content: 'Tuyệt! Hãy thử game Caro nhé!',
        is_read: false
      }
    ]);
  }

  // Seed Game Sessions - ít nhất 3 sessions
  await knex('game_sessions').del();
  for (let i = 0; i < Math.min(3, regularUserIds.length); i++) {
    await knex('game_sessions').insert({
      user_id: regularUserIds[i],
      game_id: games[0]?.id || 1,
      matrix_state: JSON.stringify([[0, 1, 0], [1, 0, 1], [0, 1, 0]]),
      current_score: Math.floor(Math.random() * 500) + 50,
      time_elapsed: Math.floor(Math.random() * 300) + 60,
      status: 'saved'
    });
  }

  console.log('\nSeed data đã được tạo thành công!');
  console.log(`   - Friends: ${await knex('friends').count('id as total').then(r => r[0].total)}`);
  console.log(`   - Rankings: ${await knex('rankings').count('id as total').then(r => r[0].total)}`);
  console.log(`   - Messages: ${await knex('messages').count('id as total').then(r => r[0].total)}`);
  console.log(`   - Sessions: ${await knex('game_sessions').count('id as total').then(r => r[0].total)}`);
};


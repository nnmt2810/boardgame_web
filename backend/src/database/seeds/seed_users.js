const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Xóa dữ liệu cũ (nếu cần)
  await knex('users').del();
  
  // Hash password cho tất cả users
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // Tạo ít nhất 5 users với dữ liệu đầy đủ
  await knex('users').insert([
    {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      username: 'user1',
      password: hashedPassword,
      email: 'user1@example.com',
      role: 'user'
    },
    {
      username: 'user2',
      password: hashedPassword,
      email: 'user2@example.com',
      role: 'user'
    },
    {
      username: 'user3',
      password: hashedPassword,
      email: 'user3@example.com',
      role: 'user'
    },
    {
      username: 'user4',
      password: hashedPassword,
      email: 'user4@example.com',
      role: 'user'
    },
    {
      username: 'user5',
      password: hashedPassword,
      email: 'user5@example.com',
      role: 'user'
    }
  ]);
};


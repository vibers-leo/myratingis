// scripts/create-test-user.js
// 테스트 사용자 생성 스크립트

const bcrypt = require('bcryptjs');

async function createTestUser() {
  const password = '12345678';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('='.repeat(50));
  console.log('테스트 사용자 정보');
  console.log('='.repeat(50));
  console.log('Email: test@test.com');
  console.log('Password: 12345678');
  console.log('Hashed Password:', hashedPassword);
  console.log('='.repeat(50));
  console.log('\nSupabase SQL Editor에서 다음 SQL을 실행하세요:\n');
  console.log(`UPDATE "User" SET password = '${hashedPassword}' WHERE email = 'test@test.com';`);
  console.log('\n또는 새 사용자를 추가하려면:\n');
  console.log(`INSERT INTO "User" (email, password, nickname, is_active, role) VALUES ('test@test.com', '${hashedPassword}', '테스트유저', true, 'user');`);
}

createTestUser();

require('dotenv').config();
const knex = require('knex');

console.log('🔍 Testing database connection...');
console.log('Environment variables:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_SSL:', process.env.DB_SSL);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Simple test configuration
const config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 1,
    max: 2,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 10000
  }
};

async function testConnection() {
  console.log('\n🧪 Testing connection...');
  const db = knex(config);
  
  try {
    const result = await db.raw('SELECT 1+1 as result, NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Result:', result.rows[0]);
    await db.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err.detail || 'No additional details');
    await db.destroy();
    process.exit(1);
  }
}

testConnection();

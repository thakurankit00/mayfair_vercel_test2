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

// Test with individual connection parameters
const config1 = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 1,
    max: 2,
    acquireTimeoutMillis: 15000,
    createTimeoutMillis: 15000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 15000
  }
};

// Test with DATABASE_URL
const config2 = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 1,
    max: 2,
    acquireTimeoutMillis: 15000,
    createTimeoutMillis: 15000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 15000
  }
};

async function testConnection(config, name) {
  console.log(`\n🧪 Testing ${name}...`);
  const db = knex(config);
  
  try {
    const result = await db.raw('SELECT 1+1 as result, NOW() as current_time');
    console.log(`✅ ${name} connection successful!`);
    console.log('Result:', result.rows[0]);
    await db.destroy();
    return true;
  } catch (err) {
    console.error(`❌ ${name} connection failed:`, err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err.detail || 'No additional details');
    await db.destroy();
    return false;
  }
}

async function main() {
  const test1 = await testConnection(config1, 'Individual parameters');
  const test2 = await testConnection(config2, 'DATABASE_URL');
  
  if (!test1 && !test2) {
    console.log('\n❌ Both connection methods failed. Please check:');
    console.log('1. Supabase project is active and running');
    console.log('2. Database credentials are correct');
    console.log('3. IP address is whitelisted in Supabase');
    console.log('4. Network connectivity to Supabase');
    process.exit(1);
  } else {
    console.log('\n✅ At least one connection method worked!');
    process.exit(0);
  }
}

main();

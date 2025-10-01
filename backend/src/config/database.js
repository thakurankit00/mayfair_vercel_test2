const knex = require('knex');
const { Model } = require('objection');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

// Setup Objection.js with Knex
Model.knex(db);

// Test database connection (non-blocking)
db.raw('SELECT 1+1 as result')
  .then(() => {
    console.log('✅ Database connected successfully - database.js:16');
  })
  .catch((err) => {
    console.error('❌ Database connection failed: - database.js:19', err.message);
    console.error('⚠️  Server will continue running, but database operations will fail');
    // Don't exit the process - let the app handle connection retries
  });

module.exports = db;

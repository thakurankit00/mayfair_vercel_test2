const knex = require('knex');
const { Model } = require('objection');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

// Setup Objection.js with Knex
Model.knex(db);

// Test database connection
db.raw('SELECT 1+1 as result')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;

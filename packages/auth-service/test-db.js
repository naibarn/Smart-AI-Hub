const knex = require('knex');

const config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'smart_ai_hub_dev',
    user: 'smart_ai_user',
    password: 'smart_password_dev'
  }
};

const db = knex(config);

console.log('Testing database connection...');

db.raw('SELECT 1+1 as result')
  .then((result) => {
    console.log('✅ Database connected successfully!');
    console.log('Query result:', result.rows[0]);
    return db.destroy();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
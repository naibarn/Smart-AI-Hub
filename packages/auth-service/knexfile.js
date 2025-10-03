require('dotenv').config({ path: '.env.development' });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'smart_ai_hub_dev',
      user: 'smart_ai_user',
      password: 'smart_password_dev',
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
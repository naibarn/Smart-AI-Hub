exports.up = async function(knex) {
  // 1. Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 50).unique().notNullable();
    table.jsonb('permissions').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255);
    table.string('google_id', 255).unique();
    table.boolean('email_verified').defaultTo(false);
    table.uuid('role_id').references('id').inTable('roles');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('email');
  });

  // 3. Create user_profiles table
  await knex.schema.createTable('user_profiles', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('avatar_url', 500);
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 4. Create credit_accounts table
  await knex.schema.createTable('credit_accounts', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.integer('current_balance').defaultTo(0).check('current_balance >= 0');
    table.integer('total_purchased').defaultTo(0);
    table.integer('total_used').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. Create credit_transactions table
  await knex.schema.createTable('credit_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['purchase', 'usage', 'refund', 'admin_adjustment']).notNullable();
    table.integer('amount').notNullable();
    table.integer('balance_after').notNullable();
    table.text('description');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('created_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('credit_transactions');
  await knex.schema.dropTableIfExists('credit_accounts');
  await knex.schema.dropTableIfExists('user_profiles');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
};
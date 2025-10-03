exports.seed = async function(knex) {
  // Delete existing entries
  await knex('roles').del();
  
  // Insert default roles
  await knex('roles').insert([
    {
      name: 'super_admin',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        roles: ['create', 'read', 'update', 'delete'],
        credits: ['create', 'read', 'update', 'delete'],
        system: ['admin']
      })
    },
    {
      name: 'admin',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update'],
        credits: ['read', 'update'],
        system: ['manage']
      })
    },
    {
      name: 'manager',
      permissions: JSON.stringify({
        users: ['read', 'update'],
        credits: ['read']
      })
    },
    {
      name: 'user',
      permissions: JSON.stringify({
        profile: ['read', 'update'],
        credits: ['read']
      })
    },
    {
      name: 'guest',
      permissions: JSON.stringify({
        profile: ['read']
      })
    }
  ]);
};
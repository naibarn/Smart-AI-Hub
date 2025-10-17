const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock user data
const users = {
  // Administrator
  'administrator@example.com': { id: 1, email: 'administrator@example.com', role: 'Administrator', tier: 'administrator' },
  
  // Agency users
  'agency-a@example.com': { id: 2, email: 'agency-a@example.com', role: 'Agency', tier: 'agency', agency: 'Agency A' },
  'agency-b@example.com': { id: 3, email: 'agency-b@example.com', role: 'Agency', tier: 'agency', agency: 'Agency B' },
  
  // Organization users
  'org-a1@example.com': { id: 4, email: 'org-a1@example.com', role: 'Organization', tier: 'organization', organization: 'Org A1', agency: 'Agency A' },
  'org-a2@example.com': { id: 5, email: 'org-a2@example.com', role: 'Organization', tier: 'organization', organization: 'Org A2', agency: 'Agency A' },
  'org-b1@example.com': { id: 6, email: 'org-b1@example.com', role: 'Organization', tier: 'organization', organization: 'Org B1', agency: 'Agency B' },
  
  // Admin users
  'admin-a1@example.com': { id: 7, email: 'admin-a1@example.com', role: 'Admin', tier: 'admin', organization: 'Org A1', agency: 'Agency A' },
  'admin-a2@example.com': { id: 8, email: 'admin-a2@example.com', role: 'Admin', tier: 'admin', organization: 'Org A2', agency: 'Agency A' },
  'admin-b1@example.com': { id: 9, email: 'admin-b1@example.com', role: 'Admin', tier: 'admin', organization: 'Org B1', agency: 'Agency B' },
  
  // General users
  'general-a1-1@example.com': { id: 10, email: 'general-a1-1@example.com', role: 'General', tier: 'general', organization: 'Org A1', agency: 'Agency A' },
  'general-a1-2@example.com': { id: 11, email: 'general-a1-2@example.com', role: 'General', tier: 'general', organization: 'Org A1', agency: 'Agency A' },
  'general-a2-1@example.com': { id: 12, email: 'general-a2-1@example.com', role: 'General', tier: 'general', organization: 'Org A2', agency: 'Agency A' },
  'general-b1-1@example.com': { id: 13, email: 'general-b1-1@example.com', role: 'General', tier: 'general', organization: 'Org B1', agency: 'Agency B' },
  
  // Blocked users
  'blocked-general@example.com': { id: 14, email: 'blocked-general@example.com', role: 'General', tier: 'general', organization: 'Org A1', agency: 'Agency A', blocked: true },
  'blocked-admin@example.com': { id: 15, email: 'blocked-admin@example.com', role: 'Admin', tier: 'admin', organization: 'Org A1', agency: 'Agency A', blocked: true }
};

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  
  if (user && password === 'password123') {
    res.json({
      success: true,
      user,
      token: 'mock-jwt-token'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock user data endpoints
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: Object.values(users)
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = Object.values(users).find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Mock transfer endpoint
app.post('/api/transfers', (req, res) => {
  const { fromUserId, toUserId, amount, type } = req.body;
  res.json({
    success: true,
    transfer: {
      id: Math.floor(Math.random() * 1000),
      fromUserId,
      toUserId,
      amount,
      type,
      timestamp: new Date().toISOString()
    }
  });
});

// Mock block/unblock endpoint
app.post('/api/users/:id/block', (req, res) => {
  const userId = parseInt(req.params.id);
  res.json({
    success: true,
    message: `User ${userId} blocked successfully`
  });
});

app.post('/api/users/:id/unblock', (req, res) => {
  const userId = parseInt(req.params.id);
  res.json({
    success: true,
    message: `User ${userId} unblocked successfully`
  });
});

// Mock points system endpoints
app.get('/api/points/balance', (req, res) => {
  res.json({
    success: true,
    balance: {
      points: 100,
      credits: 50
    }
  });
});

app.post('/api/points/exchange', (req, res) => {
  const { creditsToExchange } = req.body;
  res.json({
    success: true,
    exchanged: {
      credits: creditsToExchange,
      points: creditsToExchange * 2
    }
  });
});

app.post('/api/points/daily-reward', (req, res) => {
  res.json({
    success: true,
    reward: {
      points: 10,
      timestamp: new Date().toISOString()
    }
  });
});

// Mock referral endpoints
app.get('/api/referral/code', (req, res) => {
  res.json({
    success: true,
    code: 'MOCK123',
    link: 'http://localhost:3000/register?code=MOCK123'
  });
});

app.post('/api/referral/register', (req, res) => {
  const { email, inviteCode } = req.body;
  res.json({
    success: true,
    user: {
      id: Math.floor(Math.random() * 1000),
      email,
      role: 'General',
      tier: 'general'
    }
  });
});

// Serve a simple HTML page for basic testing
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, select { padding: 8px; width: 300px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        .menu { margin-top: 30px; }
        .menu-item { padding: 10px; margin: 5px 0; background: #f8f9fa; }
      </style>
    </head>
    <body>
      <h1>Login</h1>
      <form id="login-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <select id="email" data-testid="email">
            <option value="administrator@example.com">Administrator</option>
            <option value="agency-a@example.com">Agency A</option>
            <option value="agency-b@example.com">Agency B</option>
            <option value="org-a1@example.com">Organization A1</option>
            <option value="org-a2@example.com">Organization A2</option>
            <option value="org-b1@example.com">Organization B1</option>
            <option value="admin-a1@example.com">Admin A1</option>
            <option value="admin-a2@example.com">Admin A2</option>
            <option value="admin-b1@example.com">Admin B1</option>
            <option value="general-a1-1@example.com">General A1-1</option>
            <option value="general-a1-2@example.com">General A1-2</option>
            <option value="general-a2-1@example.com">General A2-1</option>
            <option value="general-b1-1@example.com">General B1-1</option>
            <option value="blocked-general@example.com">Blocked General</option>
            <option value="blocked-admin@example.com">Blocked Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" data-testid="password" value="password123">
        </div>
        <button type="button" id="login-btn" data-testid="login-button">Login</button>
      </form>
      
      <div id="dashboard" style="display: none;">
        <h2>Dashboard</h2>
        <div class="menu">
          <div class="menu-item" data-testid="menu-dashboard">Dashboard</div>
          <div class="menu-item" data-testid="menu-profile">Profile</div>
          <div class="menu-item" data-testid="menu-members" style="display: none;">Members</div>
          <div class="menu-item" data-testid="menu-agency-settings" style="display: none;">Agency Settings</div>
          <div class="menu-item" data-testid="menu-transfer" style="display: none;">Transfer</div>
          <div class="menu-item" data-testid="menu-block" style="display: none;">Block Users</div>
          <div class="menu-item" data-testid="menu-organization-settings" style="display: none;">Organization Settings</div>
          <div class="menu-item" data-testid="menu-admin-settings" style="display: none;">Admin Settings</div>
        </div>
      </div>
      
      <script>
        document.getElementById('login-btn').addEventListener('click', async () => {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Store user data in sessionStorage for the dashboard to use
              sessionStorage.setItem('user', JSON.stringify(data.user));
              // Set a cookie for server-side access control
              document.cookie = \`user=\${encodeURIComponent(JSON.stringify(data.user))}; path=/\`;
              // Redirect to dashboard
              window.location.href = '/dashboard';
            }
          } catch (error) {
            console.error('Login error:', error);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .menu { margin-top: 30px; }
        .menu-item { padding: 10px; margin: 5px 0; background: #f8f9fa; cursor: pointer; }
        .member-list { margin-top: 20px; }
        .member-item { padding: 8px; margin: 5px 0; background: #e9ecef; }
        .blocked-message { color: red; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Dashboard</h1>
      <div id="user-info" data-testid="user-info"></div>
      
      <div class="menu">
        <div class="menu-item" data-testid="menu-dashboard">Dashboard</div>
        <div class="menu-item" data-testid="menu-profile">Profile</div>
        <div class="menu-item" data-testid="menu-points" style="display: block;">Points</div>
        <div class="menu-item" data-testid="menu-referrals" style="display: block;">Referrals</div>
        <div class="menu-item" data-testid="menu-members" style="display: none;">Members</div>
        <div class="menu-item" data-testid="menu-agency-settings" style="display: none;">Agency Settings</div>
        <div class="menu-item" data-testid="menu-transfer" style="display: none;">Transfer</div>
        <div class="menu-item" data-testid="menu-block-users" style="display: none;">Block Users</div>
        <div class="menu-item" data-testid="menu-org-settings" style="display: none;">Organization Settings</div>
        <div class="menu-item" data-testid="menu-admin-settings" style="display: none;">Admin Settings</div>
      </div>
      
      <div id="member-list" class="member-list" style="display: none;">
        <h3>Members</h3>
        <div id="members"></div>
      </div>
      
      <div id="points-balance" style="display: none;">
        <h3>Points & Credits</h3>
        <p data-testid="points-balance">Points: <span id="points">100</span></p>
        <p data-testid="credits-balance">Credits: <span id="credits">50</span></p>
        <button id="daily-reward" data-testid="daily-reward-btn" style="display: none;">Claim Daily Reward</button>
      </div>
      
      <div id="referral-section" style="display: none;">
        <h3>Referral</h3>
        <p data-testid="referral-code">Your referral code: <span id="referral-code-value">MOCK123</span></p>
        <p data-testid="referral-link">Referral link: <span id="referral-link-value">http://localhost:3000/register?code=MOCK123</span></p>
      </div>
      
      <div id="blocked-message" class="blocked-message" style="display: none;">
        Your account has been blocked. Please contact an administrator.
      </div>
      
      <script>
        // Get user data from sessionStorage
        const userData = sessionStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          
          // Display user info
          document.getElementById('user-info').innerHTML = \`
            <p>Welcome, <strong>\${user.email}</strong> (\${user.role})</p>
          \`;
          
          // Show blocked message if user is blocked
          if (user.blocked) {
            document.getElementById('blocked-message').style.display = 'block';
          }
          
          // Show points balance for all users
          document.getElementById('points-balance').style.display = 'block';
          
          // Show referral section for all users
          document.getElementById('referral-section').style.display = 'block';
          
          // Show menu items based on user tier
          const userTier = user.tier;
          
          if (userTier === 'agency' || userTier === 'organization' || userTier === 'admin' || userTier === 'administrator') {
            document.querySelector('[data-testid="menu-members"]').style.display = 'block';
            document.getElementById('member-list').style.display = 'block';
            loadMembers(user);
          }
          
          if (userTier === 'agency' || userTier === 'administrator') {
            document.querySelector('[data-testid="menu-agency-settings"]').style.display = 'block';
          }
          
          if (userTier === 'agency' || userTier === 'organization' || userTier === 'admin' || userTier === 'administrator') {
            document.querySelector('[data-testid="menu-transfer"]').style.display = 'block';
          }
          
          if (userTier === 'agency' || userTier === 'organization' || userTier === 'admin' || userTier === 'administrator') {
            document.querySelector('[data-testid="menu-block-users"]').style.display = 'block';
          }
          
          if (userTier === 'organization' || userTier === 'administrator') {
            document.querySelector('[data-testid="menu-org-settings"]').style.display = 'block';
          }
          
          if (userTier === 'administrator') {
            document.querySelector('[data-testid="menu-admin-settings"]').style.display = 'block';
          }
          
          // Show daily reward button for all users
          document.getElementById('daily-reward').style.display = 'block';
        }
        
        function loadMembers(currentUser) {
          const membersContainer = document.getElementById('members');
          membersContainer.innerHTML = '';
          
          // Mock member data based on user tier
          const members = getVisibleMembers(currentUser);
          
          members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-item';
            memberDiv.setAttribute('data-testid', \`member-\${member.tier}-\${member.id === currentUser.id ? 'self' : 'other'}\`);
            memberDiv.textContent = \`\${member.email} (\${member.role})\`;
            membersContainer.appendChild(memberDiv);
          });
        }
        
        function getVisibleMembers(currentUser) {
          // Return mock members based on visibility rules
          const allUsers = ${JSON.stringify(Object.values(users))};
          
          if (currentUser.tier === 'general') {
            // General users can only see themselves
            return allUsers.filter(u => u.id === currentUser.id);
          } else if (currentUser.tier === 'admin') {
            // Admin users can see generals in their organization
            return allUsers.filter(u => 
              (u.tier === 'general' && u.organization === currentUser.organization) ||
              u.id === currentUser.id
            );
          } else if (currentUser.tier === 'organization') {
            // Organization users can see admins and generals in their organization
            return allUsers.filter(u => 
              ((u.tier === 'admin' || u.tier === 'general') && u.organization === currentUser.organization) ||
              u.id === currentUser.id
            );
          } else if (currentUser.tier === 'agency') {
            // Agency users can see orgs, admins, and generals in their agency
            return allUsers.filter(u => 
              ((u.tier === 'organization' || u.tier === 'admin' || u.tier === 'general') && u.agency === currentUser.agency) ||
              u.id === currentUser.id
            );
          } else if (currentUser.tier === 'administrator') {
            // Administrators can see everyone
            return allUsers;
          }
          
          return [];
        }
        
        // Handle daily reward click
        document.getElementById('daily-reward').addEventListener('click', async () => {
          try {
            const response = await fetch('/api/points/daily-reward', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            if (data.success) {
              const pointsSpan = document.getElementById('points');
              pointsSpan.textContent = parseInt(pointsSpan.textContent) + data.reward.points;
              alert(\`Daily reward claimed: +\${data.reward.points} points\`);
            }
          } catch (error) {
            console.error('Error claiming daily reward:', error);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Helper function to check if user has access to a route
function checkRouteAccess(userTier, route) {
  const accessRules = {
    'general': ['/dashboard', '/points', '/referral'],
    'admin': ['/dashboard', '/points', '/referral', '/transfer', '/block', '/members'],
    'organization': ['/dashboard', '/points', '/referral', '/transfer', '/block', '/members', '/organization/settings'],
    'agency': ['/dashboard', '/points', '/referral', '/transfer', '/block', '/members', '/agency/settings'],
    'administrator': ['/dashboard', '/points', '/referral', '/transfer', '/block', '/members', '/agency/settings', '/organization/settings', '/admin/settings']
  };
  
  return accessRules[userTier]?.includes(route) || false;
}

// Middleware to check access control
function checkAccess(route) {
  return (req, res, next) => {
    // Get user from session cookie or header (simplified for mock)
    const userData = req.headers.cookie?.match(/user=([^;]+)/);
    if (!userData) {
      return res.redirect('/login');
    }
    
    try {
      const user = JSON.parse(decodeURIComponent(userData[1]));
      if (!checkRouteAccess(user.tier, route)) {
        return res.redirect('/403');
      }
      // Store user data for use in the route
      req.user = user;
      next();
    } catch (error) {
      res.redirect('/login');
    }
  };
}

// Serve other pages with access control
app.get('/members', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/members')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart AI Hub - Members</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Members</h1>
      <div class="nav">
        <a href="/dashboard" data-testid="menu-dashboard">Dashboard</a>
        <a href="/points" data-testid="menu-points">Points</a>
        <a href="/members" data-testid="menu-members">Members</a>
        <a href="/transfer" data-testid="menu-transfer">Transfer</a>
        <a href="/referral" data-testid="menu-referrals">Referrals</a>
        <a href="/block" data-testid="menu-block-users">Block Users</a>
        <a href="/agency/settings" data-testid="menu-agency-settings">Agency Settings</a>
        <a href="/organization/settings" data-testid="menu-org-settings">Organization Settings</a>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>John Doe</td>
            <td>john@example.com</td>
            <td>General</td>
            <td>Active</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jane Smith</td>
            <td>jane@example.com</td>
            <td>Admin</td>
            <td>Active</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `);
});

app.get('/agency/settings', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/agency/settings')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart AI Hub - Agency Settings</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Agency Settings</h1>
      <div class="nav">
        <a href="/dashboard" data-testid="menu-dashboard">Dashboard</a>
        <a href="/points" data-testid="menu-points">Points</a>
        <a href="/members" data-testid="menu-members">Members</a>
        <a href="/transfer" data-testid="menu-transfer">Transfer</a>
        <a href="/referral" data-testid="menu-referrals">Referrals</a>
        <a href="/block" data-testid="menu-block-users">Block Users</a>
        <a href="/agency/settings" data-testid="menu-agency-settings">Agency Settings</a>
        <a href="/organization/settings" data-testid="menu-org-settings">Organization Settings</a>
      </div>
      <p>Agency Settings Page</p>
    </body>
    </html>
  `);
});

app.get('/transfer', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/transfer')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transfer - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, select { padding: 8px; width: 300px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Transfer</h1>
      <form id="transfer-form">
        <div class="form-group">
          <label for="recipient">Recipient:</label>
          <select id="recipient" data-testid="recipient-select">
            <option value="">Select a user</option>
            <option value="10">General A1-1</option>
            <option value="11">General A1-2</option>
            <option value="12">General A2-1</option>
            <option value="13">General B1-1</option>
          </select>
        </div>
        <div class="form-group">
          <label for="amount">Amount:</label>
          <input type="number" id="amount" data-testid="amount-input" min="1" value="10">
        </div>
        <div class="form-group">
          <label for="type">Type:</label>
          <select id="type" data-testid="type-select">
            <option value="credits">Credits</option>
            <option value="points">Points</option>
          </select>
        </div>
        <button type="button" id="transfer-btn" data-testid="transfer-button">Transfer</button>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('transfer-btn').addEventListener('click', async () => {
          const recipient = document.getElementById('recipient').value;
          const amount = document.getElementById('amount').value;
          const type = document.getElementById('type').value;
          
          if (!recipient || !amount) {
            alert('Please fill in all fields');
            return;
          }
          
          try {
            const response = await fetch('/api/transfers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fromUserId: 1, // Mock current user ID
                toUserId: parseInt(recipient),
                amount: parseInt(amount),
                type
              })
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div style="color: green;">
                  Transfer successful!
                  \${amount} \${type} transferred to user \${recipient}.
                  Transaction ID: \${data.transfer.id}
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Transfer failed: \${data.message}</div>\`;
            }
          } catch (error) {
            console.error('Transfer error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Transfer error occurred</div>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.get('/block', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/block')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Block Users - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, select { padding: 8px; width: 300px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; margin-right: 10px; }
        .user-list { margin: 20px 0; }
        .user-item { padding: 10px; margin: 5px 0; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center; }
        .blocked { background: #f8d7da; }
      </style>
    </head>
    <body>
      <h1>Block Users</h1>
      
      <div class="user-list">
        <div class="user-item" data-testid="user-10">
          <span>General A1-1 (general-a1-1@example.com)</span>
          <div>
            <button data-testid="block-btn-10" onclick="blockUser(10)">Block</button>
            <button data-testid="unblock-btn-10" onclick="unblockUser(10)" style="display: none;">Unblock</button>
          </div>
        </div>
        <div class="user-item" data-testid="user-11">
          <span>General A1-2 (general-a1-2@example.com)</span>
          <div>
            <button data-testid="block-btn-11" onclick="blockUser(11)">Block</button>
            <button data-testid="unblock-btn-11" onclick="unblockUser(11)" style="display: none;">Unblock</button>
          </div>
        </div>
        <div class="user-item" data-testid="user-12">
          <span>General A2-1 (general-a2-1@example.com)</span>
          <div>
            <button data-testid="block-btn-12" onclick="blockUser(12)">Block</button>
            <button data-testid="unblock-btn-12" onclick="unblockUser(12)" style="display: none;">Unblock</button>
          </div>
        </div>
        <div class="user-item" data-testid="user-13">
          <span>General B1-1 (general-b1-1@example.com)</span>
          <div>
            <button data-testid="block-btn-13" onclick="blockUser(13)">Block</button>
            <button data-testid="unblock-btn-13" onclick="unblockUser(13)" style="display: none;">Unblock</button>
          </div>
        </div>
      </div>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        async function blockUser(userId) {
          try {
            const response = await fetch(\`/api/users/\${userId}/block\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              resultDiv.innerHTML = \`<div style="color: green;">User \${userId} blocked successfully</div>\`;
              
              // Update UI
              const userItem = document.querySelector(\`[data-testid="user-\${userId}"]\`);
              userItem.classList.add('blocked');
              document.querySelector(\`[data-testid="block-btn-\${userId}"]\`).style.display = 'none';
              document.querySelector(\`[data-testid="unblock-btn-\${userId}"]\`).style.display = 'inline-block';
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Failed to block user: \${data.message}</div>\`;
            }
          } catch (error) {
            console.error('Block error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Block error occurred</div>\`;
          }
        }
        
        async function unblockUser(userId) {
          try {
            const response = await fetch(\`/api/users/\${userId}/unblock\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              resultDiv.innerHTML = \`<div style="color: green;">User \${userId} unblocked successfully</div>\`;
              
              // Update UI
              const userItem = document.querySelector(\`[data-testid="user-\${userId}"]\`);
              userItem.classList.remove('blocked');
              document.querySelector(\`[data-testid="block-btn-\${userId}"]\`).style.display = 'inline-block';
              document.querySelector(\`[data-testid="unblock-btn-\${userId}"]\`).style.display = 'none';
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Failed to unblock user: \${data.message}</div>\`;
            }
          } catch (error) {
            console.error('Unblock error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Unblock error occurred</div>\`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/organization/settings', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/organization/settings')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart AI Hub - Organization Settings</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Organization Settings</h1>
      <div class="nav">
        <a href="/dashboard" data-testid="menu-dashboard">Dashboard</a>
        <a href="/points" data-testid="menu-points">Points</a>
        <a href="/members" data-testid="menu-members">Members</a>
        <a href="/transfer" data-testid="menu-transfer">Transfer</a>
        <a href="/referral" data-testid="menu-referrals">Referrals</a>
        <a href="/block" data-testid="menu-block-users">Block Users</a>
        <a href="/agency/settings" data-testid="menu-agency-settings">Agency Settings</a>
        <a href="/organization/settings" data-testid="menu-org-settings">Organization Settings</a>
      </div>
      <p>Organization Settings Page</p>
    </body>
    </html>
  `);
});

app.get('/admin/settings', (req, res) => {
  // Check access control
  const userData = req.headers.cookie?.match(/user=([^;]+)/);
  if (!userData) {
    return res.redirect('/login');
  }
  
  try {
    const user = JSON.parse(decodeURIComponent(userData[1]));
    if (!checkRouteAccess(user.tier, '/admin/settings')) {
      return res.redirect('/403');
    }
  } catch (error) {
    return res.redirect('/login');
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart AI Hub - Admin Settings</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Admin Settings</h1>
      <div class="nav">
        <a href="/dashboard" data-testid="menu-dashboard">Dashboard</a>
        <a href="/points" data-testid="menu-points">Points</a>
        <a href="/members" data-testid="menu-members">Members</a>
        <a href="/transfer" data-testid="menu-transfer">Transfer</a>
        <a href="/referral" data-testid="menu-referrals">Referrals</a>
        <a href="/block" data-testid="menu-block-users">Block Users</a>
        <a href="/agency/settings" data-testid="menu-agency-settings">Agency Settings</a>
        <a href="/organization/settings" data-testid="menu-org-settings">Organization Settings</a>
      </div>
      <p>Admin Settings Page</p>
    </body>
    </html>
  `);
});

// Points system pages
app.get('/points', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Points System - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .balance { margin: 20px 0; padding: 15px; background: #f8f9fa; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, button { padding: 10px; }
        button { background: #007bff; color: white; border: none; cursor: pointer; margin-right: 10px; }
      </style>
    </head>
    <body>
      <h1>Points System</h1>
      
      <div class="balance">
        <h3>Your Balance</h3>
        <p data-testid="points-balance">Points: <span id="points">100</span></p>
        <p data-testid="credits-balance">Credits: <span id="credits">50</span></p>
      </div>
      
      <div>
        <h3>Actions</h3>
        <button id="daily-reward" data-testid="daily-reward-btn">Claim Daily Reward</button>
        <button id="exchange-btn" data-testid="exchange-btn">Exchange Credits to Points</button>
        <button id="purchase-btn" data-testid="purchase-btn">Purchase Points</button>
        <button id="auto-topup-btn" data-testid="auto-topup-btn">Configure Auto Top-up</button>
      </div>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('daily-reward').addEventListener('click', async () => {
          try {
            const response = await fetch('/api/points/daily-reward', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              const pointsSpan = document.getElementById('points');
              pointsSpan.textContent = parseInt(pointsSpan.textContent) + data.reward.points;
              resultDiv.innerHTML = \`<div style="color: green;">Daily reward claimed: +\${data.reward.points} points</div>\`;
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Failed to claim daily reward</div>\`;
            }
          } catch (error) {
            console.error('Daily reward error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Error occurred</div>\`;
          }
        });
        
        document.getElementById('exchange-btn').addEventListener('click', async () => {
          const creditsToExchange = prompt('Enter number of credits to exchange (1 credit = 2 points):');
          if (!creditsToExchange || isNaN(creditsToExchange) || parseInt(creditsToExchange) <= 0) {
            return;
          }
          
          try {
            const response = await fetch('/api/points/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creditsToExchange: parseInt(creditsToExchange) })
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              const pointsSpan = document.getElementById('points');
              const creditsSpan = document.getElementById('credits');
              
              pointsSpan.textContent = parseInt(pointsSpan.textContent) + data.exchanged.points;
              creditsSpan.textContent = parseInt(creditsSpan.textContent) - data.exchanged.credits;
              
              resultDiv.innerHTML = \`
                <div style="color: green;">
                  Exchange successful! 
                  \${data.exchanged.credits} credits exchanged for \${data.exchanged.points} points
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Exchange failed</div>\`;
            }
          } catch (error) {
            console.error('Exchange error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Error occurred</div>\`;
          }
        });
        
        document.getElementById('purchase-btn').addEventListener('click', () => {
          const pointsToPurchase = prompt('Enter number of points to purchase:');
          if (pointsToPurchase && !isNaN(pointsToPurchase) && parseInt(pointsToPurchase) > 0) {
            document.getElementById('result').innerHTML = \`
              <div style="color: green;">
                Purchase simulation: \${pointsToPurchase} points purchased successfully
              </div>
            \`;
          }
        });
        
        document.getElementById('auto-topup-btn').addEventListener('click', () => {
          const threshold = prompt('Enter auto top-up threshold (minimum points before auto top-up):');
          if (threshold && !isNaN(threshold) && parseInt(threshold) > 0) {
            document.getElementById('result').innerHTML = \`
              <div style="color: green;">
                Auto top-up configured: Will automatically add points when balance falls below \${threshold}
              </div>
            \`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Referral page
app.get('/referral', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Referral System - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .referral-info { margin: 20px 0; padding: 15px; background: #f8f9fa; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, button { padding: 10px; }
        button { background: #007bff; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Referral System</h1>
      
      <div class="referral-info">
        <h3>Your Referral Information</h3>
        <p data-testid="referral-code">Your referral code: <span id="referral-code-value">MOCK123</span></p>
        <p data-testid="referral-link">Referral link: <span id="referral-link-value">http://localhost:3000/register?code=MOCK123</span></p>
      </div>
      
      <div>
        <h3>Register with Referral Code</h3>
        <form id="referral-form">
          <div class="form-group">
            <label for="reg-email">Email:</label>
            <input type="email" id="reg-email" data-testid="reg-email" required>
          </div>
          <div class="form-group">
            <label for="reg-code">Referral Code:</label>
            <input type="text" id="reg-code" data-testid="reg-code" value="MOCK123">
          </div>
          <button type="button" id="register-btn" data-testid="register-btn">Register</button>
        </form>
      </div>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('register-btn').addEventListener('click', async () => {
          const email = document.getElementById('reg-email').value;
          const inviteCode = document.getElementById('reg-code').value;
          
          if (!email || !inviteCode) {
            alert('Please fill in all fields');
            return;
          }
          
          try {
            const response = await fetch('/api/referral/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, inviteCode })
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div style="color: green;">
                  Registration successful! 
                  New user created: \${data.user.email} (\${data.user.role})
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Registration failed</div>\`;
            }
          } catch (error) {
            console.error('Registration error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Error occurred</div>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Register page with referral code
app.get('/register', (req, res) => {
  const inviteCode = req.query.code || '';
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Register - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { padding: 8px; width: 300px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Register</h1>
      <form id="register-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" data-testid="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" data-testid="password" required>
        </div>
        <div class="form-group">
          <label for="invite-code">Referral Code:</label>
          <input type="text" id="invite-code" data-testid="invite-code" value="${inviteCode}">
        </div>
        <button type="button" id="register-btn" data-testid="register-button">Register</button>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('register-btn').addEventListener('click', async () => {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const inviteCode = document.getElementById('invite-code').value;
          
          if (!email || !password) {
            alert('Please fill in all required fields');
            return;
          }
          
          try {
            const response = await fetch('/api/referral/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, inviteCode })
            });
            
            const data = await response.json();
            const resultDiv = document.getElementById('result');
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div style="color: green;">
                  Registration successful! 
                  Your account has been created: \${data.user.email} (\${data.user.role})
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`<div style="color: red;">Registration failed</div>\`;
            }
          } catch (error) {
            console.error('Registration error:', error);
            document.getElementById('result').innerHTML = \`<div style="color: red;">Error occurred</div>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// 403 page for access denied
app.get('/403', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Access Denied - Smart AI Hub</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
        .error-code { font-size: 72px; color: #dc3545; }
        .error-message { font-size: 24px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="error-code">403</div>
      <div class="error-message">Access Denied</div>
      <p>You don't have permission to access this page.</p>
      <a href="/dashboard">Back to Dashboard</a>
    </body>
    </html>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
export default async function globalSetup() {
  // Set test environment port before importing the app
  process.env.PORT = '3005';
  process.env.NODE_ENV = 'test';
  
  console.log('Global test setup completed - using port 3005');
  // We'll skip the database and server setup for now to focus on test logic
}
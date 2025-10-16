export default async function globalTeardown() {
  // Close the test server if it's running
  const server = (global as any).__TEST_SERVER__;
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
    });
  }
  
  console.log('Global teardown completed');
}
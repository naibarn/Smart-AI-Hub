/**
 * Utility function to test API connection
 */
export const testConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('API connection failed:', error);
    return { success: false, error };
  }
};

/**
 * Test connection to specific API endpoints
 */
export const testSpecificEndpoint = async (endpoint: string) => {
  try {
    console.log(`Testing connection to ${endpoint}...`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Connection to ${endpoint} successful:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`Connection to ${endpoint} failed:`, error);
    return { success: false, error };
  }
};

/**
 * Test all API services
 */
export const testAllServices = async () => {
  const services = [
    { name: 'API Gateway', endpoint: '/api/health' },
    { name: 'Auth Service', endpoint: '/api/auth/health' },
    { name: 'Core Service', endpoint: '/api/core/health' },
    { name: 'MCP Server', endpoint: '/api/mcp/health' },
  ];

  const results = await Promise.allSettled(
    services.map(async (service) => {
      const result = await testSpecificEndpoint(service.endpoint);
      return { ...service, ...result };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { ...services[index], success: false, error: result.reason };
    }
  });
};

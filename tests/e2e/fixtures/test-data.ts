export const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'ExistingPassword123!',
    name: 'Existing User',
  },
};

export const testTrees = {
  basicTree: {
    name: 'Test Family Tree',
    description: 'A test family tree for E2E testing',
  },
};

export const testPersons = {
  father: {
    name: 'John Doe',
    birthDate: '1980-01-01',
    gender: 'male',
    bio: 'Test father person',
  },
  mother: {
    name: 'Jane Doe',
    birthDate: '1982-05-15',
    gender: 'female',
    bio: 'Test mother person',
  },
  child: {
    name: 'Baby Doe',
    birthDate: '2010-03-20',
    gender: 'male',
    bio: 'Test child person',
  },
};

// Helper to create test data via API calls
// This can be implemented when API endpoints are available
export async function setupTestData(apiURL: string) {
  // Example implementation:
  // const response = await fetch(`${apiURL}/api/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(testUsers.newUser),
  // });
  // return response.json();
}

// Helper to clean up test data via API calls
// This can be implemented when API endpoints are available
export async function cleanupTestData(apiURL: string) {
  // Example implementation:
  // await fetch(`${apiURL}/api/test/cleanup`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email: testUsers.newUser.email }),
  // });
}

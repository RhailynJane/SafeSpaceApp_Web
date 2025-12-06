// Create SuperAdmin User
const { execSync } = require('child_process');

const args = JSON.stringify({
  clerkId: "user_36UDKKVRjPuAQlr5vwrqXu31Pyc",
  email: "safespace.dev.app@gmail.com",
  firstName: "SafeSpace",
  lastName: "SuperAdmin"
});

console.log('Creating SuperAdmin with args:', args);

try {
  const result = execSync(`npx convex run bootstrapSuperAdmin:createSuperAdmin '${args}'`, {
    stdio: 'inherit',
    shell: true
  });
  console.log('\nSuccess!');
} catch (error) {
  console.error('\nFailed:', error.message);
  process.exit(1);
}

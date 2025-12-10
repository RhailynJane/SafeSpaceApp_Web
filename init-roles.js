// Initialize Roles
const { execSync } = require('child_process');

const args = JSON.stringify({
  clerkId: "user_36UDKKVRjPuAQlr5vwrqXu31Pyc"
});

console.log('Initializing roles with args:', args);

try {
  execSync(`npx convex run roles:initializeRoles '${args}'`, {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  console.log('\nRoles initialized successfully!');
} catch (error) {
  console.error('\nFailed:', error.message);
  process.exit(1);
}

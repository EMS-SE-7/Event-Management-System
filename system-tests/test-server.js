// Starts the whole system for the system tests, exactly as it runs in production:
// the Express server (NODE_ENV=production) serving the built React app from client/dist,
// connected to a throwaway MongoDB that starts empty and is seeded with the test accounts.
// Playwright starts this file before the tests and stops it afterwards (see playwright.config.js).
const path = require('path');

const serverDir = path.join(__dirname, '..', 'server');
const fromServer = (name) => require(require.resolve(name, { paths: [serverDir] }));

const { MongoMemoryServer } = fromServer('mongodb-memory-server');
const mongoose = fromServer('mongoose');
const { ACCOUNTS, PASSWORD } = require('./tests/accounts');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'system-test-secret';
process.env.CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const PORT = Number(process.env.PORT || 4173);

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('pesu_ems_system_test'));

  const User = require(path.join(serverDir, 'src', 'models', 'User'));
  for (const account of Object.values(ACCOUNTS)) {
    await User.create({ ...account, password: PASSWORD });
  }

  const app = require(path.join(serverDir, 'src', 'index'));
  const server = app.listen(PORT, () => console.log(`System under test running on http://localhost:${PORT}`));

  const stop = async () => {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

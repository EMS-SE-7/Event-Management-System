const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let counter = 0;

// Saves a real user and returns it with a signed JWT, so tests go through the real middleware.
async function createUser(role = 'Student') {
  counter += 1;
  const user = await User.create({
    name: `Test ${role} ${counter}`,
    email: `${role.toLowerCase()}${counter}@pesu.pes.edu`,
    password: 'secret123',
    role,
  });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token, header: `Bearer ${token}` };
}

module.exports = { createUser };

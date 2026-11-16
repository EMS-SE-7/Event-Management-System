// Accounts seeded into the empty test database by test-server.js.
const PASSWORD = 'SystemTest#2026';

const ACCOUNTS = {
  organizer: { name: 'Test Organizer', email: 'organizer.sys@pesu.pes.edu', role: 'Organizer' },
  otherOrganizer: { name: 'Other Organizer', email: 'organizer2.sys@pesu.pes.edu', role: 'Organizer' },
  student: { name: 'Asha Student', email: 'pes1ug24cs901@pesu.pes.edu', role: 'Student' },
  student2: { name: 'Ravi Student', email: 'pes1ug24cs902@pesu.pes.edu', role: 'Student' },
};

module.exports = { ACCOUNTS, PASSWORD };

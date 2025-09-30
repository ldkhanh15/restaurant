'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      id: 'UUID1',
      username: 'john_doe',
      email: 'john@example.com',
      phone: '0901234567',
      password_hash: '$2b$10$hashedpassword1',
      role: 'customer',
      full_name: 'John Doe',
      preferences: JSON.stringify({ allergies: ['nuts'], favorite_dishes: ['pizza'], preferred_location: 'near_window' }),
      ranking: 'regular',
      points: 100,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { username: 'john_doe' });
  }
};

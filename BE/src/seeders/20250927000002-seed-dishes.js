'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('dishes', [
      {
        id: 'UUID12',
        name: 'Grilled Salmon',
        description: 'Fresh salmon grilled to perfection.',
        price: 150000.00,
        category_id: 'UUID10',
        media_urls: JSON.stringify(['s3://bucket/salmon.jpg']),
        is_best_seller: 1,
        seasonal: 0,
        active: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'UUID13',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with cream.',
        price: 50000.00,
        category_id: 'UUID11',
        media_urls: JSON.stringify(['s3://bucket/cake.jpg']),
        is_best_seller: 0,
        seasonal: 1,
        active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('dishes', { id: ['UUID12', 'UUID13'] });
  }
};

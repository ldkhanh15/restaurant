"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'payment_requested' to notifications.type enum
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'low_stock',
        'reservation_confirm',
        'promotion',
        'order_created',
        'order_updated',
        'order_status_changed',
        'reservation_created',
        'reservation_updated',
        'chat_message',
        'support_request',
        'payment_requested',
        'payment_completed',
        'other',
        'loyalty_points_awarded'
      ) DEFAULT 'other';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove 'payment_requested' from notifications.type enum
    // Note: This will fail if there are existing records with 'payment_requested' type
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'low_stock',
        'reservation_confirm',
        'promotion',
        'order_created',
        'order_updated',
        'order_status_changed',
        'reservation_created',
        'reservation_updated',
        'chat_message',
        'support_request',
        'payment_completed',
        'other',
        'loyalty_points_awarded'
      ) DEFAULT 'other';
    `);
  },
};

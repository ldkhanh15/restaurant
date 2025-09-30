'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('event_bookings', {
            id: { type: Sequelize.CHAR(36), primaryKey: true },
            event_id: { type: Sequelize.CHAR(36) },
            reservation_id: { type: Sequelize.CHAR(36) },
            special_requests: { type: Sequelize.TEXT },
            status: { type: Sequelize.ENUM('booked', 'confirmed', 'cancelled'), defaultValue: 'booked' },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
        });

        await queryInterface.addConstraint('event_bookings', {
            fields: ['event_id'],
            type: 'foreign key',
            name: 'fk_event_bookings_event',
            references: { table: 'events', field: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        await queryInterface.addConstraint('event_bookings', {
            fields: ['reservation_id'],
            type: 'foreign key',
            name: 'fk_event_bookings_reservation',
            references: { table: 'reservations', field: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('event_bookings');
    }
}; 
'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        await queryInterface.bulkInsert('event_bookings', [
            { id: '20000000-0000-0000-0000-000000000001', event_id: null, reservation_id: null, status: 'booked', created_at: now },
            { id: '20000000-0000-0000-0000-000000000002', event_id: null, reservation_id: null, status: 'booked', created_at: now },
            { id: '20000000-0000-0000-0000-000000000003', event_id: null, reservation_id: null, status: 'booked', created_at: now },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('event_bookings', null, {});
    }
}; 
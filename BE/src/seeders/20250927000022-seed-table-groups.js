'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        await queryInterface.bulkInsert('table_groups', [
            { id: '10000000-0000-0000-0000-000000000001', group_name: 'Family A', table_ids: JSON.stringify([]), total_capacity: 8, status: 'available', created_at: now, updated_at: now },
            { id: '10000000-0000-0000-0000-000000000002', group_name: 'VIP Room', table_ids: JSON.stringify([]), total_capacity: 12, status: 'available', created_at: now, updated_at: now },
            { id: '10000000-0000-0000-0000-000000000003', group_name: 'Garden Zone', table_ids: JSON.stringify([]), total_capacity: 20, status: 'available', created_at: now, updated_at: now },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('table_groups', null, {});
    }
}; 
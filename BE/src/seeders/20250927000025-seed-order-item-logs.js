'use strict';

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        await queryInterface.bulkInsert('order_item_logs', [
            { id: '30000000-0000-0000-0000-000000000001', order_item_id: null, action: 'created', note: 'Init', created_at: now },
            { id: '30000000-0000-0000-0000-000000000002', order_item_id: null, action: 'updated', note: 'Quantity change', created_at: now },
            { id: '30000000-0000-0000-0000-000000000003', order_item_id: null, action: 'deleted', note: 'Cancelled', created_at: now },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('order_item_logs', null, {});
    }
}; 
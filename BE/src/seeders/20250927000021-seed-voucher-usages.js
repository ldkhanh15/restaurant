'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();
        await queryInterface.bulkInsert('voucher_usages', [
            { id: '00000000-0000-0000-0000-000000001001', voucher_id: '00000000-0000-0000-0000-000000000001', order_id: null, user_id: null, used_at: now },
            { id: '00000000-0000-0000-0000-000000001002', voucher_id: '00000000-0000-0000-0000-000000000002', order_id: null, user_id: null, used_at: now },
            { id: '00000000-0000-0000-0000-000000001003', voucher_id: '00000000-0000-0000-0000-000000000003', order_id: null, user_id: null, used_at: now },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('voucher_usages', null, {});
    }
}; 
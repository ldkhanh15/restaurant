'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        await queryInterface.bulkInsert('vouchers', [
            { id: '00000000-0000-0000-0000-000000000001', code: 'WELCOME10', discount_type: 'percentage', value: 10, active: true, created_at: now },
            { id: '00000000-0000-0000-0000-000000000002', code: 'VIP50K', discount_type: 'fixed', value: 50000, active: true, created_at: now },
            { id: '00000000-0000-0000-0000-000000000003', code: 'PLATINUM15', discount_type: 'percentage', value: 15, active: true, created_at: now },
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('vouchers', null, {});
    }
}; 
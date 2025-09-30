'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('voucher_usages', {
            id: { type: Sequelize.CHAR(36), primaryKey: true },
            voucher_id: { type: Sequelize.CHAR(36) },
            order_id: { type: Sequelize.CHAR(36) },
            user_id: { type: Sequelize.CHAR(36) },
            used_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
        });
        await queryInterface.addConstraint('voucher_usages', {
            fields: ['voucher_id'], type: 'foreign key', name: 'fk_vu_voucher',
            references: { table: 'vouchers', field: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        });
        await queryInterface.addConstraint('voucher_usages', {
            fields: ['order_id'], type: 'foreign key', name: 'fk_vu_order',
            references: { table: 'orders', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
        });
        await queryInterface.addConstraint('voucher_usages', {
            fields: ['user_id'], type: 'foreign key', name: 'fk_vu_user',
            references: { table: 'users', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('voucher_usages');
    }
}; 
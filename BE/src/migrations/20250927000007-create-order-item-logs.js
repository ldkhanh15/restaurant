'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_item_logs', {
            id: { type: Sequelize.CHAR(36), primaryKey: true },
            order_item_id: { type: Sequelize.CHAR(36) },
            action: { type: Sequelize.STRING(50), allowNull: false },
            note: { type: Sequelize.TEXT },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
        });
        await queryInterface.addConstraint('order_item_logs', {
            fields: ['order_item_id'], type: 'foreign key', name: 'fk_oil_order_item',
            references: { table: 'order_items', field: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('order_item_logs');
    }
}; 
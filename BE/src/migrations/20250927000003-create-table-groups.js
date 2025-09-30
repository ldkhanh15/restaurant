'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('table_groups', {
            id: { type: Sequelize.CHAR(36), primaryKey: true },
            group_name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            table_ids: { type: Sequelize.JSON, allowNull: false },
            total_capacity: { type: Sequelize.INTEGER, allowNull: false },
            book_minutes: { type: Sequelize.INTEGER, defaultValue: 0 },
            deposit: { type: Sequelize.INTEGER, defaultValue: 0 },
            cancel_minutes: { type: Sequelize.INTEGER, defaultValue: 0 },
            status: { type: Sequelize.ENUM('available', 'occupied', 'cleaning', 'reserved'), defaultValue: 'available' },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
            updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
            deleted_at: { type: Sequelize.DATE }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('table_groups');
    }
}; 
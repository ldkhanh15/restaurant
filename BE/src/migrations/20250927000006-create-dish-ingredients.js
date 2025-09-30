'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('dish_ingredients', {
            dish_id: { type: Sequelize.CHAR(36), primaryKey: true },
            ingredient_id: { type: Sequelize.CHAR(36), primaryKey: true },
            quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false }
        });
        await queryInterface.addConstraint('dish_ingredients', {
            fields: ['dish_id'], type: 'foreign key', name: 'fk_di_dish',
            references: { table: 'dishes', field: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        });
        await queryInterface.addConstraint('dish_ingredients', {
            fields: ['ingredient_id'], type: 'foreign key', name: 'fk_di_ingredient',
            references: { table: 'ingredients', field: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        });
        await queryInterface.addIndex('dish_ingredients', ['dish_id', 'ingredient_id'], { name: 'idx_dish_ingredients', unique: true });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('dish_ingredients');
    }
}; 
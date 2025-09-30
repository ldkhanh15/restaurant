'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert('dish_ingredients', [
            { dish_id: 'd-1', ingredient_id: 'i-1', quantity: 1 },
            { dish_id: 'd-2', ingredient_id: 'i-2', quantity: 2 },
            { dish_id: 'd-3', ingredient_id: 'i-3', quantity: 3 },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('dish_ingredients', null, {});
    }
}; 
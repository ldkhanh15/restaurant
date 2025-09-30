'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_logs', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      employee_id: { type: Sequelize.CHAR(36), allowNull: true },
      check_in_time: { type: Sequelize.DATE, allowNull: true },
      check_out_time: { type: Sequelize.DATE, allowNull: true },
      face_image_url: { type: Sequelize.STRING(255), allowNull: true },
      verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('attendance_logs', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_attendance_logs_employee_id',
      references: {
        table: 'employees',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance_logs');
  }
};

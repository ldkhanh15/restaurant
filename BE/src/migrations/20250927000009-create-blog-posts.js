'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blog_posts', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      images: { type: Sequelize.JSON, allowNull: true },
      author_id: { type: Sequelize.CHAR(36), allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'published'), defaultValue: 'draft' },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('blog_posts', {
      fields: ['author_id'],
      type: 'foreign key',
      name: 'fk_blog_posts_author_id',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('blog_posts');
  }
};

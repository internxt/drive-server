'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mail_limits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mail_type: {
        type: Sequelize.ENUM('invite_friend', 'reset_password', 'remove_account', 'email_verification'),
        allowNull: false
      },
      attempts_count: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        defaultValue: 0
      },
      attempts_limit: {
        type: Sequelize.INTEGER(10),
        allowNull: false,
        defaultValue: 0
      },
      last_mail_sent: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(0)
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('mail_limits');
  }
};

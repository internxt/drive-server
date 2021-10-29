module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('storage'),
        allowNull: false
      },
      credit: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      steps: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('users_referrals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      referral_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'referrals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      referred: {
        type: Sequelize.STRING,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      applied: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users_referrals');
    await queryInterface.dropTable('referrals');
  }
};

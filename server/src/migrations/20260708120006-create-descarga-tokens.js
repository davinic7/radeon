module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('descarga_tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      orden_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ordenes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      expira_en: { type: Sequelize.DATE, allowNull: false },
      usado_en: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('descarga_tokens');
  },
};

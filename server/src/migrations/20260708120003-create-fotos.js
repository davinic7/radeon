module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fotos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      evento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'eventos', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dorsal: { type: Sequelize.STRING, allowNull: false },
      preview_key: { type: Sequelize.STRING, allowNull: false },
      preview_url: { type: Sequelize.STRING, allowNull: false },
      original_key: { type: Sequelize.STRING, allowNull: false },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('fotos', ['evento_id', 'dorsal']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('fotos');
  },
};

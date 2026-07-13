module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('configuraciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      clave: { type: Sequelize.STRING, allowNull: false, unique: true },
      valor: { type: Sequelize.TEXT, allowNull: false },
      descripcion: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('configuraciones');
  },
};

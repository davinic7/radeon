module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mensajes', 'imagen_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('mensajes', 'imagen_key', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('mensajes', 'imagen_url');
    await queryInterface.removeColumn('mensajes', 'imagen_key');
  },
};

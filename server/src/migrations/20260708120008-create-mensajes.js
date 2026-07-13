module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mensajes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      telefono: { type: Sequelize.STRING, allowNull: true },
      mensaje: { type: Sequelize.TEXT, allowNull: false },
      leido: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('mensajes');
  },
};

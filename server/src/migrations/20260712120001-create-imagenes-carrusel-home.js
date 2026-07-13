module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('imagenes_carrusel_home', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      imagen_url: { type: Sequelize.STRING, allowNull: false },
      imagen_key: { type: Sequelize.STRING, allowNull: false },
      titulo: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false },
      destacado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('imagenes_carrusel_home');
  },
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('eventos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      ubicacion: { type: Sequelize.STRING, allowNull: true },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      portada_url: { type: Sequelize.STRING, allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
    await queryInterface.dropTable('eventos');
  },
};

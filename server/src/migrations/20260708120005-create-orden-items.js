module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orden_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      orden_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ordenes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      foto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'fotos', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('orden_items', ['orden_id', 'foto_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orden_items');
  },
};

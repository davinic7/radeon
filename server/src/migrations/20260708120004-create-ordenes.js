module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ordenes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cliente_nombre: { type: Sequelize.STRING, allowNull: true },
      cliente_email: { type: Sequelize.STRING, allowNull: false },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aprobada', 'rechazada', 'expirada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      mp_preference_id: { type: Sequelize.STRING, allowNull: true },
      mp_payment_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ordenes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ordenes_estado";');
  },
};

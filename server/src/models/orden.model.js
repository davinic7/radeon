module.exports = (sequelize, DataTypes) => {
  const Orden = sequelize.define(
    'Orden',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clienteNombre: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clienteEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'expirada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      mpPreferenceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mpPaymentId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: 'ordenes',
      underscored: true,
    }
  );

  Orden.associate = (models) => {
    Orden.hasMany(models.OrdenItem, { foreignKey: 'ordenId', as: 'items', onDelete: 'CASCADE' });
    Orden.hasMany(models.DescargaToken, {
      foreignKey: 'ordenId',
      as: 'descargaTokens',
      onDelete: 'CASCADE',
    });
  };

  return Orden;
};

module.exports = (sequelize, DataTypes) => {
  const OrdenItem = sequelize.define(
    'OrdenItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ordenId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ordenes', key: 'id' },
      },
      fotoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'fotos', key: 'id' },
      },
      precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'orden_items',
      underscored: true,
      indexes: [{ unique: true, fields: ['orden_id', 'foto_id'] }],
    }
  );

  OrdenItem.associate = (models) => {
    OrdenItem.belongsTo(models.Orden, { foreignKey: 'ordenId', as: 'orden' });
    OrdenItem.belongsTo(models.Foto, { foreignKey: 'fotoId', as: 'foto' });
  };

  return OrdenItem;
};

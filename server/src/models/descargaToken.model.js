module.exports = (sequelize, DataTypes) => {
  const DescargaToken = sequelize.define(
    'DescargaToken',
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
      token: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      expiraEn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usadoEn: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'descarga_tokens',
      underscored: true,
    }
  );

  DescargaToken.associate = (models) => {
    DescargaToken.belongsTo(models.Orden, { foreignKey: 'ordenId', as: 'orden' });
  };

  return DescargaToken;
};

module.exports = (sequelize, DataTypes) => {
  const Configuracion = sequelize.define(
    'Configuracion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clave: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      valor: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'configuraciones',
      underscored: true,
    }
  );

  return Configuracion;
};

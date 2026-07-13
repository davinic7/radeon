module.exports = (sequelize, DataTypes) => {
  const ImagenCarruselHome = sequelize.define(
    'ImagenCarruselHome',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      imagenUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Key del objeto en el bucket publico de previews (ver storage.service.js):
      // se guarda para poder borrar el archivo del bucket cuando se elimina la fila.
      imagenKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      destacado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
    },
    {
      tableName: 'imagenes_carrusel_home',
      underscored: true,
    }
  );

  ImagenCarruselHome.associate = (models) => {
    ImagenCarruselHome.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'fotografo' });
  };

  return ImagenCarruselHome;
};

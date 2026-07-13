module.exports = (sequelize, DataTypes) => {
  const Foto = sequelize.define(
    'Foto',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eventoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'eventos', key: 'id' },
      },
      dorsal: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      previewKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Key en el bucket publico de previews (con marca de agua y comprimida)',
      },
      previewUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'URL publica para mostrar en la web',
      },
      originalKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Key en el bucket privado de originales, nunca se expone directamente',
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Si es null, se usa el precio por defecto de Configuraciones',
      },
    },
    {
      tableName: 'fotos',
      underscored: true,
      indexes: [{ fields: ['evento_id', 'dorsal'] }],
    }
  );

  Foto.associate = (models) => {
    Foto.belongsTo(models.Evento, { foreignKey: 'eventoId', as: 'evento' });
    Foto.hasMany(models.OrdenItem, { foreignKey: 'fotoId', as: 'ordenItems' });
  };

  return Foto;
};

module.exports = (sequelize, DataTypes) => {
  const Evento = sequelize.define(
    'Evento',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      ubicacion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      portadaUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Redondela/badge de logo superpuesta en el borde inferior de la
      // portada en las tarjetas de evento (galeria.html, dashboard).
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      activo: {
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
      tableName: 'eventos',
      underscored: true,
    }
  );

  Evento.associate = (models) => {
    Evento.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'fotografo' });
    Evento.hasMany(models.Foto, { foreignKey: 'eventoId', as: 'fotos', onDelete: 'CASCADE' });
  };

  return Evento;
};

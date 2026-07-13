module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM('fotografo', 'admin'),
        allowNull: false,
        defaultValue: 'fotografo',
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'usuarios',
      underscored: true,
    }
  );

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Evento, { foreignKey: 'usuarioId', as: 'eventos' });
  };

  return Usuario;
};

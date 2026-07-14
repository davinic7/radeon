module.exports = (sequelize, DataTypes) => {
  const Mensaje = sequelize.define(
    'Mensaje',
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
        validate: { isEmail: true },
      },
      telefono: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      leido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      imagenUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Key del objeto en el bucket publico de previews (ver storage.service.js):
      // se guarda para poder borrar el archivo del bucket cuando se elimina el mensaje.
      imagenKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'mensajes',
      underscored: true,
    }
  );

  return Mensaje;
};

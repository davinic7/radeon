module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('configuraciones', [
      {
        clave: 'precio_foto_default',
        valor: '1500.00',
        descripcion: 'Precio por defecto de cada foto individual (ARS), usado si la foto no tiene precio propio',
        created_at: now,
        updated_at: now,
      },
      {
        clave: 'marca_agua_texto',
        valor: 'RIDEON FOTO DEPORTIVA',
        descripcion: 'Texto de marca de agua aplicado a los previews cuando no hay imagen de marca de agua configurada',
        created_at: now,
        updated_at: now,
      },
      {
        clave: 'moneda',
        valor: 'ARS',
        descripcion: 'Moneda usada en Mercado Pago',
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('configuraciones', {
      clave: ['precio_foto_default', 'marca_agua_texto', 'moneda'],
    });
  },
};

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const nombre = process.env.ADMIN_NOMBRE || 'Administrador RIDEON';

    if (!email || !password) {
      console.warn(
        'ADMIN_EMAIL / ADMIN_PASSWORD no definidos en .env: se omite la creacion del usuario admin inicial.'
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre,
        email,
        password_hash: passwordHash,
        rol: 'admin',
        activo: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  down: async (queryInterface) => {
    const email = process.env.ADMIN_EMAIL;
    if (!email) return;
    await queryInterface.bulkDelete('usuarios', { email });
  },
};

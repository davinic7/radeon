const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email y password son requeridos.');
  }

  const resultado = await authService.login(email, password);
  res.json(resultado);
});

module.exports = { login };

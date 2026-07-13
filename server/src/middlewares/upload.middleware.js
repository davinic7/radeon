const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Solo se permiten imagenes JPEG, PNG o WEBP.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 50 },
});

module.exports = upload;

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const eventosRoutes = require('./routes/eventos.routes');
const fotosRoutes = require('./routes/fotos.routes');
const carruselHomeRoutes = require('./routes/carruselHome.routes');
const ordenesRoutes = require('./routes/ordenes.routes');
const pagosRoutes = require('./routes/pagos.routes');
const descargasRoutes = require('./routes/descargas.routes');
const contactoRoutes = require('./routes/contacto.routes');
const configuracionesRoutes = require('./routes/configuraciones.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const env = require('./config/env');

const app = express();

// El sitio es HTML plano con scripts inline (Tailwind ahora se compila a
// css/tailwind.css, pero las paginas siguen teniendo <script> inline), asi
// que el Content-Security-Policy por defecto de helmet (que solo permite
// 'self') rompe la logica de las paginas.
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: env.frontendUrl }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/fotos', fotosRoutes);
app.use('/api/carrusel-home', carruselHomeRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/descargas', descargasRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/configuraciones', configuracionesRoutes);

// Sirve el sitio estatico existente (index.html, galeria.html, img/, etc.),
// que vive en la raiz del repositorio, un nivel por encima de server/. Se usa
// una lista blanca explicita de archivos .html y carpetas de assets en vez de
// `express.static(raizDelRepo)`: la raiz del repo tambien contiene server/
// (codigo de negocio, modelos, migraciones, package.json), y servir todo el
// arbol dejaba esos archivos descargables por cualquiera desde el navegador.
const raizDelRepo = path.join(__dirname, '..', '..');

const PAGINAS_PUBLICAS = [
  'index.html',
  'galeria.html',
  'nosotros.html',
  'contacto.html',
  'dashboard.html',
];

const CARPETAS_PUBLICAS = ['css', 'js', 'components', 'img'];

app.get('/', (req, res) => res.sendFile(path.join(raizDelRepo, 'index.html')));

PAGINAS_PUBLICAS.forEach((archivo) => {
  app.get(`/${archivo}`, (req, res) => res.sendFile(path.join(raizDelRepo, archivo)));
});

CARPETAS_PUBLICAS.forEach((carpeta) => {
  app.use(`/${carpeta}`, express.static(path.join(raizDelRepo, carpeta)));
});

// "img iconos" e "img logos" tienen espacio en el nombre de carpeta fisica.
// Express decodifica el pathname antes de matchear el mount path, asi que en
// teoria un solo `app.use('/img iconos', ...)` ya deberia resolver tanto
// '/img iconos/...' como '/img%20iconos/...'; se registran ambas formas de
// manera explicita igual, para no depender de ese detalle de implementacion.
app.use('/img%20iconos', express.static(path.join(raizDelRepo, 'img iconos')));
app.use('/img%20logos', express.static(path.join(raizDelRepo, 'img logos')));
app.use('/img iconos', express.static(path.join(raizDelRepo, 'img iconos')));
app.use('/img logos', express.static(path.join(raizDelRepo, 'img logos')));

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;

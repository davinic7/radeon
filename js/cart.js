/**
 * Carrito flotante compartido por todas las paginas publicas.
 *
 * MODELO DE ESTADO:
 * El estado "real" del carrito es el array `items` (declarado mas abajo),
 * que vive en memoria mientras dura la pagina. No hay backend de sesion de
 * carrito: cada operacion (agregar/quitar) muta `items` y despues persiste
 * una copia serializada en localStorage bajo STORAGE_KEY. localStorage es
 * lo que permite que el carrito "sobreviva" cuando el usuario navega de
 * index.html a galeria.html (paginas HTML distintas = JS reiniciado
 * desde cero cada vez), porque al cargar el script se relee ese storage y
 * se reconstruye `items` con lo que habia antes.
 *
 * API PUBLICA:
 * Este modulo expone `window.RideonCart` como unico punto de contacto para
 * el resto del sitio (los <script> inline de galeria.html, por ejemplo)
 * agreguen/quiten fotos o pregunten si una foto ya esta en el carrito, sin
 * tener que conocer los detalles de localStorage ni tocar el DOM del panel
 * directamente.
 */
(function () {
  // Prefijo de todas las llamadas al backend (ver server/src/routes/*).
  const API_BASE = '/api';
  // Clave fija de localStorage. Si se cambia este string, el carrito de
  // los usuarios con compras en curso se "perderia" (leerian una key vacia).
  const STORAGE_KEY = 'rideon_carrito';

  // Lee el carrito guardado la ULTIMA vez que se ejecuto guardar() en
  // cualquier pagina de este dominio. Se blinda con try/catch porque
  // localStorage puede tirar (modo incognito con storage deshabilitado,
  // cuota excedida, JSON corrupto) y en ese caso preferimos arrancar con
  // carrito vacio antes que romper la carga de la pagina entera.
  function leerCarrito() {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      const items = crudo ? JSON.parse(crudo) : [];
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  // `items` es la unica fuente de verdad en memoria. Se inicializa una sola
  // vez, al cargar el script, leyendo lo que haya en localStorage.
  let items = leerCarrito();
  // Set de funciones "suscriptas" a cambios del carrito (patron pub/sub
  // minimo). Por ejemplo, galeria.html se suscribe para repintar el
  // texto "Agregada ✓" de sus botones apenas el usuario agrega/quita algo
  // desde el panel lateral, sin que este archivo necesite saber nada de
  // esos botones.
  const escuchas = new Set();

  // Punto unico de "commit" del estado: se llama al final de CUALQUIER
  // operacion que mute `items`. Hace tres cosas en orden:
  //   1) Persiste `items` en localStorage (sobrevive a un F5 o a navegar
  //      a otra pagina del sitio).
  //   2) Notifica a todos los suscriptores externos (escuchas) pasandoles
  //      el array actualizado.
  //   3) Repinta la UI propia del carrito (badge del header + panel lateral).
  function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    escuchas.forEach((fn) => fn(items));
    actualizarUI();
  }

  function tiene(fotoId) {
    // Comparacion laxa: el id puede llegar como numero (objeto foto de la API)
    // o como string (leido de un atributo data-foto-id en el DOM).
    return items.some((item) => String(item.id) === String(fotoId));
  }

  // Agrega una foto solo si todavia no esta (evita duplicados si el
  // usuario hace doble click). `foto` es el objeto completo devuelto por
  // la API de busqueda (id, previewUrl, dorsal, precio, etc.) -- se guarda
  // tal cual para no tener que volver a pedirlo al backend al momento de
  // pintar el panel o de armar la orden de compra.
  function agregar(foto) {
    if (tiene(foto.id)) return;
    items.push(foto);
    guardar();
  }

  function quitar(fotoId) {
    items = items.filter((item) => String(item.id) !== String(fotoId));
    guardar();
  }

  // Toggle usado por los botones "Agregar al carrito" de la galeria y del
  // lightbox: un mismo click debe agregar si no estaba, o sacar si ya estaba.
  function alternar(foto) {
    if (tiene(foto.id)) {
      quitar(foto.id);
    } else {
      agregar(foto);
    }
  }

  // Acumula el total sumando el precio de cada item. `Number(item.precio || 0)`
  // evita que un item con precio undefined/null rompa la suma (queda como 0
  // en vez de propagar NaN a todo el total).
  function total() {
    return items.reduce((acc, item) => acc + Number(item.precio || 0), 0);
  }

  // Superficie publica minima: cualquier pagina puede leer/mutar el
  // carrito solo a traves de estas funciones, nunca tocando `items`
  // directamente (queda en el closure, no se expone).
  window.RideonCart = {
    agregar,
    quitar,
    alternar,
    tiene,
    total,
    obtenerTodos: () => [...items], // copia defensiva: quien la reciba no puede mutar el array interno
    suscribir: (fn) => escuchas.add(fn),
  };

  // ---------- UI: badge, panel lateral, checkout ----------
  // A diferencia del header/footer (renderizados por components/layout.js
  // directamente en el HTML de la pagina), el panel del carrito y su
  // overlay se crean 100% desde JS con document.createElement y se appendean
  // al final de <body>. Se guardan en estas dos variables de modulo para no
  // tener que recrearlos cada vez que se abre/cierra el carrito.
  let panel;
  let overlay;

  // Formatea numeros como pesos argentinos sin decimales (ej: $15.000),
  // usando la API nativa Intl en vez de manipular strings a mano.
  function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(valor);
  }

  // Construye una unica vez el markup del panel lateral + su overlay de
  // fondo. Se invoca la primera vez que hace falta mostrar el carrito
  // (ver el listener de 'layout:ready' mas abajo), no en la carga inicial
  // del script, para no crear DOM de mas en paginas donde el usuario nunca
  // llega a abrir el carrito.
  function crearPanel() {
    // Fondo oscuro semitransparente detras del panel. Empieza "hidden" y
    // solo tapa toda la pantalla (`fixed inset-0`) cuando se abre el carrito.
    overlay = document.createElement('div');
    overlay.id = 'carrito-overlay';
    overlay.className = 'fixed inset-0 z-50 hidden bg-black/70 backdrop-blur-sm animate-fade-in';

    // Panel lateral tipo "drawer": fijo a la derecha (`right-0 top-0`),
    // ocupa todo el alto (`h-full`) y en mobile todo el ancho disponible
    // (`w-full`), pero nunca mas de `max-w-md` en pantallas grandes -- asi
    // en desktop no tapa toda la pagina. `translate-x-full` lo saca fuera
    // de la pantalla por defecto; abrirPanel()/cerrarPanel() lo animan
    // sacando/poniendo esa clase (ver `transition-transform`).
    panel = document.createElement('aside');
    panel.id = 'carrito-panel';
    panel.className = 'fixed right-0 top-0 z-50 flex h-full w-full max-w-md translate-x-full flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-out';
    panel.innerHTML = `
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-lg font-bold uppercase tracking-wide text-brand-yellow">Tu carrito</h2>
        <button id="btn-cerrar-carrito" type="button" aria-label="Cerrar carrito" class="rounded-lg p-2 hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div id="carrito-items" class="flex-1 overflow-y-auto px-5 py-4"></div>

      <div class="border-t border-white/10 px-5 py-4">
        <div class="mb-3 flex items-center justify-between text-sm text-slate-300">
          <span>Total</span>
          <span id="carrito-total" class="text-xl font-bold text-white">$0</span>
        </div>
        <input
          id="carrito-email" type="email" required placeholder="Tu email para recibir las fotos" aria-label="Tu email para recibir las fotos"
          class="mb-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        >
        <input
          id="carrito-nombre" type="text" placeholder="Tu nombre (opcional)" aria-label="Tu nombre (opcional)"
          class="mb-3 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        >
        <p id="carrito-error" class="mb-2 hidden text-sm text-red-400"></p>
        <button
          id="btn-checkout" type="button"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-yellow px-4 py-3 font-bold text-slate-900 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Proceder al pago con Mercado Pago
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Cerrar tocando el fondo oscuro (patron estandar de modal/drawer) o el
    // boton "X"; el boton de checkout dispara finalizarCompra() (el flujo
    // de Mercado Pago, definido mas abajo).
    overlay.addEventListener('click', cerrarPanel);
    panel.querySelector('#btn-cerrar-carrito').addEventListener('click', cerrarPanel);
    panel.querySelector('#btn-checkout').addEventListener('click', finalizarCompra);
  }

  // Abre el drawer en dos pasos para que la animacion CSS se vea: primero
  // se saca "hidden" del overlay (queda pintado pero el panel todavia esta
  // fuera de pantalla), y en el SIGUIENTE frame (`requestAnimationFrame`)
  // recien se saca `translate-x-full` del panel. Si se sacaran ambas
  // clases en el mismo tick, el navegador podria pintar el estado final
  // directamente y la transicion de deslizamiento no se veria.
  function abrirPanel() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      panel.classList.remove('translate-x-full');
    });
  }

  // Simetrico a abrirPanel(): primero se vuelve a mandar el panel fuera de
  // pantalla (dispara la transicion de 300ms definida en su className), y
  // recien despues de ese tiempo (setTimeout 300 = duration-300 del panel)
  // se oculta el overlay. Si se ocultara el overlay de inmediato, la
  // animacion de salida del panel quedaria cortada abruptamente.
  function cerrarPanel() {
    panel.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }

  // Repinta la lista de items dentro del panel a partir del array `items`
  // en memoria. Se llama cada vez que cambia el carrito (via actualizarUI(),
  // que a su vez se llama desde guardar()), asi que siempre refleja el
  // estado mas reciente.
  function renderizarItems() {
    const contenedor = panel.querySelector('#carrito-items');
    if (items.length === 0) {
      contenedor.innerHTML = `<p class="mt-10 text-center text-sm text-slate-400">Todavia no agregaste ninguna foto.</p>`;
      return;
    }

    // Mapea cada item del carrito a una fila con miniatura + dorsal +
    // precio + boton de quitar. Se reconstruye TODO el HTML interno cada
    // vez (innerHTML) en vez de hacer diffing manual del DOM: para una
    // lista chica como esta (un puñado de fotos en el carrito) es mas
    // simple y suficientemente performante.
    contenedor.innerHTML = items
      .map(
        (item) => `
      <div class="mb-3 flex items-center gap-3 rounded-lg bg-slate-800/60 p-2">
        <img src="${item.previewUrl}" alt="Dorsal ${item.dorsal}" class="h-16 w-16 shrink-0 rounded-md object-cover">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">Dorsal ${item.dorsal}</p>
          <p class="text-sm text-brand-yellow">${formatearPrecio(Number(item.precio || 0))}</p>
        </div>
        <button data-quitar="${item.id}" aria-label="Quitar" class="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>`
      )
      .join('');

    // Delegar el click de "quitar" recorriendo los botones recien creados.
    // `boton.dataset.quitar` viene del atributo `data-quitar="${item.id}"`
    // del template de arriba: es el id de la foto, leido de vuelta desde
    // el DOM (siempre como string, por eso quitar()/tiene() comparan con
    // String(...) en vez de ===).
    contenedor.querySelectorAll('[data-quitar]').forEach((boton) => {
      boton.addEventListener('click', () => quitar(boton.dataset.quitar));
    });
  }

  // Sincroniza TODA la UI visible del carrito con el estado en memoria.
  // Se llama despues de cualquier mutacion (agregar/quitar) y tambien al
  // inicializar la pagina, para que el badge ya muestre el conteo correcto
  // si el usuario volvia con fotos guardadas de una visita anterior.
  function actualizarUI() {
    // Badge numerico sobre el icono del carrito en el header. Se oculta
    // por completo si no hay items, en vez de mostrar "0", para no
    // distraer visualmente cuando el carrito esta vacio.
    const contador = document.getElementById('carrito-contador');
    if (contador) {
      if (items.length > 0) {
        contador.textContent = String(items.length);
        contador.classList.remove('hidden');
        contador.classList.add('flex');
      } else {
        contador.classList.add('hidden');
        contador.classList.remove('flex');
      }
    }

    // El panel lateral puede no existir todavia (se crea recien al primer
    // click en el boton del carrito, ver crearPanel()), asi que solo se
    // repinta si ya fue creado.
    if (panel) {
      renderizarItems();
      panel.querySelector('#carrito-total').textContent = formatearPrecio(total());
    }
  }

  // Flujo de checkout: valida datos minimos en el cliente, crea la orden
  // en el backend, y redirige al usuario a la URL de pago de Mercado Pago
  // que ese backend genera. Este archivo NUNCA habla directo con la API de
  // Mercado Pago -- eso queda del lado del servidor (ver
  // server/src/services/mercadopago.service.js) para no exponer
  // credenciales de pago en el navegador. Aca solo se arma el pedido y se
  // sigue el link de pago que el servidor devuelve.
  async function finalizarCompra() {
    const emailInput = panel.querySelector('#carrito-email');
    const nombreInput = panel.querySelector('#carrito-nombre');
    const errorEl = panel.querySelector('#carrito-error');
    const boton = panel.querySelector('#btn-checkout');

    errorEl.classList.add('hidden');

    // Validaciones minimas en el cliente antes de gastar un round-trip al
    // servidor: carrito no vacio y email presente (el backend igual las
    // vuelve a validar, esto es solo para feedback instantaneo al usuario).
    if (items.length === 0) {
      errorEl.textContent = 'Tu carrito esta vacio.';
      errorEl.classList.remove('hidden');
      return;
    }

    const clienteEmail = emailInput.value.trim();
    if (!clienteEmail) {
      errorEl.textContent = 'Ingresa tu email para continuar.';
      errorEl.classList.remove('hidden');
      emailInput.focus();
      return;
    }

    // `type="email"` en el <input> NO alcanza aca para validar el formato:
    // esa validacion nativa del navegador solo se dispara sola al enviar un
    // <form>, y este boton es `type="button"` fuera de cualquier <form>
    // (el panel del carrito es un <aside>, no un formulario). Sin este
    // chequeo explicito, un email mal tipeado ("nombre@" sin dominio, por
    // ejemplo) pasaba silencioso: el cliente pagaba y nunca le llegaba el
    // link de descarga -- el peor escenario posible para conversion.
    // `checkValidity()`/`reportValidity()` funcionan sobre el input aislado
    // sin necesitar un <form> padre, y reportValidity() muestra el globo de
    // error nativo del navegador senalando exactamente que esta mal.
    if (!emailInput.checkValidity()) {
      errorEl.textContent = 'Ingresa un email valido.';
      errorEl.classList.remove('hidden');
      emailInput.reportValidity();
      emailInput.focus();
      return;
    }

    // Deshabilita el boton mientras esta en vuelo para evitar doble click
    // (que crearia dos ordenes por error).
    boton.disabled = true;
    boton.textContent = 'Procesando...';

    try {
      // Mapeo de datos: el frontend NO le manda a la API los objetos foto
      // completos (con previewUrl, dorsal, etc.), solo la lista de IDs
      // (`items.map((item) => item.id)`). El backend reconsulta esos IDs
      // contra su propia base de datos para obtener el precio real y armar
      // la preferencia de pago -- asi el precio que se cobra nunca depende
      // de lo que el cliente tenga guardado en su localStorage (que un
      // usuario podria manipular).
      const respuesta = await fetch(`${API_BASE}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteEmail,
          clienteNombre: nombreInput.value.trim(),
          fotoIds: items.map((item) => item.id),
        }),
      });

      if (!respuesta.ok) throw new Error('No se pudo crear la orden.');
      // El backend responde con `checkoutUrl`: el link de pago que Mercado
      // Pago genero para esta orden especifica (una "preferencia" de pago).
      // Redirigir el navegador entero a esa URL saca al usuario de este
      // sitio y lo lleva al checkout hosteado por Mercado Pago; el estado
      // del carrito local ya no importa a partir de aca (la orden quedo
      // registrada en el servidor con los fotoIds enviados).
      const { checkoutUrl } = await respuesta.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      // Cualquier falla de red o respuesta no-OK cae aca: se reactiva el
      // boton para que el usuario pueda reintentar sin recargar la pagina.
      console.error(error);
      errorEl.textContent = 'Ocurrio un error al procesar la compra. Intenta de nuevo.';
      errorEl.classList.remove('hidden');
      boton.disabled = false;
      boton.textContent = 'Proceder al pago con Mercado Pago';
    }
  }

  // Conecta el boton del icono de carrito (dentro del header inyectado por
  // components/layout.js) con abrirPanel(), y fuerza un primer pintado del
  // badge/panel con el estado ya leido de localStorage.
  function initBotonFlotante() {
    const boton = document.getElementById('btn-carrito-flotante');
    if (boton) boton.addEventListener('click', abrirPanel);
    actualizarUI();
  }

  // Punto de entrada normal: este script se carga con <script defer> justo
  // despues de components/layout.js en cada pagina (ver los <script> al
  // final de cada HTML), asi que espera al evento custom 'layout:ready'
  // (disparado por mount() en layout.js) para recien ahi crear el panel y
  // cablear el boton -- porque #btn-carrito-flotante no existe en el DOM
  // hasta que el header fue inyectado.
  document.addEventListener('layout:ready', () => {
    if (!panel) crearPanel();
    initBotonFlotante();
  });

  if (document.getElementById('site-header') === null) {
    // Paginas sin header inyectado (no deberia pasar, pero por las dudas
    // igual dejamos el carrito accesible via API).
    document.addEventListener('DOMContentLoaded', () => {
      if (!panel) crearPanel();
    });
  }
})();

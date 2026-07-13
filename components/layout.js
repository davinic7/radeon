/**
 * Header, nav y footer compartidos de RIDEON FOTO DEPORTIVA.
 *
 * QUE PROBLEMA RESUELVE:
 * Este sitio no tiene build ni templating (ver CLAUDE.md), asi que en las
 * paginas HTML "clasicas" el header/nav/footer estaban copy-pasteados
 * literal en cada archivo. Este modulo reemplaza esa copia manual por una
 * inyeccion en runtime: cada pagina solo declara dos contenedores vacios
 * (<header id="site-header"> y <footer id="site-footer">) y este script
 * los llena con el mismo HTML en todas las paginas. Cambiar un link de nav
 * o una columna del footer ahora es "editar este archivo una vez" en vez
 * de "editar 6 archivos HTML a mano".
 *
 * COMO SABE QUE LINK MARCAR COMO ACTIVO:
 * Cada <body> declara `data-page="index"` (o "coberturas", etc). Ese valor
 * se lee en mount() y se compara contra `link.page` de cada item de
 * NAV_LINKS para decidir que clase (activa vs inactiva) le corresponde.
 *
 * NOTA SOBRE EL BUG HISTORICO DE LOS <li>: en el markup viejo (hand-pasted)
 * los <li> del nav quedaban anidados unos dentro de otros por error (ver
 * CLAUDE.md, "Known pre-existing issues"). Aca generamos cada <li> como
 * hermano del anterior dentro del mismo `.map(...).join('')` (ninguno
 * envuelve a otro), asi que esta version SI produce una lista <ul><li>...
 * valida. Si algun dia se vuelve a tocar este render, cuidado de no
 * reintroducir el anidamiento.
 */
(function () {
  // Fuente unica de verdad para el menu: agregar/quitar una pagina del
  // sitio es agregar/quitar una linea aca, no tocar HTML en 6 lugares.
  const NAV_LINKS = [
    { href: 'index.html', label: 'Inicio', page: 'index' },
    { href: 'galeria.html', label: 'Eventos', page: 'galeria' },
    { href: 'nosotros.html', label: 'Nosotros', page: 'nosotros' },
    { href: 'contacto.html', label: 'Contacto', page: 'contacto' },
  ];

  // Devuelve las clases Tailwind de un link de nav segun si es la pagina
  // actual. `isActive` pinta el link con el amarillo de marca (bg-brand-yellow)
  // y texto oscuro; si no esta activo, queda blanco y solo se pinta de
  // amarillo al pasar el mouse (hover:bg-brand-yellow). Es la misma logica
  // visual para el menu de escritorio y el menu movil, porque ambos llaman
  // a esta funcion a traves de renderHeader().
  function navLinkClass(isActive) {
    return [
      'block rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wide no-underline transition-all duration-300',
      isActive
        ? 'bg-brand-yellow text-slate-900'
        : 'text-white hover:bg-brand-yellow hover:text-slate-900',
    ].join(' ');
  }

  // Genera el string de <li> del nav. Se llama dos veces en renderHeader()
  // (una para el <ul> de escritorio, otra para el <ul id="menu-movil"> que
  // se abre en mobile) reusando el mismo array `links`, asi el desktop y el
  // mobile menu nunca pueden desincronizarse entre si.
  function renderHeader(activePage) {
    const links = NAV_LINKS.map(
      (link) => `
        <li>
          <a href="${link.href}" class="${navLinkClass(link.page === activePage)}">
            ${link.label}
          </a>
        </li>`
    ).join('');

    // Layout mobile-first: por defecto (sin prefijo de breakpoint) el nav
    // de escritorio esta oculto (`hidden`) y el boton hamburguesa esta
    // visible; recien desde `md:` (768px+) se invierte con `md:flex` en el
    // <ul> de escritorio y `md:hidden` en el boton hamburguesa. Asi el HTML
    // sirve tanto para celular como para desktop sin duplicar markup, solo
    // alternando que se muestra segun el ancho de pantalla.
    return `
      <nav class="sticky top-0 z-40 bg-brand-red/95 backdrop-blur supports-[backdrop-filter]:bg-brand-red/80 shadow-lg shadow-black/30">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <a href="index.html" class="shrink-0">
            <img src="/img logos/LOGO_Mixto.png" alt="RIDEON FOTO DEPORTIVA" class="h-12 w-auto sm:h-14">
          </a>

          <!-- Nav de escritorio: oculto por defecto (mobile-first), visible desde md: -->
          <ul class="hidden list-none items-center gap-1 md:flex">
            ${links}
          </ul>

          <div class="flex items-center gap-2">
            <!-- Boton flotante del carrito: visible en header en TODOS los
                 tamanos de pantalla (a diferencia del nav, no se oculta en
                 mobile). js/cart.js escucha su click y actualiza el numero
                 en #carrito-contador cada vez que cambia el estado. -->
            <button
              id="btn-carrito-flotante"
              type="button"
              aria-label="Abrir carrito"
              class="relative flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-yellow-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <!-- La palabra "Carrito" solo aparece desde sm: (>=640px); en
                   celulares muy angostos queda solo el icono para no
                   apretar el header. -->
              <span class="hidden sm:inline">Carrito</span>
              <!-- Badge con la cantidad de items. Arranca "hidden" (carrito
                   vacio); actualizarUI() en cart.js lo muestra/oculta y
                   escribe el numero segun items.length. -->
              <span id="carrito-contador" class="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-brand-red text-xs text-white">0</span>
            </button>

            <!-- Boton hamburguesa: solo visible en mobile (md:hidden). Su
                 click esta cableado en initMobileMenu(), mas abajo. -->
            <button
              id="btn-menu-movil"
              type="button"
              aria-label="Abrir menu"
              aria-expanded="false"
              class="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Menu desplegable de mobile: arranca "hidden" (colapsado) y
             initMobileMenu() lo destapa con toggle('hidden') al tocar el
             boton hamburguesa. Reusa el mismo array "links" que el <ul> de
             escritorio de mas arriba: un solo array de datos, dos vistas. -->
        <ul id="menu-movil" class="hidden list-none flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          ${links}
        </ul>
      </nav>`;
  }

  // Bloque de "Suscribite al newsletter" / "Conoce otros trabajos" /
  // "Contactanos" que iba arriba del footer negro. Desactivado en TODO el
  // sitio a pedido de producto (antes solo se ocultaba en el Home, pero
  // seguia apareciendo en el resto de las paginas por venir del layout
  // compartido). Se deja comentado en vez de borrado por higiene de
  // codigo, para reactivarlo facil si hace falta a futuro: descomentar
  // esta funcion y volver a invocarla en renderFooter(), mas abajo.
  /*
  function renderNewsletterYAccesos() {
    return `
      <section class="border-t border-white/10 bg-slate-950 px-4 py-12 text-center">
        <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div>
            <h3 class="font-bold uppercase tracking-wide text-brand-yellow">Suscribite al newsletter</h3>
            <p class="mt-2 text-sm text-slate-400">Novedades sobre coberturas, eventos y lanzamientos.</p>
            <form class="mt-4 flex flex-col items-center gap-2">
              <input
                type="email" placeholder="tuemail@ejemplo.com" required
                class="w-full max-w-xs rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-center text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
              <button type="submit" class="w-full max-w-xs rounded-lg bg-brand-yellow px-4 py-2 font-bold text-slate-900 transition hover:bg-yellow-400">
                Suscribirme
              </button>
            </form>
          </div>

          <div>
            <h3 class="font-bold uppercase tracking-wide text-brand-yellow">Conoce otros trabajos</h3>
            <p class="mt-2 text-sm text-slate-400">Mira lo ultimo que hicimos, te va a sorprender.</p>
            <a href="nosotros.html" class="mt-4 inline-block w-full max-w-xs rounded-lg border border-white/10 px-4 py-2 font-bold text-white transition hover:border-brand-yellow hover:text-brand-yellow">
              Ver galeria
            </a>
          </div>

          <div>
            <h3 class="font-bold uppercase tracking-wide text-brand-yellow">Contactanos</h3>
            <p class="mt-2 text-sm text-slate-400">Tenes alguna pregunta? Hacenoslo saber.</p>
            <a href="contacto.html" class="mt-4 inline-block w-full max-w-xs rounded-lg border border-white/10 px-4 py-2 font-bold text-white transition hover:border-brand-yellow hover:text-brand-yellow">
              Contacto
            </a>
          </div>
        </div>
      </section>`;
  }
  */

  // Footer compartido: columnas de links + redes sociales + metodos de
  // pago. El bloque de newsletter/accesos rapidos que iba arriba se
  // desactivo en todo el sitio (ver comentario mas arriba). `md:flex` es
  // la unica logica responsiva real aca: en mobile todo se apila en una
  // sola columna (comportamiento por defecto de un div sin clases de
  // grid), y recien en tablet/desktop (md:) se acomoda en fila.
  function renderFooter() {
    return `
      <footer class="bg-black px-4 pb-8 pt-16 text-center">
        <a href="index.html" class="inline-block">
          <img src="/img logos/Logo_Blanco.png" alt="RIDEON FOTO DEPORTIVA" class="mx-auto w-20">
        </a>

        <!-- Columnas de links del footer: en mobile se ocultan del todo
             ("hidden") para no alargar la pagina con 5 columnas apiladas;
             recien aparecen desde md: como fila ("md:flex"). Es una
             decision de contenido, no solo de layout: en celular el
             usuario ya tiene los accesos mas importantes en el nav/menu
             movil, asi que estas columnas secundarias se priorizan menos. -->
        <section class="mx-auto mt-8 hidden max-w-6xl gap-6 text-left text-slate-300 md:flex md:justify-between">
          <div>
            <ul class="space-y-1">
              <li class="mb-1 font-bold text-white">Atencion al cliente</li>
              <li><a href="contacto.html" class="hover:text-brand-yellow">Contacto</a></li>
            </ul>
          </div>
          <div>
            <ul class="space-y-1">
              <li class="mb-1 font-bold text-white">Quienes somos</li>
              <li><a href="nosotros.html" class="hover:text-brand-yellow">Historia</a></li>
            </ul>
          </div>
          <div>
            <ul class="space-y-1">
              <li class="mb-1 font-bold text-white">Eventos</li>
              <li><a href="galeria.html" class="hover:text-brand-yellow">Buscar mi dorsal</a></li>
            </ul>
          </div>
          <div>
            <ul class="space-y-1">
              <li class="mb-1 font-bold text-white">Metodos de pago</li>
              <li class="flex items-center gap-1"><img src="/img iconos/icons8-mercado-pago-50.png" alt="" class="h-5 w-5"> Mercado Pago</li>
            </ul>
          </div>
          <div>
            <ul class="space-y-1">
              <li class="mb-1 font-bold text-white">Redes sociales</li>
              <li><a href="https://www.instagram.com/ride.on.foto/" target="_blank" rel="noopener" class="hover:text-brand-yellow">Instagram</a></li>
            </ul>
          </div>
        </section>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="https://www.instagram.com/ride.on.foto/" target="_blank" rel="noopener"><img src="/img iconos/icons8-instagram-50.png" alt="Instagram" class="h-6 w-6 opacity-70 transition hover:opacity-100"></a>
        </div>

        <div class="mt-4 flex items-center justify-center gap-4">
          <img src="/img iconos/icons8-mercado-pago-50.png" alt="Mercado Pago" class="h-6 w-6 opacity-70">
          <img src="/img iconos/icons8-visa-50.png" alt="Visa" class="h-6 w-6 opacity-70">
          <img src="/img iconos/icons8-mastercard-50.png" alt="Mastercard" class="h-6 w-6 opacity-70">
        </div>

        <p class="mt-6 text-xs text-slate-500">Copyright &copy; 2025-2026 - Todos los derechos reservados RIDEON FOTO DEPORTIVA</p>
      </footer>`;
  }

  // Cablea el click del boton hamburguesa DESPUES de que renderHeader() ya
  // metio el HTML en el DOM (por eso se llama recien dentro de mount(), no
  // antes). getElementById busca los nodos por id porque son literales
  // fijos en el template de renderHeader(); si esos ids cambian ahi, hay
  // que actualizarlos aca tambien.
  function initMobileMenu() {
    const btn = document.getElementById('btn-menu-movil');
    const menu = document.getElementById('menu-movil');
    if (!btn || !menu) return; // pagina sin header inyectado: no hay nada que cablear

    btn.addEventListener('click', () => {
      // Se lee el estado ANTES de hacer el toggle, porque despues de
      // togglear la clase "hidden" ya no se puede inferir cual era el
      // estado previo. `aria-expanded` se actualiza en paralelo para que
      // lectores de pantalla anuncien correctamente si el menu quedo
      // abierto o cerrado (accesibilidad, no solo visual).
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Punto de entrada del "ciclo de vida" de este componente. Se ejecuta
  // una unica vez por carga de pagina (ver el guard de readyState al final
  // del archivo) y hace, en orden:
  //   1) Localiza los dos slots vacios que cada pagina declara en su HTML
  //      (<header id="site-header"> / <footer id="site-footer">).
  //   2) Lee `data-page` del <body> para saber que link de nav resaltar.
  //   3) Inyecta el HTML generado (innerHTML) dentro de esos slots. Recien
  //      en este punto existen en el DOM real los botones/links del header
  //      y footer -- antes de esto, document.getElementById('btn-...')
  //      hubiera devuelto null.
  //   4) Cablea el listener del menu movil (necesita el DOM ya inyectado).
  //   5) Dispara un evento custom `layout:ready` para avisarle al resto de
  //      la pagina (js/cart.js, y los <script> inline de cada HTML) que ya
  //      es seguro buscar elementos como #btn-carrito-flotante o
  //      #carrito-contador. Este evento es el "contrato" que reemplaza a
  //      un callback o a una promesa: cualquier script que dependa del
  //      header/footer inyectado debe escuchar 'layout:ready' en vez de
  //      asumir que el DOM ya esta listo por su cuenta.
  function mount() {
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    const activePage = document.body.dataset.page || '';

    if (headerSlot) headerSlot.innerHTML = renderHeader(activePage);
    if (footerSlot) footerSlot.innerHTML = renderFooter();

    initMobileMenu();
    document.dispatchEvent(new CustomEvent('layout:ready'));
  }

  // Nota: para un <script defer>, document.readyState ya vale "interactive"
  // (nunca "loading") en cuanto empieza a ejecutarse, porque defer solo corre
  // scripts externos despues de terminar el parseo del HTML pero antes de
  // DOMContentLoaded. Si dispatch'aramos layout:ready aca mismo, se dispararia
  // antes de que js/cart.js (el siguiente script deferred) llegue a ejecutarse.
  // Por eso esperamos siempre a DOMContentLoaded, que si esta garantizado a
  // ocurrir despues de todos los scripts deferred.
  if (document.readyState === 'complete') {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();

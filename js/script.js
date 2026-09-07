/* =====================================================================
   LÓGICA DE LA TIENDA (cliente)
   Todas las llamadas van a STORE_CONFIG.apiBaseUrl (ver js/config.js),
   que apunta al backend desplegado por separado.
   ===================================================================== */

let PRODUCTS = [];
let currentPage = 1;
let searchTerm = "";

const gridEl = document.getElementById("productGrid");
const paginationEl = document.getElementById("pagination");
const emptyStateEl = document.getElementById("emptyState");
const resultsCountEl = document.getElementById("resultsCount");
const searchInputEl = document.getElementById("searchInput");

function formatearPrecio(valor) {
  const formateado = valor.toLocaleString("es-CO");
  return `${STORE_CONFIG.currency}${formateado}`;
}

function construirLinkWhatsApp(producto) {
  const mensaje = STORE_CONFIG.whatsappMessageTemplate
    .replace("{producto}", producto.nombre)
    .replace("{precio}", formatearPrecio(producto.precio));

  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${mensajeCodificado}`;
}

function obtenerProductosFiltrados() {
  const termino = searchTerm.trim().toLowerCase();
  if (!termino) return PRODUCTS;
  return PRODUCTS.filter((p) => p.nombre.toLowerCase().includes(termino));
}

/** Convierte una ruta relativa guardada en el catálogo (ej. "images/products/x.jpg")
 *  en una URL absoluta hacia el backend, ya que ahora vive en otro dominio. */
function urlImagen(rutaRelativa) {
  return `${STORE_CONFIG.apiBaseUrl}/${rutaRelativa}`;
}

function crearCarrusel(producto) {
  const imagenes = Array.isArray(producto.imagenes) && producto.imagenes.length
    ? producto.imagenes
    : [];

  const slidesHTML = imagenes
    .map(
      (ruta) => `
      <div class="carousel-slide">
        <img
          src="${urlImagen(ruta)}"
          alt="${producto.nombre}"
          loading="lazy"
          onerror="this.onerror=null; this.src='https://placehold.co/800x1000?text=Imagen+no+disponible';"
        />
      </div>`
    )
    .join("");

  const tieneVarias = imagenes.length > 1;

  const flechasHTML = tieneVarias
    ? `
      <button type="button" class="carousel-arrow carousel-prev" data-action="prev" aria-label="Foto anterior">‹</button>
      <button type="button" class="carousel-arrow carousel-next" data-action="next" aria-label="Foto siguiente">›</button>
    `
    : "";

  const puntosHTML = tieneVarias
    ? `<div class="carousel-dots">${imagenes
        .map((_, i) => `<button type="button" class="carousel-dot ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Ver foto ${i + 1}"></button>`)
        .join("")}</div>`
    : "";

  return `
    <div class="carousel-track">${slidesHTML}</div>
    ${flechasHTML}
    ${puntosHTML}
  `;
}

function crearTarjetaProducto(producto) {
  const badgeHTML = producto.badge
    ? `<span class="product-badge">${producto.badge}</span>`
    : "";

  return `
    <article class="product-card" data-index="0">
      <div class="product-image">
        ${badgeHTML}
        ${crearCarrusel(producto)}
      </div>
      <div class="product-body">
        <h3 class="product-name">${producto.nombre}</h3>
        <p class="product-desc">${producto.descripcion}</p>
        <div class="product-footer">
          <span class="product-price">${formatearPrecio(producto.precio)}</span>
          <a
            class="buy-btn"
            href="${construirLinkWhatsApp(producto)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.28.57-.35.76-.35h.55c.18 0 .42-.03.65.5.24.56.81 1.94.88 2.08.07.14.11.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.13.44.19.5.3.07.11.07.63-.17 1.3z"/>
            </svg>
            Comprar
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderizar() {
  const filtrados = obtenerProductosFiltrados();
  const porPagina = STORE_CONFIG.productsPerPage;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));

  if (currentPage > totalPaginas) currentPage = totalPaginas;

  const inicio = (currentPage - 1) * porPagina;
  const productosPagina = filtrados.slice(inicio, inicio + porPagina);

  if (filtrados.length === 0) {
    gridEl.innerHTML = "";
    emptyStateEl.hidden = false;
  } else {
    emptyStateEl.hidden = true;
    gridEl.innerHTML = productosPagina.map(crearTarjetaProducto).join("");
  }

  resultsCountEl.textContent = `${filtrados.length} producto${filtrados.length === 1 ? "" : "s"}`;

  renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
  if (totalPaginas <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let botones = "";
  botones += `<button class="page-btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""} aria-label="Página anterior">‹</button>`;

  for (let i = 1; i <= totalPaginas; i++) {
    botones += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}" aria-current="${i === currentPage ? "page" : "false"}">${i}</button>`;
  }

  botones += `<button class="page-btn" data-page="next" ${currentPage === totalPaginas ? "disabled" : ""} aria-label="Página siguiente">›</button>`;

  paginationEl.innerHTML = botones;
}

/**
 * Carga el catálogo desde el backend. Si la API no responde (apagada,
 * URL mal configurada en config.js, o bloqueada por CORS), se muestra
 * un mensaje claro en vez de dejar la tienda vacía sin explicación.
 */
async function cargarProductos() {
  gridEl.innerHTML = `<p class="loading-state">Cargando catálogo...</p>`;
  try {
    const respuesta = await fetch(`${STORE_CONFIG.apiBaseUrl}/api/products`);
    if (!respuesta.ok) throw new Error("Respuesta no válida del servidor");
    PRODUCTS = await respuesta.json();
    renderizar();
  } catch (error) {
    gridEl.innerHTML = `<p class="error-state">No se pudo conectar con la tienda. Verifica que STORE_CONFIG.apiBaseUrl en js/config.js apunte a tu backend, que esté corriendo, y recarga la página.</p>`;
    resultsCountEl.textContent = "";
  }
}

/* ---------- EVENTOS ---------- */

function irAFotoDelCarrusel(cardEl, indiceDeseado) {
  const track = cardEl.querySelector(".carousel-track");
  if (!track) return;

  const totalFotos = track.children.length;
  const indice = ((indiceDeseado % totalFotos) + totalFotos) % totalFotos;

  track.style.transform = `translateX(-${indice * 100}%)`;
  cardEl.dataset.index = String(indice);

  cardEl.querySelectorAll(".carousel-dot").forEach((punto, i) => {
    punto.classList.toggle("active", i === indice);
  });
}

gridEl.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const indiceActual = Number(card.dataset.index || 0);

  if (e.target.closest('[data-action="prev"]')) {
    irAFotoDelCarrusel(card, indiceActual - 1);
    return;
  }
  if (e.target.closest('[data-action="next"]')) {
    irAFotoDelCarrusel(card, indiceActual + 1);
    return;
  }
  const punto = e.target.closest(".carousel-dot");
  if (punto) {
    irAFotoDelCarrusel(card, Number(punto.dataset.index));
  }
});

paginationEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".page-btn");
  if (!btn || btn.disabled) return;

  const valor = btn.dataset.page;
  if (valor === "prev") currentPage -= 1;
  else if (valor === "next") currentPage += 1;
  else currentPage = Number(valor);

  renderizar();
  document.querySelector(".catalog-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

searchInputEl.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  currentPage = 1;
  renderizar();
});

document.getElementById("year").textContent = new Date().getFullYear();

cargarProductos();

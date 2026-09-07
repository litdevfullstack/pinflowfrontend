/* =====================================================================
   LÓGICA DEL PANEL ADMIN
   Todas las llamadas van a STORE_CONFIG.apiBaseUrl (ver ../js/config.js).
   "credentials: 'include'" es OBLIGATORIO en cada fetch: es lo que le
   dice al navegador que mande/reciba la cookie de sesión aunque el
   backend esté en un dominio distinto al del frontend.
   ===================================================================== */

const API = () => STORE_CONFIG.apiBaseUrl;

/* ---------------------------------------------------------------------
   BLOQUE 1: LOGIN (login.html)
   --------------------------------------------------------------------- */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("loginError");
    errorEl.hidden = true;

    try {
      const res = await fetch(`${API()}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || "No se pudo iniciar sesión.";
        errorEl.hidden = false;
        return;
      }

      window.location.href = "admin.html";
    } catch (err) {
      errorEl.textContent = "No se pudo conectar con el servidor. Revisa STORE_CONFIG.apiBaseUrl en js/config.js.";
      errorEl.hidden = false;
    }
  });
}

/* ---------------------------------------------------------------------
   BLOQUE 2: PANEL DE PRODUCTOS (admin.html)
   --------------------------------------------------------------------- */
const productForm = document.getElementById("productForm");

if (productForm) {
  const productListEl = document.getElementById("productList");
  const formTitleEl = document.getElementById("formTitle");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formErrorEl = document.getElementById("formError");
  const imagenesInput = document.getElementById("imagenes");
  const imagenesRequeridasEl = document.getElementById("imagenesRequeridas");
  const previewWrap = document.getElementById("previewWrap");
  const existingImagesWrap = document.getElementById("existingImagesWrap");
  const existingImagesList = document.getElementById("existingImagesList");
  const logoutBtn = document.getElementById("logoutBtn");

  let editandoId = null;
  let imagenesExistentes = [];
  let imagenesAEliminar = [];

  function urlImagen(rutaRelativa) {
    return `${API()}/${rutaRelativa}`;
  }

  /** Verifica que haya sesión activa; si no, manda al login. */
  async function verificarSesion() {
    try {
      const res = await fetch(`${API()}/api/session`, { credentials: "include" });
      const data = await res.json();
      if (!data.isAdmin) {
        window.location.href = "login.html";
      }
    } catch (err) {
      // Si la API no responde, igual mandamos a login: ahí se ve el
      // mensaje de error de conexión y es más claro para el usuario.
      window.location.href = "login.html";
    }
  }

  async function cargarLista() {
    const res = await fetch(`${API()}/api/products`, { credentials: "include" });
    const productos = await res.json();

    if (productos.length === 0) {
      productListEl.innerHTML = `<p class="admin-hint">Aún no hay productos. Agrega el primero arriba.</p>`;
      return;
    }

    productListEl.innerHTML = productos
      .map((p) => {
        const totalFotos = (p.imagenes || []).length;
        const contadorFotos = totalFotos > 1 ? ` · ${totalFotos} fotos` : "";
        return `
        <div class="admin-product-row" data-id="${p.id}">
          <img src="${urlImagen(p.imagenes[0])}" alt="${p.nombre}" />
          <div class="admin-product-info">
            <strong>${p.nombre}</strong>
            <span>$${p.precio.toLocaleString("es-CO")}${p.badge ? " · " + p.badge : ""}${contadorFotos}</span>
          </div>
          <div class="admin-product-actions">
            <button type="button" class="btn-secondary" data-action="editar">Editar</button>
            <button type="button" class="btn-danger" data-action="eliminar">Eliminar</button>
          </div>
        </div>
      `;
      })
      .join("");

    productListEl.dataset.productos = JSON.stringify(productos);
  }

  imagenesInput.addEventListener("change", () => {
    const archivos = Array.from(imagenesInput.files);

    if (archivos.length === 0) {
      previewWrap.hidden = true;
      previewWrap.innerHTML = "";
      return;
    }

    previewWrap.innerHTML = archivos
      .map(
        (archivo) => `
        <div class="thumb-item">
          <img src="${URL.createObjectURL(archivo)}" alt="Vista previa" />
          <span class="thumb-new-badge">Nueva</span>
        </div>
      `
      )
      .join("");
    previewWrap.hidden = false;
  });

  function dibujarImagenesExistentes() {
    existingImagesList.innerHTML = imagenesExistentes
      .map((ruta) => {
        const marcada = imagenesAEliminar.includes(ruta);
        return `
        <div class="thumb-item ${marcada ? "marcada-eliminar" : ""}" data-ruta="${ruta}">
          <img src="${urlImagen(ruta)}" alt="Foto del producto" />
          <button type="button" class="thumb-remove" data-ruta="${ruta}" title="${marcada ? "Deshacer" : "Quitar esta foto"}">
            ${marcada ? "↺" : "✕"}
          </button>
        </div>
      `;
      })
      .join("");
  }

  existingImagesList.addEventListener("click", (e) => {
    const btn = e.target.closest(".thumb-remove");
    if (!btn) return;
    const ruta = btn.dataset.ruta;

    if (imagenesAEliminar.includes(ruta)) {
      imagenesAEliminar = imagenesAEliminar.filter((r) => r !== ruta);
    } else {
      imagenesAEliminar.push(ruta);
    }
    dibujarImagenesExistentes();
  });

  function entrarModoEdicion(producto) {
    editandoId = producto.id;
    formTitleEl.textContent = `Editando: ${producto.nombre}`;
    submitBtn.textContent = "Guardar cambios";
    cancelEditBtn.hidden = false;
    imagenesRequeridasEl.textContent = "(opcional: agrega más fotos o deja vacío)";

    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("descripcion").value = producto.descripcion;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("badge").value = producto.badge || "";

    imagenesExistentes = [...producto.imagenes];
    imagenesAEliminar = [];
    dibujarImagenesExistentes();
    existingImagesWrap.hidden = false;

    previewWrap.hidden = true;
    previewWrap.innerHTML = "";
    imagenesInput.value = "";

    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirModoEdicion() {
    editandoId = null;
    imagenesExistentes = [];
    imagenesAEliminar = [];
    formTitleEl.textContent = "Agregar producto";
    submitBtn.textContent = "Guardar producto";
    cancelEditBtn.hidden = true;
    imagenesRequeridasEl.textContent = "*";
    productForm.reset();
    previewWrap.hidden = true;
    previewWrap.innerHTML = "";
    existingImagesWrap.hidden = true;
    existingImagesList.innerHTML = "";
  }

  cancelEditBtn.addEventListener("click", salirModoEdicion);

  productListEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const fila = btn.closest(".admin-product-row");
    const id = Number(fila.dataset.id);
    const productos = JSON.parse(productListEl.dataset.productos || "[]");
    const producto = productos.find((p) => p.id === id);

    if (btn.dataset.action === "editar") {
      entrarModoEdicion(producto);
    }

    if (btn.dataset.action === "eliminar") {
      const confirmar = confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`);
      if (!confirmar) return;

      const res = await fetch(`${API()}/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        if (editandoId === id) salirModoEdicion();
        cargarLista();
      } else {
        alert("No se pudo eliminar el producto.");
      }
    }
  });

  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErrorEl.hidden = true;
    submitBtn.disabled = true;

    const formData = new FormData(productForm);
    if (imagenesAEliminar.length > 0) {
      formData.append("eliminarImagenes", JSON.stringify(imagenesAEliminar));
    }

    if (!editandoId && imagenesInput.files.length === 0) {
      formErrorEl.textContent = "Debes subir al menos una foto del producto.";
      formErrorEl.hidden = false;
      submitBtn.disabled = false;
      return;
    }

    if (editandoId) {
      const fotosFinales = imagenesExistentes.length - imagenesAEliminar.length + imagenesInput.files.length;
      if (fotosFinales <= 0) {
        formErrorEl.textContent = "El producto debe quedar con al menos una foto.";
        formErrorEl.hidden = false;
        submitBtn.disabled = false;
        return;
      }
    }

    const url = editandoId ? `${API()}/api/products/${editandoId}` : `${API()}/api/products`;
    const method = editandoId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, credentials: "include", body: formData });
      const data = await res.json();

      if (!res.ok) {
        formErrorEl.textContent = data.error || "Ocurrió un error al guardar.";
        formErrorEl.hidden = false;
        return;
      }

      salirModoEdicion();
      cargarLista();
    } catch (err) {
      formErrorEl.textContent = "No se pudo conectar con el servidor.";
      formErrorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await fetch(`${API()}/api/logout`, { method: "POST", credentials: "include" });
    window.location.href = "login.html";
  });

  verificarSesion();
  cargarLista();
}

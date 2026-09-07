/* =====================================================================
   CONFIGURACIÓN DEL FRONTEND
   Este archivo lo usan TANTO la tienda pública (index.html) COMO el
   panel admin (admin/*.html) — así solo hay un lugar donde poner la
   URL del backend.

   ⚠️ CAMBIA "apiBaseUrl" ANTES DE DESPLEGAR:
   - En desarrollo local: la URL donde corre tu backend (ej. con
     "npm start" dentro de la carpeta backend/), normalmente
     http://localhost:3000
   - En producción: la URL pública que te da Railway/Render para tu
     backend, ej: https://mi-tienda-backend.up.railway.app
     (sin "/" al final)
   ===================================================================== */

const STORE_CONFIG = {
  apiBaseUrl: "https://pinflowbackend-1.onrender.com",

  // Número de WhatsApp SIN "+", sin espacios, con código de país.
  whatsappNumber: "573115789113",

  currency: "$",

  productsPerPage: 6,

  whatsappMessageTemplate:
    "Hola! Estoy interesado/a en comprar: {producto} ({precio}). ¿Está disponible?",
};

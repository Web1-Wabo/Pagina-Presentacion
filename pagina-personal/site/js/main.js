// Comportamiento común de todas las páginas. Se carga con defer,
// así que el DOM ya está disponible cuando se ejecuta.

// 1. Año actual en el pie de página.
const anio = document.getElementById('anio');
if (anio) {
  anio.textContent = String(new Date().getFullYear());
}

// 2. Botón "Volver arriba": desplaza al inicio y lleva el foco al h1
//    para que quien navega con teclado continúe desde arriba.
const botonArriba = document.querySelector('.volver-arriba');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

if (botonArriba) {
  botonArriba.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: reducirMovimiento.matches ? 'auto' : 'smooth'
    });

    const titulo = document.querySelector('h1');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }
  });
}

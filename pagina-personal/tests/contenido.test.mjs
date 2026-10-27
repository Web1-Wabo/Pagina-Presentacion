import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PERFIL } from './perfil.mjs';
import {
  contieneId,
  esExterno,
  extraerAtributos,
  extraerElementos,
  extraerRutas,
  extraerSeccion,
  leerSitio,
  resolverEnlace,
  textoPlano,
  tieneClase
} from './utilidades.mjs';

const PAGINAS = ['index.html', 'proyectos.html'];

// Comprobaciones comunes a todas las páginas.
for (const pagina of PAGINAS) {
  describe(`${pagina}: estructura común`, () => {
    const html = leerSitio(pagina);

    test('declara el idioma español', () => {
      assert.match(html, /<html\b[^>]*\slang="es"/, `${pagina}: falta lang="es" en <html>`);
    });

    test('tiene meta viewport', () => {
      const metas = extraerAtributos(html, 'meta');
      assert.ok(
        metas.some((m) => m.name === 'viewport' && m.content),
        `${pagina}: falta <meta name="viewport" content="...">`
      );
    });

    test('tiene meta description de más de 20 caracteres', () => {
      const descripcion = extraerAtributos(html, 'meta').find((m) => m.name === 'description');
      assert.ok(descripcion, `${pagina}: falta <meta name="description">`);
      assert.ok(
        (descripcion.content ?? '').trim().length > 20,
        `${pagina}: la meta description debe tener más de 20 caracteres`
      );
    });

    test('tiene un único h1 que contiene el nombre', () => {
      const titulos = extraerElementos(html, 'h1');
      assert.equal(titulos.length, 1, `${pagina}: debe haber exactamente un <h1> y hay ${titulos.length}`);
      assert.ok(
        textoPlano(titulos[0].contenido).includes(PERFIL.nombre),
        `${pagina}: el <h1> debe contener el nombre "${PERFIL.nombre}"`
      );
    });

    for (const etiqueta of ['header', 'nav', 'main', 'footer']) {
      test(`tiene <${etiqueta}>`, () => {
        assert.match(html, new RegExp(`<${etiqueta}\\b`), `${pagina}: falta el elemento <${etiqueta}>`);
      });
    }

    test('toda imagen tiene alt de 3 o más caracteres', () => {
      for (const img of extraerAtributos(html, 'img')) {
        assert.ok(
          (img.alt ?? '').trim().length >= 3,
          `${pagina}: la imagen "${img.src}" necesita un alt descriptivo de al menos 3 caracteres`
        );
      }
    });

    test('ningún href o src empieza por "/"', () => {
      for (const ruta of extraerRutas(html)) {
        assert.ok(
          !ruta.startsWith('/'),
          `${pagina}: la ruta "${ruta}" debe ser relativa (no puede empezar por "/")`
        );
      }
    });

    test('todo enlace interno apunta a un fichero existente', () => {
      for (const ruta of extraerRutas(html).filter((r) => !esExterno(r))) {
        const { existe, fichero, fragmento } = resolverEnlace(ruta, pagina);
        assert.ok(existe, `${pagina}: el enlace "${ruta}" apunta a un fichero que no existe`);
        if (fragmento && fichero.endsWith('.html')) {
          assert.ok(
            contieneId(readFileSync(fichero, 'utf8'), fragmento),
            `${pagina}: el enlace "${ruta}" apunta a un id "#${fragmento}" que no existe`
          );
        }
      }
    });

    test('los enlaces externos se abren en pestaña nueva con rel noopener', () => {
      const externos = extraerAtributos(html, 'a').filter((a) => /^https?:/i.test(a.href ?? ''));
      for (const enlace of externos) {
        assert.equal(
          enlace.target,
          '_blank',
          `${pagina}: el enlace externo "${enlace.href}" necesita target="_blank"`
        );
        assert.match(
          enlace.rel ?? '',
          /\bnoopener\b/,
          `${pagina}: el enlace externo "${enlace.href}" necesita rel="noopener noreferrer"`
        );
      }
    });
  });
}

describe('index.html: contenido', () => {
  const html = leerSitio('index.html');

  test('el <title> es el del perfil', () => {
    const [titulo] = extraerElementos(html, 'title');
    assert.ok(titulo, 'index.html: falta el elemento <title>');
    assert.equal(
      titulo.contenido.trim(),
      PERFIL.titulo,
      `index.html: el <title> debe ser "${PERFIL.titulo}"`
    );
  });

  for (const id of PERFIL.secciones) {
    test(`existe la sección #${id} con su h2`, () => {
      const seccion = extraerSeccion(html, id);
      assert.ok(seccion !== null, `index.html: falta <section id="${id}">`);
      assert.match(seccion, /<h2\b/, `index.html: la sección #${id} necesita un <h2>`);
    });
  }

  test(`#habilidades tiene al menos ${PERFIL.minimoHabilidades} habilidades`, () => {
    const seccion = extraerSeccion(html, 'habilidades') ?? '';
    const listas = extraerElementos(seccion, 'ul');
    assert.ok(listas.length > 0, 'index.html: #habilidades necesita una lista <ul>');
    const elementos = listas.flatMap((ul) => extraerElementos(ul.contenido, 'li'));
    assert.ok(
      elementos.length >= PERFIL.minimoHabilidades,
      `index.html: #habilidades tiene ${elementos.length} <li> y necesita al menos ${PERFIL.minimoHabilidades}`
    );
  });

  test('#contacto incluye el correo y el perfil de GitHub', () => {
    const seccion = extraerSeccion(html, 'contacto') ?? '';
    const enlaces = extraerAtributos(seccion, 'a').map((a) => a.href ?? '');
    assert.ok(
      enlaces.includes(`mailto:${PERFIL.email}`),
      `index.html: #contacto necesita un enlace mailto:${PERFIL.email}`
    );
    assert.ok(
      enlaces.includes(`https://github.com/${PERFIL.usuarioGithub}`),
      `index.html: #contacto necesita un enlace a https://github.com/${PERFIL.usuarioGithub}`
    );
  });
});

describe('proyectos.html: contenido', () => {
  const html = leerSitio('proyectos.html');
  const proyectos = extraerElementos(html, 'article').filter((a) => tieneClase(a.atributos, 'proyecto'));

  test(`hay al menos ${PERFIL.minimoProyectos} proyectos`, () => {
    assert.ok(
      proyectos.length >= PERFIL.minimoProyectos,
      `proyectos.html: hay ${proyectos.length} <article class="proyecto"> y se necesitan al menos ${PERFIL.minimoProyectos}`
    );
  });

  test('cada proyecto tiene título, descripción y tecnologías', () => {
    proyectos.forEach(({ contenido }, indice) => {
      const n = indice + 1;
      assert.match(contenido, /<h[23]\b/, `proyectos.html: el proyecto ${n} necesita un <h2> o <h3>`);
      assert.match(contenido, /<p\b/, `proyectos.html: el proyecto ${n} necesita un <p> de descripción`);
      assert.ok(
        extraerAtributos(contenido, 'ul').some((ul) => tieneClase(ul, 'tecnologias')),
        `proyectos.html: el proyecto ${n} necesita un <ul class="tecnologias">`
      );
    });
  });
});

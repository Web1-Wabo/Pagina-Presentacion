import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERFIL } from './perfil.mjs';
import { leerSitio } from './utilidades.mjs';

const css = leerSitio('css/estilos.css').replace(/\/\*[\s\S]*?\*\//g, '');

// Bloques :root (incluido el del modo oscuro) y resto de la hoja.
const PATRON_ROOT = /:root\s*\{[^}]*\}/g;
const bloquesRoot = (css.match(PATRON_ROOT) ?? []).join('\n');
const fueraDeRoot = css.replace(PATRON_ROOT, '');

const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const [variable, valor] of Object.entries(PERFIL.paleta)) {
  test(`:root define ${variable}: ${valor}`, () => {
    assert.match(
      bloquesRoot,
      new RegExp(`${escapar(variable)}\\s*:\\s*${escapar(valor)}\\s*;`, 'i'),
      `estilos.css: :root debe definir ${variable}: ${valor};`
    );
  });

  test(`el valor ${valor} no aparece fuera de :root`, () => {
    assert.ok(
      !fueraDeRoot.toLowerCase().includes(valor.toLowerCase()),
      `estilos.css: ${valor} aparece fuera de :root; usa var(${variable})`
    );
  });
}

test('se usa var(--color-primario)', () => {
  assert.match(
    fueraDeRoot,
    /var\(\s*--color-primario\s*\)/,
    'estilos.css: falta usar var(--color-primario) fuera de :root (por ejemplo, en los botones)'
  );
});

test('aparece la fuente de títulos', () => {
  assert.ok(css.includes(PERFIL.fuenteTitulos), `estilos.css: falta la fuente de títulos "${PERFIL.fuenteTitulos}"`);
});

test('aparece la fuente de texto', () => {
  assert.ok(css.includes(PERFIL.fuenteTexto), `estilos.css: falta la fuente de texto "${PERFIL.fuenteTexto}"`);
});

test(`existe un @media con el punto de ruptura ${PERFIL.puntoRuptura}`, () => {
  assert.match(
    css,
    new RegExp(`@media[^{]*max-width\\s*:\\s*${escapar(PERFIL.puntoRuptura)}`),
    `estilos.css: falta @media (max-width: ${PERFIL.puntoRuptura})`
  );
});

test('el modo oscuro coincide con el perfil', () => {
  const tieneModoOscuro = /prefers-color-scheme\s*:\s*dark/.test(css);
  assert.equal(
    tieneModoOscuro,
    PERFIL.modoOscuro,
    PERFIL.modoOscuro
      ? 'estilos.css: falta @media (prefers-color-scheme: dark)'
      : 'estilos.css: sobra @media (prefers-color-scheme: dark); el perfil no usa modo oscuro'
  );
});

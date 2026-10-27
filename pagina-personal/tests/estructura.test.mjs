import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existeEnRaiz, leerRaiz } from './utilidades.mjs';

const FICHEROS = [
  'site/index.html',
  'site/proyectos.html',
  'site/css/estilos.css',
  'site/js/main.js',
  'site/img/avatar.svg',
  '.github/workflows/pages.yml'
];

for (const fichero of FICHEROS) {
  test(`existe ${fichero}`, () => {
    assert.ok(existeEnRaiz(fichero), `Falta el fichero ${fichero}`);
  });
}

test('.gitignore excluye node_modules', () => {
  assert.ok(existeEnRaiz('.gitignore'), 'Falta el fichero .gitignore en la raíz del proyecto');
  assert.match(
    leerRaiz('.gitignore'),
    /^node_modules\/?\s*$/m,
    '.gitignore debe contener una línea con node_modules/'
  );
});

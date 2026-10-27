// Funciones auxiliares para los tests: lectura de ficheros y análisis
// sencillo del HTML con expresiones regulares (sin dependencias).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = fileURLToPath(new URL('..', import.meta.url));
export const SITIO = join(RAIZ, 'site');

/** Ruta absoluta de un fichero dentro de site/. */
export function rutaSitio(relativa) {
  return join(SITIO, relativa);
}

/** Indica si existe un fichero relativo a la raíz del proyecto. */
export function existeEnRaiz(relativa) {
  return existsSync(join(RAIZ, relativa));
}

/** Lee un fichero relativo a la raíz del proyecto. */
export function leerRaiz(relativa) {
  return readFileSync(join(RAIZ, relativa), 'utf8');
}

/** Lee un fichero de site/ como texto. */
export function leerSitio(relativa) {
  return readFileSync(rutaSitio(relativa), 'utf8');
}

/** Convierte la cadena de atributos de una etiqueta en un objeto. */
export function analizarAtributos(cadena) {
  const atributos = {};
  const patron = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const [, nombre, dobles, simples, sinComillas] of cadena.matchAll(patron)) {
    atributos[nombre.toLowerCase()] = dobles ?? simples ?? sinComillas ?? '';
  }
  return atributos;
}

/** Devuelve un objeto de atributos por cada aparición de <etiqueta ...>. */
export function extraerAtributos(html, etiqueta) {
  const patron = new RegExp(`<${etiqueta}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(patron)].map(([, cadena]) => analizarAtributos(cadena));
}

/** Devuelve los elementos <etiqueta> con sus atributos y su contenido interior. */
export function extraerElementos(html, etiqueta) {
  const patron = new RegExp(`<${etiqueta}\\b([^>]*)>([\\s\\S]*?)</${etiqueta}>`, 'gi');
  return [...html.matchAll(patron)].map(([, cadena, contenido]) => ({
    atributos: analizarAtributos(cadena),
    contenido
  }));
}

/** Contenido interior del elemento <section> con el id indicado, o null. */
export function extraerSeccion(html, id) {
  const seccion = extraerElementos(html, 'section').find((s) => s.atributos.id === id);
  return seccion ? seccion.contenido : null;
}

/** Indica si los atributos incluyen una clase concreta. */
export function tieneClase(atributos, clase) {
  return (atributos.class ?? '').split(/\s+/).includes(clase);
}

/** Elimina las etiquetas y deja solo el texto. */
export function textoPlano(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Todos los valores de href y src de un documento. */
export function extraerRutas(html) {
  return [...html.matchAll(/\s(?:href|src)\s*=\s*"([^"]*)"/gi)].map(([, valor]) => valor);
}

/** Indica si un enlace es externo o un protocolo que no apunta a un fichero. */
export function esExterno(enlace) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(enlace);
}

/**
 * Comprueba si un enlace relativo apunta a un fichero existente de site/.
 * Devuelve { existe, fichero, fragmento }. Un enlace solo con "#id" se
 * resuelve contra la propia página.
 */
export function resolverEnlace(enlace, paginaOrigen) {
  const [sinFragmento, fragmento = ''] = enlace.split('#');
  const ruta = sinFragmento.split('?')[0];
  const fichero = ruta === ''
    ? rutaSitio(paginaOrigen)
    : normalize(join(dirname(rutaSitio(paginaOrigen)), decodeURI(ruta)));
  return { existe: existsSync(fichero), fichero, fragmento };
}

/** Indica si un documento contiene un elemento con el id indicado. */
export function contieneId(html, id) {
  return new RegExp(`\\sid\\s*=\\s*"${id}"`).test(html);
}

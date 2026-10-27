# Página personal · Alvaro Sanchez Segura

Página personal estática (HTML, CSS y JavaScript sin frameworks) con mi perfil, formación, habilidades y proyectos, validada y desplegada con GitHub Actions.

**URL publicada:** https://Web1-wabo.github.io/pagina-personal/

## Cómo ejecutar

Requisitos: Node.js 22 o superior.

```bash
# 1. Instalar las dependencias de desarrollo (html-validate)
npm install

# 2. Servir la carpeta site/ en http://localhost:8080
npm start

# 3. Validar el HTML y ejecutar los tests
npm test
```

## Despliegue

Cada `push` a `main` ejecuta `.github/workflows/pages.yml`: primero los tests y, si pasan, publica `site/` en GitHub Pages. En los pull requests solo se ejecutan los tests.

Para activarlo la primera vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**. El repositorio debe llamarse `pagina-personal`, porque todas las rutas internas son relativas a esa carpeta publicada.

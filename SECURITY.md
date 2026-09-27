# Seguridad — Vapelog

### Propósito de este documento

- **Objetivos:** Definir el canal privado de avisos de seguridad y el
  alcance del programa (sin issues públicos explotables).
- **Estructura:** Cómo reportar → alcance.
- **Contenido a integrar según contexto:** Adapta el contacto del mantenedor.
  Rotación operativa: [docs/runbooks/rotate-secrets.md](docs/runbooks/rotate-secrets.md).

## Reportar vulnerabilidades

Envía un informe privado a **@Alexendros** vía canal privado de GitHub
(Security advisory o mensaje directo). No abras issues públicos con detalles
explotables.

Incluye: descripción, impacto, pasos de reproducción y versión/commit si es
posible.

Responderemos en un plazo razonable y coordinaremos el disclosure.

## Alcance

Aplicación web Vapelog (catálogo estático + SSR TanStack Start). No hay
autenticación de usuarios ni almacenamiento de secretos de producción en el
repo. Infraestructura de terceros (Vercel, GitHub) debe reportarse también a
sus programas respectivos cuando el fallo sea suyo.

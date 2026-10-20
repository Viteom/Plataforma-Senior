# Sistema de diseño — Plataforma Senior (MASTER)

> **Lógica:** al construir una pantalla, revisa primero `design-system/plataforma-senior/pages/[pantalla].md`.
> Si existe, sus reglas **reemplazan** las de este archivo. Si no, aplica este archivo.
>
> Generado con ui-ux-pro-max (estilo *Accessible & Ethical*, patrón *Marketplace / Directory*) y
> ajustado al brief (`docs/brief.md`). Donde la skill y el brief chocan, manda el brief.

---

## Principios

1. **Legible antes que bonito.** Letra base de 18 px, contraste AA como mínimo (buscamos AAA en texto).
2. **Una acción principal por pantalla.** Un solo botón primario visible; lo demás es secundario o enlace.
3. **Nada solo con color.** Todo estado lleva texto o ícono además del color (ej. "Confirmada ✓" con ícono SVG, nunca un punto verde solo).
4. **Siempre hay una salida humana.** Botón "Ayuda" fijo en todas las pantallas.
5. **Marca en tokens.** Hasta que llegue el brandbook: escala de grises y Atkinson Hyperlegible. Ningún componente usa un color literal; todo pasa por variables.

---

## Tokens de color (provisionales, escala de grises)

Contrastes calculados sobre `--color-bg` (#FFFFFF).

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | Fondo de página | — |
| `--color-surface` | `#F4F4F4` | Tarjetas, bloques agrupados | — |
| `--color-surface-strong` | `#E6E6E6` | Seleccionado, chip activo | — |
| `--color-text` | `#141414` | Texto principal | 18,4:1 |
| `--color-text-muted` | `#4D4D4D` | Texto secundario, ayudas | 8,4:1 |
| `--color-border` | `#767676` | Bordes de campos y tarjetas interactivas | 4,5:1 (≥3:1 exigido) |
| `--color-border-subtle` | `#D4D4D4` | Divisores decorativos (nunca único indicador) | — |
| `--color-primary` | `#141414` | Botón primario (fondo) | — |
| `--color-on-primary` | `#FFFFFF` | Texto sobre primario | 18,4:1 |
| `--color-focus` | `#0B57D0` | Anillo de foco (único color no gris: el foco debe verse siempre) | 6,4:1 |
| `--color-danger` | `#B3261E` | Errores (siempre con ícono + texto) | 6,5:1 |
| `--color-success` | `#1E6B34` | Éxito (siempre con ícono + texto) | 6,6:1 |

Modo oscuro: fuera del MVP. Los tokens se definen en `:root` para que el brandbook solo cambie valores.

## Tipografía

- **Familia única:** Atkinson Hyperlegible (400 y 700) vía `next/font/google`.
- **Escala (rem sobre 18 px base):**

| Token | Tamaño | Alto de línea | Uso |
|---|---|---|---|
| `--text-sm` | 16 px | 1.5 | Solo metadatos; nunca texto de lectura |
| `--text-base` | 18 px | 1.6 | Cuerpo |
| `--text-lg` | 20 px | 1.5 | Texto destacado, etiquetas de campo |
| `--text-xl` | 24 px | 1.35 | Título de tarjeta / sección |
| `--text-2xl` | 28 px | 1.25 | Título de pantalla (celular) |
| `--text-3xl` | 36 px | 1.2 | Título de pantalla (escritorio) |

- Ancho de lectura máximo: 65 caracteres (`max-w-prose`).
- Funciona con zoom al 200 %: tamaños en `rem`, nada de alturas fijas en contenedores de texto.

## Espaciado, radios y elevación

- Escala de 4 px: 4, 8, 12, 16, 24, 32, 48, 64.
- Separación mínima entre objetivos táctiles: 8 px (preferido 12 px).
- Radios: `--radius-sm` 8 px (campos, chips), `--radius-md` 12 px (botones, tarjetas), `--radius-lg` 16 px (hojas, modales).
- Sombra solo en elementos flotantes (hoja inferior, modal). Las tarjetas se separan con borde, no con sombra.

## Componentes

### Botones
- **Primario:** alto mínimo 56 px, ancho completo en celular, `--color-primary` / `--color-on-primary`, texto 20 px negrita. Uno por pantalla.
- **Secundario:** 56 px, fondo blanco, borde 2 px `--color-text`.
- **Terciario / enlace:** mínimo 44 px de área táctil, subrayado siempre visible.
- Cargando: botón deshabilitado + texto "Enviando…" (no solo un spinner).
- Hover: cambio de fondo (sin `transform` que mueva el layout), 150–200 ms.

### Campos
- Etiqueta visible siempre encima (nunca solo placeholder), 20 px.
- Alto mínimo 56 px, borde 2 px `--color-border`, texto 18 px.
- Error: texto debajo con ícono, en `--color-danger`, y `aria-describedby` enlazado.
- Código de 6 números: un solo campo `inputmode="numeric"` `autocomplete="one-time-code"` (no 6 cajas separadas).

### Foco
- `outline: 3px solid var(--color-focus); outline-offset: 3px;` en todo elemento interactivo con `:focus-visible`.
- Enlace "Saltar al contenido" al inicio de cada página.

### Chips de etiqueta (huella)
- Alto 44 px, borde 2 px. Estado "sin confirmar": borde discontinuo + texto "Por confirmar". "Confirmada": borde sólido + ícono check + texto.

### Botón de ayuda
- En el encabezado de todas las pantallas, a la derecha, con ícono y texto "Ayuda" visibles (mínimo 44 px de alto).
- No se usa botón flotante: con zoom al 200 % tapa contenido y choca con la barra inferior.
- Equipo: en la barra lateral (escritorio) o en el encabezado (celular). En /ayuda se reemplaza por "Volver".

### Navegación
- **Talento (celular):** barra inferior de 4 destinos máximo (Inicio, Oportunidades, Mi perfil, Aprende) con ícono + texto.
- **Empresa (escritorio):** barra superior con 4 destinos (Explorar, Buscar por un problema, Experiencias, Procesos).
- **Equipo / gestor:** barra lateral en escritorio; gestor usa la navegación de celular.

### Íconos
- Lucide (SVG), 24 px, trazo 2. Nunca emojis como íconos. Botones solo-ícono llevan `aria-label`.

## Movimiento
- 150–250 ms, solo `opacity` y `transform`. Todo se desactiva con `prefers-reduced-motion: reduce`.
- Sin carruseles automáticos ni límites de tiempo ocultos.

## Lenguaje
- Español sencillo de Colombia, frases cortas, verbos de acción en botones ("Enviar código", "Me interesa").
- Prohibido en la interfaz: "adulto mayor", "tercera edad", "abuelos", "vacante". Se usa "talento con trayectoria".

---

## Antipatrones (no usar)

- Texto menor a 16 px; cuerpo menor a 18 px.
- Placeholder como única etiqueta.
- Estados comunicados solo con color.
- Degradados morado/rosa "de IA", glassmorphism, fondos con baja legibilidad.
- Íconos sin texto en navegación principal.
- Más de un botón primario por pantalla.
- Hover que desplaza el layout (`scale`, `translateY`).
- Emojis como íconos.

## Lista de verificación antes de entregar

- [ ] Cuerpo ≥ 18 px, contraste ≥ 4,5:1 (texto) y ≥ 3:1 (bordes de controles)
- [ ] Acciones principales de 56 px; todo lo demás ≥ 44 px
- [ ] Una acción principal por pantalla
- [ ] Botón "Ayuda" presente
- [ ] Foco visible y orden de tabulación = orden visual
- [ ] Nada solo con color
- [ ] `prefers-reduced-motion` respetado
- [ ] Probado a 360 px, 768 px, 1280 px y con zoom 200 %
- [ ] Sin palabras prohibidas en los textos

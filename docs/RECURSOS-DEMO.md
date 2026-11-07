# Catálogo numerado · imágenes Gemini entregadas para VALETEAMO

Se recibieron **19 ilustraciones JPEG**. Se preservan las originales en un ZIP local de entrega; las miniaturas están en un catálogo independiente. Ninguna debe tratarse automáticamente como un modelo 3D, una hoja de animación o una textura repetible. El texto visible de la portada dice **VALETEAMO** (no «Validamos»).

**Integración real actual:** esta rama utiliza las hojas de personajes ya presentes en `public/sprites/` como alternativa temporal. **Los 19 JPEG nuevos aún no están cargados en GitHub**; el acceso del repositorio disponible para esta edición no permite trasladar los bytes de los adjuntos. El componente `Splash.tsx` intenta `./demo-assets/005-portada-valeteamo.jpeg` y muestra una portada temporal si falta. No afirmar que las ilustraciones están integradas hasta subirlas.

| ID | Archivo original | Dimensiones | Categoría | Contenido / uso previsto | Estado |
|---|---|---|---|---|---|
| 001 | `Gemini_Generated_Image_9nyjkv9nyjkv9nyj.jpeg` | 2048×1143 | Personaje | Kitty en diagonal / movimiento | Recorte y fotogramas; pendiente de cargar |
| 002 | `Gemini_Generated_Image_jey4y1jey4y1jey4.jpeg` | 2048×1143 | Personaje | Kitty frontal | Recorte y adaptación; pendiente de cargar |
| 003 | `Gemini_Generated_Image_yl01jsyl01jsyl01.jpeg` | 2048×1143 | Personaje | Kitty frontal, variante | Comparar variantes; pendiente de cargar |
| 004 | `Gemini_Generated_Image_xbwvvvxbwvvvxbwv.jpeg` | 2048×1143 | Personaje | Kitty espalda | Recorte; pendiente de cargar |
| 005 | `Gemini_Generated_Image_n3kra9n3kra9n3kr.jpeg` | 2048×868 | Portada | VALETEAMO, picnic con río, gatos, árboles, nubes | Copiar a public/demo-assets/005-portada-valeteamo.jpeg; pendiente de cargar |
| 006 | `Gemini_Generated_Image_kxqhoxkxqhoxkxqh.jpeg` | 2048×1143 | Personaje | Criatura azul | Recorte 2D; pendiente de cargar |
| 007 | `Gemini_Generated_Image_7zv06e7zv06e7zv0.jpeg` | 2048×1143 | Escenario | Habitación isométrica | Referencia 3D, no textura; pendiente de cargar |
| 008 | `Gemini_Generated_Image_8qrg5j8qrg5j8qrg.jpeg` | 2048×1143 | Objeto | Frasco rosa | Recorte 2D; pendiente de cargar |
| 009 | `Gemini_Generated_Image_glmugoglmugoglmu.jpeg` | 2048×1143 | Personaje | Fantasma amistoso | Recorte 2D; pendiente de cargar |
| 010 | `Gemini_Generated_Image_lkihjalkihjalkih.jpeg` | 2048×1143 | Escenario | Jardín con pérgola | Referencia 3D; pendiente de cargar |
| 011 | `Gemini_Generated_Image_sq97bqsq97bqsq97.jpeg` | 2048×1143 | Objeto | Moneda corazón | Recorte 2D; pendiente de cargar |
| 012 | `Gemini_Generated_Image_ipbarjipbarjipba.jpeg` | 2048×1143 | Vegetación | Árbol en maceta | Referencia 3D; pendiente de cargar |
| 013 | `Gemini_Generated_Image_vvlv8qvvlv8qvvlv.jpeg` | 2048×1143 | Objeto | Corazón pixelado | Recorte 2D; pendiente de cargar |
| 014 | `Gemini_Generated_Image_xwdw21xwdw21xwdw.jpeg` | 2048×1143 | Escenario | Jardín isométrico con banco | Referencia 3D, no textura; pendiente de cargar |
| 015 | `Gemini_Generated_Image_ctbmnctbmnctbmnc.jpeg` | 2048×1143 | Personaje | Gota rosa | Recorte 2D; pendiente de cargar |
| 016 | `Gemini_Generated_Image_kar9t7kar9t7kar9.jpeg` | 2048×1143 | Objeto | Farol | Recorte 2D; pendiente de cargar |
| 017 | `Gemini_Generated_Image_sir6r9sir6r9sir6.jpeg` | 2048×1143 | Personaje | Kitty con farol | Referencia de vestuario; pendiente de cargar |
| 018 | `Gemini_Generated_Image_d16bikd16bikd16b.jpeg` | 2048×1143 | Personaje | Kitty con paraguas | Referencia de animación; pendiente de cargar |
| 019 | `Gemini_Generated_Image_1vek2p1vek2p1vek.jpeg` | 2048×1143 | Personaje | Kitty con capa | Referencia de vestuario; pendiente de cargar |

## Integración segura

1. Descarga el archivo de recursos originales adjunto con el informe de esta demo; cada copia conserva nombre y número.
2. Copia el recurso `005-n3kra9n3kra9n3kr.jpeg` (sin modificar el original) a `public/demo-assets/005-portada-valeteamo.jpeg` en **esta rama**.
3. Optimiza una copia para móviles; comprueba que el título, los dos personajes y el mensaje no se corten. No uses una imagen de escena completa como textura repetible.
4. Para personajes/objetos con fondo blanco, realiza un recorte y transparencia manual antes de usarlos como sprites. Aún no se han integrado; permanecen marcados como referencias.
5. Mantén los originales en `assets/originales/` si decides agregarlos al repositorio. No se han sobrescrito ni renombrado los archivos fuente en este trabajo.

## Inventario y duplicados

Hay variantes de Kitty (001–004, 017–019), dos jardines isométricos (010 y 014) y objetos distintos. No se ha detectado un duplicado exacto por nombre; la semejanza temática **no** significa que sean duplicados binarios. Las imágenes de escenas 007, 010 y 014 son referencias de composición, no modelos 3D ni texturas de suelo listas para repetir.

## Recursos pendientes

- JPEG originales subidos a GitHub y portada 005 funcional en `public/demo-assets/`.
- Fotogramas con fondo transparente, atlas de texturas, materiales de madera y hojas realmente repetibles.
- Capturas de navegador de la demo terminada en esta rama e inspección en Safari real.

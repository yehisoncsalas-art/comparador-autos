# Comparador de Autos — Maquilink (versión de prueba)

Sitio estático para Cloudflare Pages, con una Pages Function que recibe los leads.

URL de prueba prevista: https://yehisoncerpa.pages.dev

## Qué falta configurar (imprescindible para que lleguen los leads)

El formulario llama a `/api/lead`. Esa función reenvía los datos a la variable de entorno **`LEAD_WEBHOOK_URL`**.

Mientras esa variable no esté definida, el visitante **no** verá un "Gracias" falso: verá un mensaje honesto con el botón **Llámame al 931 892 164**.

### 1. Crear el Google Apps Script (tú lo haces en tu cuenta de Google)

1. Crea una hoja de Google Sheets, por ejemplo `Leads Comparador Maquilink`, con esta primera fila:
   `fecha | nombre | celular | auto_interes | cuota_estimada | consentimiento`
2. En esa hoja: **Extensiones → Apps Script**.
3. Borra el código de ejemplo y pega este:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'json' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.appendRow([
    data.enviado_en || new Date().toISOString(),
    data.nombre || '',
    data.celular || '',
    data.auto_interes || '',
    data.cuota_estimada || '',
    data.consentimiento || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Implementar → Nueva implementación → Tipo: aplicación web**.
   - Descripción: `leads-comparador`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (solo para que Cloudflare pueda hacer el POST; no publiques el enlace)
5. Autoriza el acceso y **copia la URL** de la aplicación web (termina en `/exec`).

### 2. Pegar esa URL en Cloudflare Pages

En el proyecto `comparador-autos-maquilink`:

1. **Settings → Environment variables** (Variables de entorno).
2. Agrega `LEAD_WEBHOOK_URL` con la URL del Apps Script.
3. Aplícala al entorno Production (y Preview, si quieres probar).
4. Vuelve a publicar el sitio (un redeploy corto) para que la función tome la variable.

Después de eso, un envío de prueba del formulario debería aparecer como una fila nueva en tu hoja.

## Qué no se incluye en el despliegue

- `server.js` (era solo un servidor local).
- Los archivos originales de tu computadora no se tocan: esta es una copia.

## Repositorio

El sitio es estático. Está desplegado en el proyecto de Cloudflare Pages "yehisoncerpa" (https://yehisoncerpa.pages.dev) y, por ahora, se sube a mano.

/**
 * Recibe el POST del formulario de leads y lo reenvía a LEAD_WEBHOOK_URL
 * (un Google Apps Script que escribe en Google Sheets).
 * Si la variable no está configurada o el webhook falla, responde con error
 * para que el front muestre un mensaje honesto (nunca un "Gracias" falso).
 */
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost({ request, env }) {
  const webhook = (env && env.LEAD_WEBHOOK_URL) ? String(env.LEAD_WEBHOOK_URL).trim() : '';
  if (!webhook) {
    return json(503, { ok: false, error: 'not_configured' });
  }

  let payload = {};
  const contentType = request.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch (_) {
    return json(400, { ok: false, error: 'invalid_body' });
  }

  // Honeypot: si viene lleno, fingimos éxito y no reenviamos.
  if (payload['bot-field']) {
    return json(200, { ok: true, ignored: true });
  }

  const nombre = String(payload.nombre || '').trim().slice(0, 120);
  const celular = String(payload.celular || '').trim().slice(0, 40);
  const consentimiento = String(payload.consentimiento || '').trim();
  if (!nombre || !celular || !consentimiento) {
    return json(400, { ok: false, error: 'invalid' });
  }

  const body = {
    nombre,
    celular,
    auto_interes: String(payload.auto_interes || '').trim().slice(0, 200),
    cuota_estimada: String(payload.cuota_estimada || '').trim().slice(0, 80),
    consentimiento,
    enviado_en: new Date().toISOString(),
  };

  let res;
  try {
    res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return json(502, { ok: false, error: 'webhook_unreachable' });
  }

  if (!res.ok) {
    return json(502, { ok: false, error: 'webhook_failed' });
  }

  return json(200, { ok: true });
}

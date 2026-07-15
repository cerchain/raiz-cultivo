import { createClient } from '@supabase/supabase-js';

// Acepta una invitación: crea la cuenta de Auth YA CONFIRMADA y la vincula al
// usuario que el admin dejó pre-cargado. No depende del mail de confirmación.
// Esto reemplaza el signUp() del front, que se rompía con la confirmación de
// email activada (no devolvía sesión y dejaba la cuenta huérfana).

export default async function handler(req, res) {
  try {
    const URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (req.method === 'GET') {
      return res.status(200).json({
        diagnostico: 'endpoint vivo',
        SUPABASE_URL_presente: !!URL,
        SUPABASE_SERVICE_ROLE_KEY_presente: !!KEY
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    if (!URL || !KEY) return res.status(500).json({ error: 'Faltan variables de entorno en Vercel (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });

    const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { usuarioId, password } = body;
    if (!usuarioId || !password) return res.status(400).json({ error: 'Faltan datos (usuarioId / password)' });
    if (String(password).length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    // 1) El usuario tiene que existir, estar activo y NO tener cuenta todavía
    const { data: u, error: uErr } = await admin
      .from('usuarios')
      .select('id, email, nombre, activo, auth_id')
      .eq('id', usuarioId)
      .single();

    if (uErr || !u)          return res.status(404).json({ error: 'La invitación no existe o fue revocada' });
    if (u.activo === false)  return res.status(403).json({ error: 'Esta invitación está desactivada. Pedí una nueva al administrador.' });
    if (u.auth_id)           return res.status(409).json({ error: 'Esta invitación ya fue usada. Iniciá sesión con tu email y contraseña.' });
    if (!u.email)            return res.status(400).json({ error: 'La invitación no tiene email cargado' });

    const emailLimpio = String(u.email).trim().toLowerCase();

    // 2) ¿Ya existe una cuenta de Auth con ese email? (por reintentos previos)
    let authUserId = null;
    const { data: lista } = await admin.auth.admin.listUsers();
    const existente = lista?.users?.find(x => (x.email || '').toLowerCase() === emailLimpio);

    if (existente) {
      // Reusar esa cuenta: setear la contraseña nueva y confirmarla
      authUserId = existente.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(authUserId, {
        password, email_confirm: true
      });
      if (updErr) return res.status(400).json({ error: 'Auth: ' + updErr.message });
    } else {
      // Crear la cuenta YA CONFIRMADA (sin mail de por medio)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: emailLimpio, password, email_confirm: true
      });
      if (createErr) return res.status(400).json({ error: 'Auth: ' + createErr.message });
      authUserId = created.user.id;
    }

    // 3) Vincular la cuenta de Auth al usuario de la tabla
    const { error: linkErr } = await admin
      .from('usuarios')
      .update({ auth_id: authUserId })
      .eq('id', usuarioId);
    if (linkErr) return res.status(500).json({ error: 'Cuenta creada, pero falló la vinculación: ' + linkErr.message });

    return res.status(200).json({ ok: true, email: emailLimpio });

  } catch (e) {
    return res.status(500).json({ error: 'Excepción: ' + (e?.message || String(e)) });
  }
}

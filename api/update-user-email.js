import { createClient } from '@supabase/supabase-js';

// Usa la service_role key: SOLO existe del lado del servidor, nunca en el front.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // ── 1) Validar la sesión de quien llama ──
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  // ── 2) El que llama tiene que ser administrador de entidad y estar activo ──
  const { data: caller, error: callerErr } = await supabaseAdmin
    .from('usuarios')
    .select('id, rol, entidad_id, activo')
    .eq('auth_id', authData.user.id)
    .single();

  if (callerErr || !caller || caller.activo === false) {
    return res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
  }
  if (caller.rol !== 'administrador' || !caller.entidad_id) {
    return res.status(403).json({ error: 'No tenés permiso para cambiar emails' });
  }

  // ── 3) Validar el destino ──
  const { userId, nombre, email } = req.body || {};
  if (!userId || !email) return res.status(400).json({ error: 'Faltan datos (userId / email)' });

  const emailLimpio = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLimpio)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido' });
  }

  const { data: target, error: targetErr } = await supabaseAdmin
    .from('usuarios')
    .select('id, entidad_id, auth_id')
    .eq('id', userId)
    .single();

  if (targetErr || !target) return res.status(404).json({ error: 'Usuario destino no encontrado' });

  // El admin solo puede tocar usuarios de SU misma entidad
  if (target.entidad_id !== caller.entidad_id) {
    return res.status(403).json({ error: 'Ese usuario no pertenece a tu entidad' });
  }

  // ── 4) Cambiar el email en Auth (login) si el usuario tiene cuenta ──
  if (target.auth_id) {
    const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(
      target.auth_id,
      { email: emailLimpio, email_confirm: true } // confirmado al instante, sin mail de verificación
    );
    if (authUpdErr) {
      // Caso típico: el email ya está usado por otra cuenta
      return res.status(400).json({ error: 'Auth: ' + authUpdErr.message });
    }
  }

  // ── 5) Actualizar la ficha en la tabla usuarios (nombre + email) ──
  const updData = { email: emailLimpio };
  if (typeof nombre === 'string' && nombre.trim()) updData.nombre = nombre.trim();

  const { error: rowErr } = await supabaseAdmin
    .from('usuarios')
    .update(updData)
    .eq('id', userId);

  if (rowErr) return res.status(500).json({ error: 'Email de acceso cambiado, pero falló la ficha: ' + rowErr.message });

  return res.json({ ok: true, auth_actualizado: !!target.auth_id });
}

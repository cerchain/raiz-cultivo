import { createClient } from '@supabase/supabase-js';

// NOTA: el cliente se crea DENTRO del handler a propósito.
// Si se crea afuera y falta una env var, createClient() explota al cargar el
// módulo y Vercel devuelve FUNCTION_INVOCATION_FAILED sin ningún detalle.
// Creándolo adentro, podemos devolver un error JSON que explique qué falta.

export default async function handler(req, res) {
  try {
    const URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // ── MODO DIAGNÓSTICO ──
    // Abrí https://raiz-cultivo-tlsk.vercel.app/api/update-user-email en el navegador.
    // Te dice si las variables de entorno llegan a ESTA función. No expone valores.
    if (req.method === 'GET') {
      return res.status(200).json({
        diagnostico: 'endpoint vivo',
        SUPABASE_URL_presente: !!URL,
        SUPABASE_SERVICE_ROLE_KEY_presente: !!KEY,
        key_largo: KEY ? KEY.length : 0
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    if (!URL || !KEY) {
      return res.status(500).json({
        error: 'Faltan variables de entorno en Vercel: ' +
               (!URL ? 'SUPABASE_URL ' : '') + (!KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : '') +
               '. Settings -> Environment Variables -> agregarlas y volver a deployar.'
      });
    }

    const supabaseAdmin = createClient(URL, KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // ── 1) Validar la sesion de quien llama ──
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No autenticado (falta token)' });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Sesion invalida o expirada' });
    }

    // ── 2) Quien llama tiene que ser administrador de entidad y estar activo ──
    const { data: caller, error: callerErr } = await supabaseAdmin
      .from('usuarios')
      .select('id, rol, entidad_id, activo')
      .eq('auth_id', authData.user.id)
      .single();

    if (callerErr) return res.status(500).json({ error: 'No se pudo leer tu usuario: ' + callerErr.message });
    if (!caller || caller.activo === false) return res.status(403).json({ error: 'Usuario no encontrado o inactivo' });
    if (caller.rol !== 'administrador' || !caller.entidad_id) {
      return res.status(403).json({ error: 'No tenes permiso para cambiar emails (rol: ' + caller.rol + ')' });
    }

    // ── 3) Validar el destino ──
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId, nombre, email } = body;
    if (!userId || !email) return res.status(400).json({ error: 'Faltan datos (userId / email)' });

    const emailLimpio = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLimpio)) {
      return res.status(400).json({ error: 'El email no tiene un formato valido' });
    }

    const { data: target, error: targetErr } = await supabaseAdmin
      .from('usuarios')
      .select('id, entidad_id, auth_id')
      .eq('id', userId)
      .single();

    if (targetErr) return res.status(500).json({ error: 'No se pudo leer el usuario destino: ' + targetErr.message });
    if (!target) return res.status(404).json({ error: 'Usuario destino no encontrado' });
    if (target.entidad_id !== caller.entidad_id) {
      return res.status(403).json({ error: 'Ese usuario no pertenece a tu entidad' });
    }

    // ── 4) Cambiar el email en Auth (login) si el usuario tiene cuenta ──
    if (target.auth_id) {
      const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(
        target.auth_id,
        { email: emailLimpio, email_confirm: true } // confirmado al instante, sin mail de verificacion
      );
      if (authUpdErr) {
        return res.status(400).json({ error: 'Auth: ' + authUpdErr.message });
      }
    }

    // ── 5) Actualizar la ficha en la tabla usuarios ──
    const updData = { email: emailLimpio };
    if (typeof nombre === 'string' && nombre.trim()) updData.nombre = nombre.trim();

    const { error: rowErr } = await supabaseAdmin
      .from('usuarios')
      .update(updData)
      .eq('id', userId);

    if (rowErr) return res.status(500).json({ error: 'Email de acceso cambiado, pero fallo la ficha: ' + rowErr.message });

    return res.status(200).json({ ok: true, auth_actualizado: !!target.auth_id });

  } catch (e) {
    // Sin este catch, cualquier excepcion se convierte en FUNCTION_INVOCATION_FAILED,
    // que no dice absolutamente nada sobre que fallo.
    return res.status(500).json({ error: 'Excepcion: ' + (e?.message || String(e)) });
  }
}

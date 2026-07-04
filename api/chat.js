import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // ── Validar sesión real antes de gastar un solo token de Anthropic ──
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  const { data: usuario, error: usuarioError } = await supabaseAdmin
    .from('usuarios')
    .select('id, activo')
    .eq('auth_id', authData.user.id)
    .single();

  if (usuarioError || !usuario || usuario.activo === false) {
    return res.status(403).json({ error: 'Usuario inactivo o no encontrado' });
  }

  const { messages, contextoCultivo } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel. Andá a Settings → Environment Variables y agregala.' });
  }

  const systemPrompt = `Sos un asistente experto en cultivo de cannabis medicinal, integrado en RAÍZ — un cuaderno de cultivo.

Tu rol:
- Diagnosticar problemas visuales (deficiencias nutricionales, plagas, enfermedades fúngicas) a partir de fotos o descripciones
- Dar consejos prácticos sobre nutrición, riego, poda, fotoperíodo y cosecha
- Interpretar síntomas en hojas, tallos y cogollos
- Ayudar a planificar el ciclo de cultivo

Al analizar fotos: describí en detalle lo que observás (color, textura, manchas, deformaciones, síntomas). Dá tu diagnóstico más probable junto con acciones correctivas concretas. Si la foto no es suficiente, pedí una toma diferente o más información.

Respondé siempre en español argentino, de forma directa y práctica. Sin rodeos innecesarios.

CONTEXTO ACTUAL DEL CULTIVO DEL USUARIO:
${contextoCultivo}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Error de la API de Anthropic' });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Error conectando con el asistente: ' + e.message });
  }
}

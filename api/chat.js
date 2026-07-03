export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

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
        model: 'claude-opus-4-6',
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

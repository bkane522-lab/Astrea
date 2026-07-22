// api/horoscope.js — Oracle Astréa (Vercel serverless, CommonJS)
// Génère une lecture personnalisée via Groq. N'expose jamais qu'il s'agit d'une IA.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sign, element, focus } = req.body || {};
    if (!sign) {
      res.status(400).json({ error: 'Signe manquant' });
      return;
    }

    const system = [
      "Tu es Astréa, une voix astrologique bienveillante, poétique et incarnée.",
      "Tu parles en français, à la deuxième personne (tu), avec chaleur et justesse.",
      "Tu ne dis JAMAIS que tu es une intelligence artificielle, un modèle, un programme ou une machine.",
      "Tu ne t'excuses pas, tu ne mets pas de titres ni de listes à puces.",
      "Tu écris un seul paragraphe fluide de 4 à 6 phrases, imagé mais concret,",
      "en évitant les clichés vides. Termine par une phrase-conseil douce et actionnable."
    ].join(' ');

    const user = `Signe : ${sign} (élément ${element || ''}). ` +
      `Sujet de la guidance : ${focus || 'la journée en général'}. ` +
      `Écris la lecture d'Astréa pour cette personne, maintenant.`;

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.92,
        max_tokens: 400,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!r.ok) {
      res.status(502).json({ error: 'Le ciel est momentanément voilé.' });
      return;
    }

    const data = await r.json();
    let reading = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    reading = reading.replace(/```/g, '').trim();

    if (!reading) {
      res.status(502).json({ error: 'Le ciel est momentanément voilé.' });
      return;
    }

    res.status(200).json({ reading });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// api/verify-license.js — Vérification licence Gumroad (Vercel serverless, CommonJS)
// Débloque "Astréa Complet". Même logique que Découpe / Respiro.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { licenseKey } = req.body || {};
    if (!licenseKey || !licenseKey.trim()) {
      res.status(400).json({ valid: false, error: 'Clé manquante' });
      return;
    }

    const params = new URLSearchParams();
    // Utilise l'UN des deux selon ce que tu as configuré dans Vercel :
    if (process.env.GUMROAD_PRODUCT_ID) {
      params.append('product_id', process.env.GUMROAD_PRODUCT_ID);
    } else if (process.env.GUMROAD_PRODUCT_PERMALINK) {
      params.append('product_permalink', process.env.GUMROAD_PRODUCT_PERMALINK);
    }
    params.append('license_key', licenseKey.trim());
    // On n'incrémente pas le compteur d'usage à chaque ouverture :
    params.append('increment_uses_count', 'false');

    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await r.json();
    const p = data && data.purchase;

    const ok = data && data.success && p &&
      !p.refunded && !p.chargebacked && !p.disputed;

    if (ok) {
      res.status(200).json({ valid: true });
    } else {
      res.status(200).json({ valid: false, error: 'Clé invalide ou remboursée' });
    }
  } catch (e) {
    res.status(500).json({ valid: false, error: 'Erreur serveur' });
  }
};

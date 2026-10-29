// Verifies the Cloudflare Turnstile token and only then returns the link.
// Set TURNSTILE_SECRET_KEY in Vercel → Project → Settings → Environment Variables.
const TARGET = 'https://www.fanvue.com/mina_nakamura';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = req.body && req.body.token;
  if (!token) {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

  const form = new URLSearchParams();
  form.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
  form.append('response', token);
  const ip = req.headers['x-forwarded-for'];
  if (ip) form.append('remoteip', String(ip).split(',')[0].trim());

  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form
    });
    const data = await r.json();

    if (!data.success) {
      res.status(403).json({ error: 'Captcha failed' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ url: TARGET });
  } catch {
    res.status(502).json({ error: 'Verification unavailable' });
  }
};

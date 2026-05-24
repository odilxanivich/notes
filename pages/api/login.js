import { setAuthCookie } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.APP_PASSWORD) {
    setAuthCookie(res);
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Wrong password' });
}

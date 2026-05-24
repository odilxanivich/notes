const SESSION_COOKIE = 'notes_session';
const SESSION_VALUE = 'authenticated';

export function setAuthCookie(res) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  res.setHeader('Set-Cookie', 
    `${SESSION_COOKIE}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Strict; Expires=${expires.toUTCString()}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  );
}

export function isAuthenticated(req) {
  const cookie = req.headers.cookie || '';
  return cookie.split(';').some(c => c.trim() === `${SESSION_COOKIE}=${SESSION_VALUE}`);
}

export function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

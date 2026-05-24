import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e) => {
    e?.preventDefault();
    if (!pw) return;
    setLoading(true);
    setError('');
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (r.ok) {
      router.replace('/');
    } else {
      setError('Wrong password');
      setPw('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <Head><title>Notes — Enter</title></Head>
      <div style={styles.page}>
        <div style={{ ...styles.card, animation: shake ? 'shake 0.4s ease' : 'none' }}>
          <div style={styles.lock}>🔒</div>
          <h1 style={styles.title}>Notes</h1>
          <p style={styles.sub}>Enter your password to continue</p>
          <form onSubmit={submit} style={styles.form}>
            <input
              ref={inputRef}
              type="password"
              placeholder="Password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.btn} disabled={loading || !pw}>
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '20px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    animation: 'fadeUp 0.3s ease',
  },
  lock: { fontSize: '48px', marginBottom: '4px' },
  title: { fontSize: '28px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.4px' },
  sub: { fontSize: '13px', color: 'var(--text3)', marginBottom: '8px', textAlign: 'center' },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' },
  input: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '13px 16px',
    fontSize: '15px',
    color: 'var(--text)',
    outline: 'none',
    width: '100%',
    letterSpacing: '2px',
  },
  error: { fontSize: '13px', color: 'var(--danger)', textAlign: 'center' },
  btn: {
    background: 'var(--accent)',
    color: '#000',
    fontWeight: '700',
    fontSize: '15px',
    padding: '13px',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
    marginTop: '4px',
    opacity: 1,
    transition: 'opacity 0.15s',
    cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif',
  },
};

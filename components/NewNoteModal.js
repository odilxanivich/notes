import { useState, useEffect, useRef } from 'react';

export default function NewNoteModal({ onConfirm, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => { if (!title.trim()) return; onConfirm({ title: title.trim(), description: description.trim() }); };
  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) submit(); if (e.key === 'Escape') onCancel(); };

  return (
    <div className="mo" onClick={onCancel}>
      <div className="mb" onClick={e => e.stopPropagation()}>
        <h3 className="mt">New Note</h3>
        <p className="mh">Give your note a title and optional description.</p>
        <div className="fg">
          <label className="fl">Title <span style={{color:'var(--accent2)'}}>*</span></label>
          <input ref={ref} className="mi" placeholder="e.g. Ideas, Meeting notes…" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={onKey} maxLength={100} />
        </div>
        <div className="fg">
          <label className="fl">Description <span style={{color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
          <input className="mi" placeholder="Short context…" value={description} onChange={e=>setDescription(e.target.value)} onKeyDown={onKey} maxLength={200} />
        </div>
        <div className="ma">
          <button className="mc" onClick={onCancel}>Cancel</button>
          <button className="mk" onClick={submit} disabled={!title.trim()}>Create Note</button>
        </div>
      </div>
      <style>{`
        .mo{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(6px);padding:16px;animation:fadeIn .15s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .mb{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:24px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:slideUp .2s ease}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        .mt{font-size:17px;font-weight:700;color:var(--text)}
        .mh{font-size:13px;color:var(--text3);margin-top:-6px}
        .fg{display:flex;flex-direction:column;gap:5px}
        .fl{font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px}
        .mi{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:11px 13px;font-size:14px;color:var(--text);outline:none;font-family:'Poppins',sans-serif;transition:border-color .15s}
        .mi:focus{border-color:var(--accent)}
        .mi::placeholder{color:var(--text3)}
        .ma{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
        .mc{padding:9px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;color:var(--text2);background:var(--bg3);font-family:'Poppins',sans-serif}
        .mk{padding:9px 18px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;background:var(--accent);color:#000;font-family:'Poppins',sans-serif;transition:opacity .12s}
        .mk:hover:not(:disabled){opacity:.85}
        .mk:disabled{opacity:.4;cursor:default}
      `}</style>
    </div>
  );
}

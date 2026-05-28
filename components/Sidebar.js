import { useState } from 'react';

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Sidebar({ notes, selectedId, onSelect, onNew, onDelete, search, onSearch, onLogout }) {
  const pinned = notes.filter(n => n.pinned);
  const others = notes.filter(n => !n.pinned);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const renderNote = (note) => (
    <div
      key={note.id}
      className={`note-item ${note.id === selectedId ? 'active' : ''}`}
      onClick={() => onSelect(note.id)}
    >
      <div className="note-item-inner">
        <div className="note-item-title">{note.title}</div>
        <div className="note-item-meta">
          <span className="note-time">{timeAgo(note.updated_at)}</span>
          {note.description && <span className="note-desc">{note.description}</span>}
        </div>
      </div>
      <button
        className="note-delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(note.id); }}
        title="Delete"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Notes</h1>
        <div style={{ display:'flex', gap:'6px' }}>
          <button className="new-btn" onClick={onNew} title="New Note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button className="logout-btn" onClick={() => setConfirmLogout(true)} title="Lock">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="search-input"
          placeholder="Search notes…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <div className="notes-list">
        {pinned.length > 0 && <>
          <div className="list-label">Pinned</div>
          {pinned.map(renderNote)}
          <div className="list-label">Notes</div>
        </>}
        {others.map(renderNote)}
        {notes.length === 0 && (
          <div className="no-notes">No notes yet.<br />Tap + to create one.</div>
        )}
      </div>

      {confirmLogout && (
        <div className="logout-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="logout-box" onClick={e => e.stopPropagation()}>
            <p>Lock and sign out?</p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button className="modal-cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
              <button className="modal-confirm danger" onClick={onLogout}>Lock</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar {
          width: var(--sidebar-w);
          height: 100dvh;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          /* ✅ KEY FIX: push header below phone status bar */
          padding: 14px 16px 14px;
          padding-top: calc(env(safe-area-inset-top) + 14px);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          min-height: calc(env(safe-area-inset-top) + 60px);
        }
        /* ✅ Bigger title */
        .sidebar-title { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
        .new-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: #000;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
        .new-btn:hover { transform: scale(1.1); }
        .logout-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--bg3);
          color: var(--text3);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .logout-btn:hover { background: var(--bg3); color: var(--text2); }
        .search-wrap {
          position: relative;
          margin: 12px 12px 6px;
          flex-shrink: 0;
        }
        .search-icon {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--text3); pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: var(--bg3);
          border: none;
          border-radius: var(--radius-sm);
          padding: 10px 12px 10px 32px;
          font-size: 15px; /* ✅ was 13px — also prevents iOS zoom on focus */
          color: var(--text);
          outline: none;
          font-family: 'Poppins', sans-serif;
        }
        .search-input::placeholder { color: var(--text3); }
        .search-input:focus { box-shadow: 0 0 0 2px var(--accent); }
        .notes-list { flex: 1; overflow-y: auto; padding: 4px 0 20px; }
        .list-label {
          font-size: 11px; font-weight: 600; color: var(--text3);
          text-transform: uppercase; letter-spacing: 0.8px;
          padding: 12px 16px 6px;
        }
        .note-item {
          display: flex; align-items: center;
          padding: 12px 10px 12px 16px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          margin: 2px 8px;
          transition: background 0.12s;
          position: relative;
          min-height: 64px; /* ✅ was 56px — bigger tap target */
        }
        .note-item:hover { background: var(--bg3); }
        .note-item.active { background: var(--bg3); }
        .note-item.active::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .note-item-inner { flex: 1; min-width: 0; }
        .note-item-title {
          font-size: 15px; /* ✅ was 13px */
          font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .note-item-meta { display: flex; gap: 6px; margin-top: 3px; align-items: center; }
        .note-time { font-size: 12px; color: var(--text3); white-space: nowrap; flex-shrink: 0; } /* ✅ was 10px */
        .note-desc {
          font-size: 12px; color: var(--text2); /* ✅ was 11px */
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .note-delete-btn {
          opacity: 0; color: var(--danger);
          padding: 8px; border-radius: 4px;
          transition: opacity 0.15s; flex-shrink: 0;
        }
        .note-item:hover .note-delete-btn { opacity: 1; }
        @media (hover: none) {
          .note-delete-btn { opacity: 0.4; }
        }
        .no-notes {
          text-align: center; color: var(--text3);
          font-size: 15px; padding: 40px 16px; line-height: 1.6; /* ✅ was 13px */
        }
        .logout-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: flex-end;
          z-index: 20;
          backdrop-filter: blur(4px);
        }
        .logout-box {
          background: var(--surface2);
          border-top: 1px solid var(--border);
          padding: 24px 16px;
          padding-bottom: calc(env(safe-area-inset-bottom) + 24px); /* ✅ above home bar */
          width: 100%;
          display: flex; flex-direction: column; gap: 16px;
          font-size: 16px; color: var(--text2); /* ✅ was 14px */
        }
        .modal-cancel {
          padding: 10px 18px; border-radius: var(--radius-sm);
          font-size: 15px; font-weight: 500; color: var(--text2);
          background: var(--bg3); font-family: 'Poppins', sans-serif;
        }
        .modal-confirm {
          padding: 10px 18px; border-radius: var(--radius-sm);
          font-size: 15px; font-weight: 600;
          background: var(--accent); color: #000;
          font-family: 'Poppins', sans-serif;
        }
        .modal-confirm.danger { background: var(--danger); color: #fff; }

        /* ✅ Mobile — already full width, just bump sizes */
        @media (max-width: 640px) {
          .sidebar { width: 100vw; }
          .sidebar-title { font-size: 30px; }
          .note-item { min-height: 68px; padding: 14px 10px 14px 16px; }
          .note-item-title { font-size: 16px; }
          .note-time, .note-desc { font-size: 13px; }
          .search-input { font-size: 16px; padding: 12px 12px 12px 34px; }
        }
        @media (max-width: 900px) and (min-width: 641px) {
          .note-item-title { font-size: 14px; }
        }
      `}</style>
    </aside>
  );
}
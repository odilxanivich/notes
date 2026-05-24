import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import NewNoteModal from '../components/NewNoteModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Home() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true); // mobile toggle
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    const r = await fetch('/api/notes');
    if (r.status === 401) { router.replace('/login'); return; }
    const data = await r.json();
    setNotes(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // On mobile, selecting a note hides sidebar
  const handleSelect = (id) => {
    setSelectedId(id);
    if (window.innerWidth <= 640) setSidebarOpen(false);
  };

  const handleCreate = async ({ title, description }) => {
    const r = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (r.status === 401) { router.replace('/login'); return; }
    const data = await r.json();
    await fetchNotes();
    setSelectedId(data.id);
    setShowNew(false);
    if (window.innerWidth <= 640) setSidebarOpen(false);
  };

  const handleUpdate = async (id, fields) => {
    const r = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (r.status === 401) { router.replace('/login'); return; }
    await fetchNotes();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    await fetchNotes();
    setDeleteTarget(null);
    if (window.innerWidth <= 640) setSidebarOpen(true);
  };

  const handleLogout = async () => {
    await fetch('/api/logout');
    router.replace('/login');
  };

  const filtered = notes.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNote = notes.find(n => n.id === selectedId) || null;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text3)', fontSize:'14px' }}>
      Loading…
    </div>
  );

  return (
    <>
      <Head><title>Notes</title></Head>
      <div className="app-layout">
        {/* Sidebar */}
        <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
          <Sidebar
            notes={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNew={() => setShowNew(true)}
            onDelete={setDeleteTarget}
            search={search}
            onSearch={setSearch}
            onLogout={handleLogout}
          />
        </div>

        {/* Main */}
        <main className={`main-area ${!sidebarOpen ? 'full' : ''}`}>
          {/* Mobile back button */}
          {!sidebarOpen && (
            <button className="back-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Notes
            </button>
          )}

          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onUpdate={handleUpdate}
              onDelete={() => setDeleteTarget(selectedNote.id)}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>Select a note or create a new one</p>
              <button className="btn-primary" onClick={() => setShowNew(true)}>New Note</button>
            </div>
          )}
        </main>

        {showNew && <NewNoteModal onConfirm={handleCreate} onCancel={() => setShowNew(false)} />}
        {deleteTarget && (
          <ConfirmModal
            message="Delete this note? This cannot be undone."
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>

      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }
        .sidebar-wrapper {
          width: var(--sidebar-w);
          min-width: var(--sidebar-w);
          flex-shrink: 0;
          height: 100vh;
          transition: transform 0.25s ease, width 0.25s ease;
        }
        .main-area {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          background: var(--bg);
          position: relative;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 600;
          color: var(--accent);
          background: none;
          border-bottom: 1px solid var(--border);
          width: 100%;
          text-align: left;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: var(--text3);
          padding: 20px;
          text-align: center;
        }
        .empty-icon { font-size: 56px; filter: grayscale(1); opacity: 0.4; }
        .empty-state p { font-size: 14px; font-weight: 500; }
        .btn-primary {
          background: var(--accent);
          color: #000;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 24px;
          border-radius: var(--radius-sm);
          transition: opacity 0.15s;
          font-family: 'Poppins', sans-serif;
        }
        .btn-primary:hover { opacity: 0.85; }

        /* Mobile: sidebar takes full width, slides in/out */
        @media (max-width: 640px) {
          .app-layout { position: relative; }
          .sidebar-wrapper {
            position: absolute;
            top: 0; left: 0;
            width: 100vw;
            min-width: 100vw;
            z-index: 10;
            transform: translateX(0);
          }
          .sidebar-wrapper.closed {
            transform: translateX(-100vw);
            pointer-events: none;
          }
          .main-area {
            width: 100vw;
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
          }
          .main-area:not(.full) {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
    </>
  );
}

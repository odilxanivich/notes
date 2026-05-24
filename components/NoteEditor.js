import { useState, useEffect, useRef, useCallback } from 'react';

function LinkModal({ onConfirm, onCancel }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  return (
    <div className="lm-overlay" onClick={onCancel}>
      <div className="lm-box" onClick={e => e.stopPropagation()}>
        <h3 className="lm-title">Insert Link</h3>
        <input className="lm-input" placeholder="Display text" value={text} onChange={e => setText(e.target.value)} />
        <input className="lm-input" placeholder="URL (https://…)" value={url} onChange={e => setUrl(e.target.value)} />
        <div className="lm-actions">
          <button className="lm-cancel" onClick={onCancel}>Cancel</button>
          <button className="lm-confirm" onClick={() => onConfirm(text, url)}>Insert</button>
        </div>
      </div>
      <style>{`
        .lm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px);padding:16px;}
        .lm-box{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:24px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);}
        .lm-title{font-size:16px;font-weight:700;color:var(--text);}
        .lm-input{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:14px;color:var(--text);outline:none;font-family:'Poppins',sans-serif;}
        .lm-input:focus{border-color:var(--accent);}
        .lm-actions{display:flex;gap:8px;justify-content:flex-end;}
        .lm-cancel{padding:8px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;color:var(--text2);background:var(--bg3);font-family:'Poppins',sans-serif;}
        .lm-confirm{padding:8px 18px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;background:var(--accent);color:#000;font-family:'Poppins',sans-serif;}
      `}</style>
    </div>
  );
}

export default function NoteEditor({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [showLink, setShowLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setTitle(note.title);
    setEditing(false);
    isFirstRender.current = true;
  }, [note.id]);

  useEffect(() => {
    if (editorRef.current && isFirstRender.current) {
      editorRef.current.innerHTML = note.content || '';
      isFirstRender.current = false;
    }
  });

  // Strip all formatting on paste — plain text only
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handlePaste = (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    };
    editor.addEventListener('paste', handlePaste);
    return () => editor.removeEventListener('paste', handlePaste);
  }, [editing]);

  const autoSave = useCallback((html) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await onUpdate(note.id, { title, content: html });
      setSaving(false);
    }, 900);
  }, [note.id, title, onUpdate]);

  const handleInput = () => {
    autoSave(editorRef.current.innerHTML);
  };

  const handleTitleBlur = (e) => {
    const val = e.target.value.trim() || 'Untitled';
    setTitle(val);
    if (val !== note.title) onUpdate(note.id, { title: val });
  };

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const insertLink = (text, url) => {
    if (!url) return;
    const full = url.startsWith('http') ? url : 'https://' + url;
    exec('insertHTML', `<a href="${full}" target="_blank" rel="noopener noreferrer">${text || full}</a>`);
    setShowLink(false);
  };

  const insertTable = () => {
    const r = 3, c = 3;
    let h = '<table><thead><tr>' + Array(c).fill('<th contenteditable="true"><br></th>').join('') + '</tr></thead><tbody>';
    for (let i = 0; i < r; i++) h += '<tr>' + Array(c).fill('<td contenteditable="true"><br></td>').join('') + '</tr>';
    h += '</tbody></table><p><br></p>';
    exec('insertHTML', h);
  };

  const addTableRow = () => {
    let node = window.getSelection()?.anchorNode;
    while (node && node.nodeName !== 'TABLE') node = node.parentNode;
    if (!node) return;
    const cols = node.rows[0]?.cells.length || 3;
    const tr = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true'; td.innerHTML = '<br>';
      tr.appendChild(td);
    }
    (node.querySelector('tbody') || node).appendChild(tr);
    handleInput();
  };

  const addTableCol = () => {
    let node = window.getSelection()?.anchorNode;
    while (node && node.nodeName !== 'TABLE') node = node.parentNode;
    if (!node) return;
    Array.from(node.rows).forEach((row, i) => {
      const cell = i === 0 ? document.createElement('th') : document.createElement('td');
      cell.contentEditable = 'true'; cell.innerHTML = '<br>';
      row.appendChild(cell);
    });
    handleInput();
  };

  const uploadImage = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const r = await fetch(`/api/notes/${note.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type, data: base64 }),
      });
      if (r.ok) {
        const data = await r.json();
        exec('insertHTML', `<img src="${data.url}" alt="${data.original_name}" class="note-img" />`);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleEdit = () => {
    const next = !editing;
    setEditing(next);
    if (next) setTimeout(() => editorRef.current?.focus(), 50);
  };

  const togglePin = () => onUpdate(note.id, { pinned: note.pinned ? false : true });

  const fmtDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="ne-wrap">
      {/* Header */}
      <div className="ne-header">
        <span className="ne-date">{fmtDate}{saving && <span className="ne-saving"> · Saving…</span>}</span>
        <div className="ne-actions">
          <button className={`ne-btn ${note.pinned ? 'active' : ''}`} onClick={togglePin} title="Pin">
            <svg width="15" height="15" viewBox="0 0 24 24" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </button>
          <button className={`ne-btn edit-btn ${editing ? 'editing' : ''}`} onClick={toggleEdit} title={editing ? 'Done' : 'Edit'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="ne-btn danger" onClick={onDelete} title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="ne-title-area">
        {editing ? (
          <input className="ne-title editing" value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleBlur} />
        ) : (
          <h2 className="ne-title readonly">{title}</h2>
        )}
        {note.description && <p className="ne-desc">{note.description}</p>}
      </div>

      {/* Toolbar */}
      {editing && (
        <div className="ne-toolbar">
          <div className="tb-row">
            <button className="tb" onClick={() => exec('bold')} title="Bold"><b>B</b></button>
            <button className="tb" onClick={() => exec('italic')} title="Italic"><i>I</i></button>
            <button className="tb" onClick={() => exec('underline')} title="Underline"><u>U</u></button>
            <button className="tb" onClick={() => exec('strikeThrough')}><s>S</s></button>
            <div className="tb-div" />
            <button className="tb" onClick={() => exec('formatBlock','h2')}>H2</button>
            <button className="tb" onClick={() => exec('formatBlock','h3')}>H3</button>
            <button className="tb" onClick={() => exec('formatBlock','p')}>¶</button>
            <div className="tb-div" />
            <button className="tb" onClick={() => exec('insertUnorderedList')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            </button>
            <button className="tb" onClick={() => exec('insertOrderedList')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
            </button>
            <div className="tb-div" />
            <button className="tb" onClick={() => setShowLink(true)} title="Link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button className="tb" onClick={() => fileInputRef.current.click()} title="Image">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if(e.target.files[0]) uploadImage(e.target.files[0]); e.target.value=''; }} />
            <div className="tb-div" />
            <button className="tb" onClick={insertTable} title="Table">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button className="tb small-text" onClick={addTableRow}>+Row</button>
            <button className="tb small-text" onClick={addTableCol}>+Col</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={editorRef}
        className={`ne-content ${editing ? 'editable' : 'readonly'}`}
        contentEditable={editing}
        onInput={handleInput}
        suppressContentEditableWarning
      />

      {showLink && <LinkModal onConfirm={insertLink} onCancel={() => setShowLink(false)} />}

      <style>{`
        .ne-wrap { display:flex; flex-direction:column; height:100vh; background:var(--bg); overflow:hidden; }
        .ne-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 20px; border-bottom:1px solid var(--border); flex-shrink:0;
        }
        .ne-date { font-size:11px; color:var(--text3); }
        .ne-saving { color:var(--accent); }
        .ne-actions { display:flex; gap:2px; }
        .ne-btn {
          width:32px; height:32px; border-radius:var(--radius-sm);
          color:var(--text2); display:flex; align-items:center; justify-content:center;
          transition:background 0.12s, color 0.12s;
        }
        .ne-btn:hover { background:var(--bg3); color:var(--text); }
        .ne-btn.active { color:var(--accent); }
        .ne-btn.editing { color:var(--accent); background:rgba(255,214,10,0.1); }
        .ne-btn.danger:hover { color:var(--danger); background:rgba(255,69,58,0.1); }

        .ne-title-area { padding:16px 20px 0; flex-shrink:0; }
        .ne-title { font-size:26px; font-weight:700; letter-spacing:-0.3px; line-height:1.2; }
        .ne-title.readonly { color:var(--text); display:block; margin-bottom:4px; }
        .ne-title.editing {
          color:var(--text); background:transparent; border:none; outline:none;
          width:100%; border-bottom:1.5px solid var(--accent); padding-bottom:3px; margin-bottom:4px;
          font-family:'Poppins',sans-serif;
        }
        .ne-desc { font-size:12px; color:var(--text2); margin-bottom:4px; }

        .ne-toolbar {
          padding:6px 14px; border-bottom:1px solid var(--border);
          background:var(--surface); flex-shrink:0; overflow-x:auto;
        }
        .tb-row { display:flex; align-items:center; gap:2px; min-width:max-content; }
        .tb {
          padding:5px 7px; border-radius:6px; font-size:13px; font-weight:500;
          color:var(--text2); display:flex; align-items:center; justify-content:center;
          min-width:28px; height:28px; transition:background 0.1s, color 0.1s; flex-shrink:0;
        }
        .tb:hover { background:var(--bg3); color:var(--text); }
        .tb.small-text { font-size:11px; }
        .tb-div { width:1px; height:18px; background:var(--border); margin:0 3px; flex-shrink:0; }

        .ne-content {
          flex:1; overflow-y:auto; padding:16px 20px 40px;
          font-size:15px; line-height:1.75; outline:none;
        }
        .ne-content.readonly { color:var(--text2); user-select:none; }
        .ne-content.editable { color:var(--text); cursor:text; }

        .ne-content h2 { font-size:20px; font-weight:700; color:var(--text); margin:18px 0 8px; }
        .ne-content h3 { font-size:17px; font-weight:700; color:var(--text); margin:14px 0 6px; }
        .ne-content p { margin-bottom:8px; }
        .ne-content ul, .ne-content ol { padding-left:20px; margin-bottom:8px; }
        .ne-content li { margin-bottom:3px; }
        .ne-content a { color:var(--link); text-decoration:underline; text-underline-offset:2px; }
        .ne-content table { border-collapse:collapse; width:100%; margin:14px 0; }
        .ne-content th { background:var(--bg3); color:var(--text); font-weight:600; font-size:13px; text-align:left; padding:9px 11px; border:1px solid var(--border); }
        .ne-content td { padding:8px 11px; border:1px solid var(--border); color:var(--text2); font-size:13px; vertical-align:top; }
        .ne-content tr:nth-child(even) td { background:rgba(255,255,255,0.02); }
        .ne-content img.note-img { max-width:100%; border-radius:var(--radius); margin:10px 0; display:block; border:1px solid var(--border); }

        /* Force Poppins on all pasted content */
        .ne-content * {
          font-family: 'Poppins', sans-serif !important;
          font-size: inherit !important;
          color: inherit !important;
          background: none !important;
          line-height: inherit !important;
        }
        /* But allow our own elements to keep their styles */
        .ne-content h2, .ne-content h3 { font-size: revert !important; color: var(--text) !important; }
        .ne-content a { color: var(--link) !important; }
        .ne-content th { color: var(--text) !important; background: var(--bg3) !important; }
        .ne-content td { color: var(--text2) !important; }

        @media (max-width:640px) {
          .ne-header { padding:10px 14px; }
          .ne-title-area { padding:12px 14px 0; }
          .ne-title { font-size:22px; }
          .ne-content { padding:14px 14px 60px; font-size:15px; }
          .ne-toolbar { padding:6px 10px; }
        }
        @media (max-width:900px) and (min-width:641px) {
          .ne-header { padding:10px 18px; }
          .ne-title-area { padding:14px 18px 0; }
          .ne-content { padding:14px 18px 40px; }
        }
      `}</style>
    </div>
  );
}
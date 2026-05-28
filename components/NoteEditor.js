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

// Right-click context menu for table cells
function TableMenu({ x, y, onAddRow, onDelRow, onAddCol, onDelCol, onClose }) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [onClose]);

  return (
    <div className="tmenu" style={{ top: y, left: x }} onClick={e => e.stopPropagation()}>
      <button className="tmenu-item" onClick={onAddRow}>＋ Add row below</button>
      <button className="tmenu-item danger" onClick={onDelRow}>－ Delete this row</button>
      <div className="tmenu-divider" />
      <button className="tmenu-item" onClick={onAddCol}>＋ Add column right</button>
      <button className="tmenu-item danger" onClick={onDelCol}>－ Delete this column</button>
      <style>{`
        .tmenu{position:fixed;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px;z-index:300;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.5);}
        .tmenu-item{display:block;width:100%;text-align:left;padding:8px 12px;font-size:13px;font-family:'Poppins',sans-serif;color:var(--text2);border-radius:6px;transition:background 0.1s,color 0.1s;}
        .tmenu-item:hover{background:var(--bg3);color:var(--text);}
        .tmenu-item.danger:hover{color:var(--danger);}
        .tmenu-divider{height:1px;background:var(--border);margin:4px 0;}
      `}</style>
    </div>
  );
}

export default function NoteEditor({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [showLink, setShowLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableMenu, setTableMenu] = useState(null); // {x, y, cell}
  const [wrapHeight, setWrapHeight] = useState(null); // ✅ NEW
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimer = useRef(null);
  const isFirstRender = useRef(true);

  // ✅ NEW: visualViewport listener so keyboard doesn't hide header
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setWrapHeight(vv.height);
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

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

  // Strip formatting on paste
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

  // Right-click on table cell
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !editing) return;
    const handleContextMenu = (e) => {
      let node = e.target;
      while (node && node !== editor) {
        if (node.nodeName === 'TD' || node.nodeName === 'TH') {
          e.preventDefault();
          setTableMenu({ x: e.clientX, y: e.clientY, cell: node });
          return;
        }
        node = node.parentNode;
      }
    };
    editor.addEventListener('contextmenu', handleContextMenu);
    return () => editor.removeEventListener('contextmenu', handleContextMenu);
  }, [editing]);

  const autoSave = useCallback((html) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await onUpdate(note.id, { title, content: html });
      setSaving(false);
    }, 900);
  }, [note.id, title, onUpdate]);

  const handleInput = () => autoSave(editorRef.current.innerHTML);

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

  // Default: 2 columns, 3 rows
  const insertTable = () => {
    const r = 3, c = 2;
    let h = '<table><thead><tr>' + Array(c).fill('<th contenteditable="true"><br></th>').join('') + '</tr></thead><tbody>';
    for (let i = 0; i < r; i++) h += '<tr>' + Array(c).fill('<td contenteditable="true"><br></td>').join('') + '</tr>';
    h += '</tbody></table><p><br></p>';
    exec('insertHTML', h);
  };

  // --- Toolbar table buttons (cursor must be inside table) ---
  const getTable = () => {
    let node = window.getSelection()?.anchorNode;
    while (node && node.nodeName !== 'TABLE') node = node.parentNode;
    return node || null;
  };

  const getCell = () => {
    let node = window.getSelection()?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') node = node.parentNode;
    return node || null;
  };

  const addTableRow = () => {
    const table = getTable();
    if (!table) return;
    const cols = table.rows[0]?.cells.length || 2;
    const tr = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true'; td.innerHTML = '<br>';
      tr.appendChild(td);
    }
    (table.querySelector('tbody') || table).appendChild(tr);
    handleInput();
  };

  const deleteTableRow = (cellNode) => {
    const cell = cellNode || getCell();
    if (!cell) return;
    const row = cell.closest('tr');
    if (!row) return;
    const table = row.closest('table');
    if (table && table.rows.length <= 1) return;
    row.remove();
    handleInput();
    setTableMenu(null);
  };

  const addTableCol = (cellNode) => {
    const table = cellNode ? cellNode.closest('table') : getTable();
    if (!table) return;
    let colIdx = 0;
    if (cellNode) {
      const row = cellNode.closest('tr');
      colIdx = Array.from(row.cells).indexOf(cellNode);
    }
    Array.from(table.rows).forEach((row, i) => {
      const cell = i === 0 ? document.createElement('th') : document.createElement('td');
      cell.contentEditable = 'true'; cell.innerHTML = '<br>';
      const ref = row.cells[colIdx + 1] || null;
      row.insertBefore(cell, ref);
    });
    handleInput();
    setTableMenu(null);
  };

  const deleteTableCol = (cellNode) => {
    const cell = cellNode || getCell();
    if (!cell) return;
    const table = cell.closest('table');
    if (!table) return;
    if (table.rows[0]?.cells.length <= 1) return;
    const row = cell.closest('tr');
    const colIdx = Array.from(row.cells).indexOf(cell);
    Array.from(table.rows).forEach(r => {
      if (r.cells[colIdx]) r.cells[colIdx].remove();
    });
    handleInput();
    setTableMenu(null);
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
    // ✅ CHANGED: height driven by visualViewport, falls back to 100dvh
    <div className="ne-wrap" style={{ height: wrapHeight ? `${wrapHeight}px` : '100dvh' }}>
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
            <button className="tb" onClick={() => exec('bold')}><b>B</b></button>
            <button className="tb" onClick={() => exec('italic')}><i>I</i></button>
            <button className="tb" onClick={() => exec('underline')}><u>U</u></button>
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
            <button className="tb" onClick={() => setShowLink(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
            <button className="tb" onClick={() => fileInputRef.current.click()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if(e.target.files[0]) uploadImage(e.target.files[0]); e.target.value=''; }} />
            <div className="tb-div" />
            <button className="tb" onClick={insertTable} title="Insert table (2 cols)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button className="tb small-text add" onClick={addTableRow} title="Add row (click inside table first)">+Row</button>
            <button className="tb small-text del" onClick={() => deleteTableRow(null)} title="Delete row (click inside row first)">−Row</button>
            <button className="tb small-text add" onClick={() => addTableCol(null)} title="Add column (click inside table first)">+Col</button>
            <button className="tb small-text del" onClick={() => deleteTableCol(null)} title="Delete column (click inside col first)">−Col</button>
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

      {tableMenu && editing && (
        <TableMenu
          x={tableMenu.x}
          y={tableMenu.y}
          onAddRow={() => { addTableRow(); setTableMenu(null); }}
          onDelRow={() => deleteTableRow(tableMenu.cell)}
          onAddCol={() => addTableCol(tableMenu.cell)}
          onDelCol={() => deleteTableCol(tableMenu.cell)}
          onClose={() => setTableMenu(null)}
        />
      )}

      <style>{`
        /* ✅ CHANGED: height:100vh → height set via inline style (visualViewport), overflow:hidden kept */
        .ne-wrap { display:flex; flex-direction:column; background:var(--bg); overflow:hidden; }
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
        .tb.add:hover { color: #30d158; }
        .tb.del:hover { color: var(--danger); }
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

        .ne-content table { border-collapse:collapse; width:100%; margin:14px 0; border-radius:var(--radius-sm); overflow:hidden; }
        .ne-content th { background:var(--bg3); color:var(--text); font-weight:600; font-size:13px; text-align:left; padding:10px 12px; border:1px solid var(--border); }
        .ne-content td { padding:9px 12px; border:1px solid var(--border); color:var(--text2); font-size:13px; vertical-align:top; min-width:80px; }
        .ne-content td:focus, .ne-content th:focus { outline:2px solid var(--accent); outline-offset:-2px; background:rgba(255,214,10,0.04); }
        .ne-content tr:nth-child(even) td { background:rgba(255,255,255,0.02); }
        .ne-content img.note-img { max-width:100%; border-radius:var(--radius); margin:10px 0; display:block; border:1px solid var(--border); }

        /* Force Poppins on all pasted content */
        .ne-content * { font-family:'Poppins',sans-serif !important; font-size:inherit !important; color:inherit !important; background:none !important; line-height:inherit !important; }
        .ne-content h2, .ne-content h3 { font-size:revert !important; color:var(--text) !important; }
        .ne-content a { color:var(--link) !important; }
        .ne-content th { color:var(--text) !important; background:var(--bg3) !important; }
        .ne-content td { color:var(--text2) !important; }
        .ne-content td:focus, .ne-content th:focus { background:rgba(255,214,10,0.04) !important; }

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
export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="co" onClick={onCancel}>
      <div className="cb" onClick={e => e.stopPropagation()}>
        <h3 className="ct">Are you sure?</h3>
        <p className="cm">{message}</p>
        <div className="ca">
          <button className="cc" onClick={onCancel}>Cancel</button>
          <button className="cd" onClick={onConfirm}>Delete</button>
        </div>
      </div>
      <style>{`
        .co{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(6px);padding:16px}
        .cb{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:24px;width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 80px rgba(0,0,0,0.6)}
        .ct{font-size:17px;font-weight:700;color:var(--text)}
        .cm{font-size:14px;color:var(--text2);line-height:1.5}
        .ca{display:flex;gap:8px;justify-content:flex-end}
        .cc{padding:9px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;color:var(--text2);background:var(--bg3);font-family:'Poppins',sans-serif}
        .cd{padding:9px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;background:var(--danger);color:#fff;font-family:'Poppins',sans-serif}
      `}</style>
    </div>
  );
}

import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await db.from('notes').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Not found' });
    const { data: images } = await db.from('images').select('*').eq('note_id', id);
    return res.json({ ...data, images: images || [] });
  }

  if (req.method === 'PUT') {
    const { title, description, content, pinned } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (pinned !== undefined) updates.pinned = pinned;
    const { data, error } = await db.from('notes').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    // Delete images from storage
    const { data: images } = await db.from('images').select('*').eq('note_id', id);
    if (images?.length) {
      const paths = images.map(i => i.storage_path);
      await db.storage.from('note-images').remove(paths);
      await db.from('images').delete().eq('note_id', id);
    }
    const { error } = await db.from('notes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  res.status(405).end();
}

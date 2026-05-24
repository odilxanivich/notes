import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).end();
  const db = supabaseAdmin();
  const { imgId } = req.query;
  const { data: img } = await db.from('images').select('*').eq('id', imgId).single();
  if (!img) return res.status(404).json({ error: 'Not found' });
  await db.storage.from('note-images').remove([img.storage_path]);
  await db.from('images').delete().eq('id', imgId);
  return res.json({ success: true });
}

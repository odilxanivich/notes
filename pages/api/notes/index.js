import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('notes')
      .select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { title, description, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const { data, error } = await db.from('notes').insert({
      id: uuidv4(),
      title,
      description: description || '',
      content: content || '',
      pinned: false,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  res.status(405).end();
}

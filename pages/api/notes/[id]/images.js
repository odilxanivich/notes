import { supabaseAdmin } from '../../../../lib/supabase';
import { requireAuth } from '../../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const db = supabaseAdmin();
  const { id } = req.query;

  // Expect base64 body: { name, type, data }
  const { name, type, data } = req.body;
  if (!data) return res.status(400).json({ error: 'No file data' });

  const ext = name.split('.').pop();
  const filename = `${uuidv4()}.${ext}`;
  const storagePath = `notes/${id}/${filename}`;
  const buffer = Buffer.from(data, 'base64');

  const { error: uploadError } = await db.storage
    .from('note-images')
    .upload(storagePath, buffer, { contentType: type, upsert: false });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = db.storage.from('note-images').getPublicUrl(storagePath);

  const imgRecord = {
    id: uuidv4(),
    note_id: id,
    storage_path: storagePath,
    original_name: name,
    public_url: urlData.publicUrl,
  };

  const { error: dbError } = await db.from('images').insert(imgRecord);
  if (dbError) return res.status(500).json({ error: dbError.message });

  return res.json({ id: imgRecord.id, url: urlData.publicUrl, original_name: name });
}

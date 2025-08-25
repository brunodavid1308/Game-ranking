import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const connStr = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if(!connStr){
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL no está configurada' }) };
  }
  const sql = neon(connStr);
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, delta, reset, delete: del } = body;

    await sql(`CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    );`);

    if (reset) {
      await sql(`UPDATE players SET points = 0;`);
    } else if (del && name) {
      await sql(`DELETE FROM players WHERE name = ${name};`);
    } else if (name != null && typeof delta === 'number') {
      await sql(`INSERT INTO players (name, points) VALUES (${name}, 0)
                 ON CONFLICT (name) DO NOTHING;`);
      if (delta !== 0) {
        await sql(`UPDATE players SET points = points + ${delta} WHERE name = ${name};`);
      }
    }

    const rows = await sql(`SELECT name, points FROM players ORDER BY points ASC;`);
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}

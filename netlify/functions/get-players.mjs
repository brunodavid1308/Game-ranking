import { neon } from '@neondatabase/serverless';

export async function handler() {
  const connStr = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if(!connStr){
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL no está configurada' }) };
  }
  const sql = neon(connStr);
  try {
    await sql(`CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      points INTEGER NOT NULL DEFAULT 0
    );`);

    const rows = await sql(`SELECT name, points FROM players ORDER BY points ASC;`);

    if (rows.length === 0) {
      await sql(`INSERT INTO players (name, points) VALUES ('Diego',0),('Paloma',0),('Bruno',0)
                 ON CONFLICT (name) DO NOTHING;`);
      const seeded = await sql(`SELECT name, points FROM players ORDER BY points ASC;`);
      return { statusCode: 200, body: JSON.stringify(seeded) };
    }

    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postReports, getReports } from '../src/services/serverless';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method === 'POST') {
    const r = await postReports({ body: req.body });
    res.status(r.statusCode).send(r.body);
    return;
  }
  if (req.method === 'GET') {
    const r = await getReports({});
    res.status(r.statusCode).send(r.body);
    return;
  }
  res.status(405).end();
}

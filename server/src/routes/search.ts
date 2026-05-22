import { Router, Request, Response } from 'express';
import { searchCards } from '../tcgplayer';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const game = req.query.game as string | undefined;

  if (!query || query.trim().length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  try {
    const results = await searchCards(query.trim(), game);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;

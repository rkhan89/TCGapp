import { Router, Request, Response } from 'express';
import { getCardPrices } from '../tcgplayer';

const router = Router();

router.get('/:productId', async (req: Request, res: Response) => {
  const productId = parseInt(String(req.params.productId), 10);
  const setId = req.query.setId ? parseInt(req.query.setId as string, 10) : undefined;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;

  if (isNaN(productId)) {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  try {
    const data = await getCardPrices(productId, setId, categoryId);
    if (!data) {
      res.status(404).json({ error: 'Card not found or price unavailable' });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

export default router;

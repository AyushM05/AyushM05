import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nutriscan-server' });
});

// OCR endpoint (stub)
app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body ?? {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }
    // TODO: Integrate Google Vision API or Tesseract here
    // For now, return stubbed text
    const text = 'Ingredients: Sugar, Salt, Maltodextrin. Nutrition Facts: Calories 250, Total Fat 12g, Sodium 420mg, Sugars 24g, Protein 5g.';
    res.json({ text });
  } catch (err) {
    console.error('/ocr error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Analyze endpoint (simple heuristic stub)
app.post('/analyze', (req, res) => {
  try {
    const { text } = req.body ?? {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }

    const lower = text.toLowerCase();
    const flags = {
      highSugar: /sugar|high fructose corn syrup|sucrose|glucose/.test(lower),
      highSodium: /sodium\s*(\d+\s*mg)/.test(lower) || /salt/.test(lower),
      transFat: /trans fat/.test(lower),
      preservatives: /maltodextrin|sodium benzoate|potassium sorbate|bht|bha|msg/.test(lower),
      protein: /protein\s*(\d+\s*g)/.test(lower),
      fiber: /fiber\s*(\d+\s*g)/.test(lower),
    };

    const positives = [];
    const negatives = [];
    if (flags.fiber) positives.push('Fiber');
    if (flags.protein) positives.push('Protein');
    if (flags.highSugar) negatives.push('Added sugars');
    if (flags.highSodium) negatives.push('High sodium');
    if (flags.transFat) negatives.push('Trans fat');
    if (flags.preservatives) negatives.push('Artificial preservatives');

    // Simple score 1-10
    let score = 7;
    if (flags.highSugar) score -= 2;
    if (flags.highSodium) score -= 2;
    if (flags.transFat) score -= 3;
    if (flags.preservatives) score -= 1;
    if (flags.protein) score += 1;
    if (flags.fiber) score += 1;
    score = Math.max(1, Math.min(10, score));

    const summaryParts = [];
    if (flags.highSodium) summaryParts.push('High in sodium');
    if (flags.highSugar) summaryParts.push('High in added sugar');
    if (flags.transFat) summaryParts.push('Contains trans fat');
    if (flags.preservatives) summaryParts.push('Contains artificial preservatives');
    if (flags.protein) summaryParts.push('Has protein');
    if (flags.fiber) summaryParts.push('Has fiber');

    const summary = summaryParts.length
      ? summaryParts.join('. ') + '.'
      : 'No major flags detected.';

    res.json({
      score,
      positives,
      negatives,
      summary,
      flags,
    });
  } catch (err) {
    console.error('/analyze error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Alternatives endpoint (stub)
app.post('/alternatives', (req, res) => {
  try {
    const { productName } = req.body ?? {};
    const items = [
      { name: 'Kind Protein Bar', reason: 'Higher protein, lower sugar', score: 8 },
      { name: 'RXBAR', reason: 'Simple ingredients, moderate sugar', score: 7 },
      { name: 'Larabar', reason: 'Minimal ingredients, no additives', score: 7 },
    ];
    res.json({ base: productName || null, items });
  } catch (err) {
    console.error('/alternatives error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Chat endpoint (stubbed to echo guidance style)
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'message required' });

    // If OPENAI_API_KEY exists, we could call OpenAI; otherwise, reply generically
    const guidance = `Here are general considerations: choose whole foods, prioritize fiber and protein, limit added sugars and sodium. For your question: ${message}`;
    res.json({ reply: guidance });
  } catch (err) {
    console.error('/chat error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(port, () => {
  console.log(`NutriScan server listening on http://localhost:${port}`);
});

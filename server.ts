import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.post('/api/insights', async (req, res) => {
    try {
      const { tasks, timeRange } = req.body;
      
      const prompt = `
        Analyze the following tasks over the given time range (${timeRange}) for a productivity app user.
        Return 2 key insights. One should be a constructive warning or observation (like focus degradation or task bottleneck), and the other should be a positive reinforcement (like peak performance time or streak).
        
        Tasks data: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, completed: t.completed, createdAt: t.createdAt, completedAt: t.completedAt })))}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Either 'warning' or 'positive'"
                },
                title: {
                  type: Type.STRING,
                  description: "Insight title (e.g. Focus Degradation, Peak Performance)"
                },
                description: {
                  type: Type.STRING,
                  description: "Insight text (e.g. Your deep work sessions drop by 40% after 3:00 PM on Thursdays.)"
                }
              },
              required: ["type", "title", "description"]
            },
          },
        },
      });

      const text = response.text;
      let insights = [];
      if (text) {
         insights = JSON.parse(text);
      }
      res.json({ insights });
    } catch (error) {
      console.error("AI Insight Error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // Future API boundaries for heavier analytics logic...
  // Most generic CRUD will be handled natively by Firestore client for real-time capabilities.

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static serve for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

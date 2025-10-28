import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auth } from 'express-oauth2-jwt-bearer';
import alertsData from './data.json';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});

app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // skip preflight
  console.log('➡️ Authorization reçu:', req.headers.authorization);
  return (checkJwt as any)(req, res, next);
});

interface Alert {
  id: string;
  subject: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  metadata: {
    deviceId: string;
    location: string;
    [key: string]: any;
  };
}

const alerts: Alert[] = alertsData as Alert[];


app.get('/api/alerts', (req: Request, res: Response) => {
  try {
    let filtered = [...alerts];
    const { subject, month, year } = req.query;

    if (subject) {
      filtered = filtered.filter(a => a.subject === subject);
    }

    if (month && year) {
      filtered = filtered.filter(a => {
        const date = new Date(a.timestamp);
        return (
          date.getMonth() + 1 === parseInt(month as string) &&
          date.getFullYear() === parseInt(year as string)
        );
      });
    }

    res.json({ data: filtered, total: filtered.length });
  } catch (error) {
    console.error('Erreur /api/alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/alerts/:id', (req: Request, res: Response) => {
  try {
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ data: alert });
  } catch (error) {
    console.error('Erreur /api/alerts/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/alerts/stats/monthly', (req: Request, res: Response) => {
  try {
    const { subject } = req.query;
    let filtered = subject
      ? alerts.filter(a => a.subject === subject)
      : alerts;

    const monthlyStats: { [key: string]: { count: number; alerts: Alert[] } } = {};

    filtered.forEach(alert => {
      const date = new Date(alert.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { count: 0, alerts: [] };
      }

      monthlyStats[monthKey].count++;
      monthlyStats[monthKey].alerts.push(alert);
    });

    const result = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month,
        count: data.count,
        alertIds: data.alerts.map(a => a.id),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ data: result });
  } catch (error) {
    console.error('Erreur /api/alerts/stats/monthly:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/subjects', (req: Request, res: Response) => {
  try {
    const subjects = [...new Set(alerts.map(a => a.subject))].sort();
    res.json({ data: subjects });
  } catch (error) {
    console.error('Erreur /api/subjects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Erreur globale:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.status(500).json({ error: 'Internal server error' });
});


app.listen(PORT, () => {
  console.log(` Backend running on http://localhost:${PORT}`);
  console.log(` Loaded ${alerts.length} alerts`);
});

import express, { Express, Request, Response } from 'express'
import { Return } from './types/api.types'
import restaurantRoutes from './routes/restaurant.routes'
import cookieParser from 'cookie-parser';
import path from 'path'
import './crons/restaurants.cron';

const app: Express = express()

// Enable parsing of cookies
app.use(cookieParser());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Parse JSON bodies (as sent by API clients)
app.use(express.json({ limit: '10mb' }))

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }))

// Serve the main HTML file at the root path
app.get('/', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  } as Return)
})

// Register routes
app.use('/api/restaurants', restaurantRoutes)

// If nothing found above, return 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err: Error, _req: Request, res: Response): void => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' } as Return);
});

export default app


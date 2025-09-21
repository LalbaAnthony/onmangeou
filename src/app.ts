import express, { Express, Request, Response } from 'express'
import { Return } from './types/api.types'
import restaurantRoutes from './routes/restaurant.routes'
import cookieParser from 'cookie-parser';
import path from 'path'

const app: Express = express()

// Enable parsing of cookies
app.use(cookieParser());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Parse JSON bodies (as sent by API clients)
app.use(express.json({ limit: '10mb' }))

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }))

// Serve the main HTML file at the root path
app.get('/', (res: Response): void => { res.sendFile(path.join(__dirname, 'public', 'index.html')) });
app.get('/style.css', (res: Response): void => { res.sendFile(path.join(__dirname, 'public', 'style.css')) });
app.get('/script.js', (res: Response): void => { res.sendFile(path.join(__dirname, 'public', 'script.js')) });

// Health check
app.get('/health', (res: Response) => {
  res.status(200).json({
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  } as Return)
})

// Register routes
app.use('/restaurants', restaurantRoutes)

// If nothing found above, return 404
app.use((res: Response): void => {
  res.status(404).json({ error: 'Route not found' } as Return);
});

// Global error handler
app.use((err: Error, req: Request, res: Response): void => {
  console.error('Unhandled error:', err, 'Request URL:', req.originalUrl);
  res.status(500).json({ error: 'Internal server error' } as Return);
});

export default app

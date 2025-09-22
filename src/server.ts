import app from './app'
import dotenv from 'dotenv'
import path from 'path'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initData } from './datas/restaurant.data'

// Config dotenv for the repo root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Middleware to enhance security by setting various HTTP headers
app.use(helmet())

// CORS middleware to allow cross-origin requests
app.use(cors({
    origin: true,
    credentials: true
}))

// Logging middleware
app.use(morgan('combined'))

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// Démarrage du serveur
async function startServer(): Promise<void> {
    try {
        await initData();
        app.listen(process.env.PORT, (): void => {
            console.log(`Server started on http://localhost:${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

startServer().catch((error: unknown): void => {
    console.error('Fatal error:', error);
    process.exit(1);
});
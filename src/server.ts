import app from './app'
import dotenv from 'dotenv'
import path from 'path'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initData } from './datas/restaurant.data'

dotenv.config({ path: path.join(__dirname, '.env') })

const PORT: number = parseInt(process.env.PORT ?? '3000', 10)

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
        app.listen(PORT, (): void => {
            console.log(`Server started on http://localhost:${PORT}`);
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
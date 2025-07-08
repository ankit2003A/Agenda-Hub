import express from 'express';
import cors from 'cors';
import { apiLimiter, loginLimiter } from './middleware/rateLimit';
import { authenticateToken } from './middleware/auth';
import { specs } from './swagger/docs';
import swaggerUi from 'swagger-ui-express';
import { meetingsRouter } from './routes/meetings';
import { userRouter } from './routes/user';
import zoomRouter from './routes/zoom';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agenda-hub';

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', loginLimiter, userRouter);
app.use('/api/meetings', authenticateToken, meetingsRouter);
app.use('/api/zoom', zoomRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

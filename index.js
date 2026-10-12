import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import googleRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import personalRoutes from './routes/userQuests.js';
import { sendEmail } from './sendEmail.js';

dotenv.config();

const app = express();

// ✅ Middleware setup
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());

const allowedOrigins = [
  "https://idea-sphere.vercel.app",
  "https://idea-sphere-dev.vercel.app",
  "http://localhost:3000",
  "https://very-portfolio.vercel.app",
  "https://restninja.io"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(express.json()); // ✅ ensures req.body works with JSON

app.use(cors(corsOptions));

// ✅ Fix for preflight (CORS) on POST requests
app.options("*", cors(corsOptions));

app.set("trust proxy", 1);

// ✅ Routes
app.use('/google', googleRoutes);
app.use('/questions', questionRoutes);
app.use('/personal', personalRoutes);
app.post('/email', sendEmail);

// ✅ Health check
app.get('/', (req, res) => {
  res.send('Hello to Idea Sphere API');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));

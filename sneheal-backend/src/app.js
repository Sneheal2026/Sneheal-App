require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { validateEnv } = require('./utils/env');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const addressRoutes = require('./routes/address.routes');
const { authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { success } = require('./utils/response');

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
  return success(res, 'Sneheal API is running');
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/addresses', addressRoutes);

app.use((_req, res) => {
  return res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Sneheal backend running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});

module.exports = app;

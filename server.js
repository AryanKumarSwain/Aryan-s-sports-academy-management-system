import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/app.config.js';
import logger from './src/utils/logger.js';

const startServer = async () => {
  try {
    logger.info('Server boot starting', {
      env: NODE_ENV,
      port: PORT
    });

    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        env: NODE_ENV,
        port: PORT
      });
    });

    process.on('SIGINT', () => {
      logger.warn('SIGINT received, shutting down server');
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      logger.warn('SIGTERM received, shutting down server');
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Server startup failed', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();
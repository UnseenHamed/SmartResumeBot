import { bot } from './bot';
import { config } from './config';
import { startServer } from './server';

async function bootstrap() {
  if (!config.BOT_TOKEN) {
    console.error('ERROR: BOT_TOKEN is missing in .env');
    process.exit(1);
  }

  try {
    console.log('🤖 Starting bot...');
    bot.launch();
    console.log('✅ Bot is running!');

    // Start Express Admin Panel
    startServer();

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Failed to start the application:', error);
  }
}

bootstrap();

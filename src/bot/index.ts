import { Telegraf, Scenes, session } from 'telegraf';
import { config } from '../config';
import { resumeScene } from './scenes/resumeWizard';
import { MyContext } from './types';

// Initialize bot
export const bot = new Telegraf<MyContext>(config.BOT_TOKEN);

// Initialize stage with single scene
const stage = new Scenes.Stage<MyContext>([resumeScene]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Commands
bot.command('start', (ctx) => ctx.scene.enter('resumeWizard'));
bot.command('new', (ctx) => ctx.scene.enter('resumeWizard'));
bot.command('help', (ctx) => ctx.reply('برای شروع ساخت رزومه، دستور /start رو بزن.'));

// Global error handler
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

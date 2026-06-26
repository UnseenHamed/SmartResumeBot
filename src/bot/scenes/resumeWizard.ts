import { Scenes } from 'telegraf';
import { MyContext } from '../types';
import {
  ResumeState, Section, buildMessage
} from '../helpers/format';
import { generateProfessionalSummary } from '../../services/ai.service';
import { generatePdf } from '../../services/pdf.service';

// ─── Helpers ──────────────────────────────────────────────────────

function initState(): ResumeState {
  return {
    section: 'welcome',
    data: {
      education: [], experience: [], skills: [],
      projects: [], knownLanguages: []
    },
  };
}

async function updateMsg(ctx: MyContext) {
  const state: ResumeState = (ctx.session as any).rs;
  if (!state) return;
  const { text, keyboard } = buildMessage(state, ctx.from?.first_name);
  const chatId = ctx.chat!.id;
  try {
    await ctx.telegram.editMessageText(chatId, state.mainMessageId!, undefined, text, {
      parse_mode: 'HTML', reply_markup: keyboard,
    });
  } catch (e: any) {
    if (!e.message?.includes('message is not modified')) {
      try {
        const msg = await ctx.telegram.sendMessage(chatId, text, {
          parse_mode: 'HTML', reply_markup: keyboard,
        });
        state.mainMessageId = msg.message_id;
      } catch {}
    }
  }
}

// ─── Scene ────────────────────────────────────────────────────────

export const resumeScene = new Scenes.BaseScene<MyContext>('resumeWizard');

// ── Enter ──

resumeScene.enter(async (ctx) => {
  const oldState = (ctx.session as any).rs as ResumeState | undefined;
  if (oldState?.mainMessageId) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat!.id, oldState.mainMessageId);
    } catch (e) {} // ignore if already deleted
  }

  const state = initState();
  (ctx.session as any).rs = state;

  const { text, keyboard } = buildMessage(state, ctx.from?.first_name);
  const msg = await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  state.mainMessageId = msg.message_id;
});

// ── Text Handler (AI Chat) ──

import { processResumeText } from '../../services/ai.service';

resumeScene.command('start', async (ctx) => {
  await ctx.scene.reenter();
});

resumeScene.on('text', async (ctx) => {
  const input = ctx.message.text.trim();
  if (input.startsWith('/')) return; // Ignore commands

  const state: ResumeState = (ctx.session as any).rs;
  if (!state) return;

  try { await ctx.deleteMessage(); } catch {}

  if (state.section === 'ai_chat') {
    const chatId = ctx.chat!.id;
    try {
      await ctx.telegram.editMessageText(
        chatId, 
        state.mainMessageId!, 
        undefined, 
        '🧠 <i>در حال پردازش و استخراج اطلاعات... لطفاً چند لحظه صبر کنید.</i> ⏳',
        { parse_mode: 'HTML' }
      );
    } catch {}

    try {
      const response = await processResumeText(input, state.data);
      state.data = response.resumeData;
      state.aiMessage = response.aiMessage;
    } catch (e) {
      console.error(e);
      state.aiMessage = '❌ متاسفانه در پردازش متن مشکلی پیش اومد. لطفاً دوباره امتحان کن.';
    }
  }

  await updateMsg(ctx);
});

// ─── Action Handlers ──────────────────────────────────────────────

// Welcome
resumeScene.action('start_resume', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.section = 'language';
  await updateMsg(ctx);
});

// Language
resumeScene.action(/^lang_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.data.language = ctx.match![1]; // 'fa' or 'en'
  state.section = 'template';
  await updateMsg(ctx);
});

// Template
resumeScene.action(/^tpl_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.data.template = ctx.match![1];
  state.section = 'ai_chat';
  await updateMsg(ctx);
});

// Generate PDF
resumeScene.action('generate_pdf', async (ctx) => {
  await ctx.answerCbQuery('در حال ساخت PDF... ⏳');
  const state: ResumeState = (ctx.session as any).rs;

  const chatId = ctx.chat!.id;
  try {
    await ctx.telegram.editMessageText(
      chatId, 
      state.mainMessageId!, 
      undefined, 
      '📄 <i>در حال کامپایل قالب و ساخت خروجی PDF... لطفاً صبر کنید.</i> ⏳',
      { parse_mode: 'HTML' }
    );
  } catch {}

  try {
    const pdfBuffer = await generatePdf(state.data);
    const fileName = state.data.fullName ? `Resume_${state.data.fullName.replace(/\s+/g, '_')}.pdf` : 'Resume.pdf';
    
    await ctx.telegram.sendDocument(chatId, {
      source: pdfBuffer,
      filename: fileName
    }, {
      caption: '🎉 رزومه شما با موفقیت ساخته شد!\nممنون که از هوش مصنوعی ما استفاده کردید.'
    });

    await updateMsg(ctx);
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    try {
      await ctx.telegram.sendMessage(chatId, '❌ متاسفانه در تولید PDF خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      await updateMsg(ctx);
    } catch {}
  }
});

// Restart
resumeScene.action('restart', async (ctx) => {
  await ctx.answerCbQuery('شروع مجدد...');
  const oldMsgId = ((ctx.session as any).rs as ResumeState)?.mainMessageId;
  const state = initState();
  state.mainMessageId = oldMsgId;
  (ctx.session as any).rs = state;
  await updateMsg(ctx);
});

// Cancel
resumeScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery();
  const oldMsgId = ((ctx.session as any).rs as ResumeState)?.mainMessageId;
  const state = initState();
  state.mainMessageId = oldMsgId;
  (ctx.session as any).rs = state;
  await updateMsg(ctx);
});

import { Scenes } from 'telegraf';
import { MyContext } from '../types';
import {
  ResumeState, Section, PERSONAL_FIELDS, SECTION_FLOW,
  nextSection, buildMessage
} from '../helpers/format';
import { generateProfessionalSummary } from '../../services/ai.service';
import { generatePdf } from '../../services/pdf.service';

// ─── Helpers ──────────────────────────────────────────────────────

function initState(): ResumeState {
  return {
    section: 'welcome',
    subStep: '',
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

function goToSection(state: ResumeState, section: Section) {
  state.section = section;
  const initialSteps: Record<Section, string> = {
    welcome: '', language: '', template: '', personal: 'fullName',
    education: 'degree', experience: 'title', skills: 'category',
    projects: 'name', knownLanguages: 'name', review: '',
  };
  state.subStep = initialSteps[section];
  state.tempEntry = undefined;
}

// ─── Scene ────────────────────────────────────────────────────────

export const resumeScene = new Scenes.BaseScene<MyContext>('resumeWizard');

// ── Enter ──

resumeScene.enter(async (ctx) => {
  const state = initState();
  (ctx.session as any).rs = state;

  const { text, keyboard } = buildMessage(state, ctx.from?.first_name);
  const msg = await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  state.mainMessageId = msg.message_id;
});

// ── Text Handler ──

resumeScene.on('text', async (ctx) => {
  const state: ResumeState = (ctx.session as any).rs;
  if (!state) return;

  const input = ctx.message.text.trim();
  try { await ctx.deleteMessage(); } catch {}

  switch (state.section) {
    case 'personal': handlePersonal(state, input); break;
    case 'education': handleEducation(state, input); break;
    case 'experience': handleExperience(state, input); break;
    case 'skills': handleSkills(state, input); break;
    case 'projects': handleProjects(state, input); break;
    case 'knownLanguages': handleKnownLangs(state, input); break;
    default: break; // Ignore text in button-only sections
  }
  await updateMsg(ctx);
});

// ── Section Handlers ──

function handlePersonal(state: ResumeState, input: string) {
  const keys = PERSONAL_FIELDS.map(f => f.key);
  const idx = keys.indexOf(state.subStep);
  if (idx === -1) return;

  (state.data as any)[state.subStep] = input;

  if (idx < keys.length - 1) {
    state.subStep = keys[idx + 1];
  } else {
    goToSection(state, 'education');
  }
}

function handleEducation(state: ResumeState, input: string) {
  switch (state.subStep) {
    case 'degree':
      state.tempEntry = { degree: input };
      state.subStep = 'university';
      break;
    case 'university':
      state.tempEntry.university = input;
      state.subStep = 'date';
      break;
    case 'date':
      state.tempEntry.date = input;
      state.data.education.push({ ...state.tempEntry });
      state.tempEntry = undefined;
      state.subStep = 'confirm';
      break;
  }
}

function handleExperience(state: ResumeState, input: string) {
  switch (state.subStep) {
    case 'title':
      state.tempEntry = { title: input, descriptions: [] };
      state.subStep = 'company';
      break;
    case 'company':
      state.tempEntry.company = input;
      state.subStep = 'date';
      break;
    case 'date':
      state.tempEntry.date = input;
      state.subStep = 'desc';
      break;
    case 'desc':
      state.tempEntry.descriptions.push(input);
      break; // Stay on desc until user clicks "finish_desc"
  }
}

function handleSkills(state: ResumeState, input: string) {
  switch (state.subStep) {
    case 'category':
      state.tempEntry = { category: input };
      state.subStep = 'items';
      break;
    case 'items':
      const items = input.split(',').map(s => s.trim()).filter(Boolean);
      state.data.skills.push({ category: state.tempEntry.category, items });
      state.tempEntry = undefined;
      state.subStep = 'confirm';
      break;
  }
}

function handleProjects(state: ResumeState, input: string) {
  switch (state.subStep) {
    case 'name':
      state.tempEntry = { name: input, descriptions: [] };
      state.subStep = 'role';
      break;
    case 'role':
      state.tempEntry.role = input;
      state.subStep = 'desc';
      break;
    case 'desc':
      state.tempEntry.descriptions.push(input);
      break; // Stay until "finish_desc"
    case 'tech':
      state.tempEntry.techStack = input;
      state.subStep = 'link';
      break;
    case 'link':
      state.tempEntry.link = input;
      state.data.projects.push({ ...state.tempEntry });
      state.tempEntry = undefined;
      state.subStep = 'confirm';
      break;
  }
}

function handleKnownLangs(state: ResumeState, input: string) {
  if (state.subStep === 'name') {
    state.tempEntry = { name: input };
    state.subStep = 'level';
  }
}

// ─── Action Handlers ──────────────────────────────────────────────

// Welcome
resumeScene.action('start_resume', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  goToSection(state, 'language');
  await updateMsg(ctx);
});

resumeScene.action('show_help', async (ctx) => {
  await ctx.answerCbQuery('این ربات کمکت می‌کنه رزومه حرفه‌ای بسازی! دکمه ساخت رزومه رو بزن.', { show_alert: true });
});

// Navigation
resumeScene.action('go_welcome', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  goToSection(state, 'welcome');
  await updateMsg(ctx);
});

resumeScene.action('go_language', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  goToSection(state, 'language');
  await updateMsg(ctx);
});

resumeScene.action('go_confirm', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.subStep = 'confirm';
  state.tempEntry = undefined;
  await updateMsg(ctx);
});

// Language
resumeScene.action(/^lang_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.data.language = ctx.match![1]; // 'fa' or 'en'
  goToSection(state, 'template');
  await updateMsg(ctx);
});

// Template
resumeScene.action(/^tpl_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  state.data.template = ctx.match![1];
  goToSection(state, 'personal');
  await updateMsg(ctx);
});

// Skip field (personal info optional fields)
resumeScene.action('skip_field', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  const keys = PERSONAL_FIELDS.map(f => f.key);
  const idx = keys.indexOf(state.subStep);
  if (idx < keys.length - 1) {
    state.subStep = keys[idx + 1];
  } else {
    goToSection(state, 'education');
  }
  await updateMsg(ctx);
});

// Skip entire section
resumeScene.action('skip_section', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  const next = nextSection(state.section);
  goToSection(state, next);
  await updateMsg(ctx);
});

// Next section (from confirm)
resumeScene.action('next_section', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  const next = nextSection(state.section);
  goToSection(state, next);
  await updateMsg(ctx);
});

// Add more entries
resumeScene.action('add_more', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  const initialSteps: Record<string, string> = {
    education: 'degree', experience: 'title', skills: 'category',
    projects: 'name', knownLanguages: 'name',
  };
  state.subStep = initialSteps[state.section] || '';
  state.tempEntry = undefined;
  await updateMsg(ctx);
});

// Finish descriptions (experience/projects)
resumeScene.action('finish_desc', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;

  if (state.section === 'experience' && state.tempEntry) {
    state.data.experience.push({ ...state.tempEntry });
    state.tempEntry = undefined;
    state.subStep = 'confirm';
  } else if (state.section === 'projects' && state.tempEntry) {
    // For projects, still need tech stack
    state.subStep = 'tech';
  }
  await updateMsg(ctx);
});

// Skip project link
resumeScene.action('skip_link', async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  if (state.tempEntry) {
    state.data.projects.push({ ...state.tempEntry, link: undefined });
    state.tempEntry = undefined;
  }
  state.subStep = 'confirm';
  await updateMsg(ctx);
});

// Language level selection
resumeScene.action(/^lvl_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const state: ResumeState = (ctx.session as any).rs;
  const level = ctx.match![1];
  if (state.tempEntry) {
    state.data.knownLanguages.push({ name: state.tempEntry.name, level });
    state.tempEntry = undefined;
  }
  state.subStep = 'confirm';
  await updateMsg(ctx);
});

// Generate AI Summary
resumeScene.action('generate_summary', async (ctx) => {
  await ctx.answerCbQuery('در حال تولید خلاصه با هوش مصنوعی... ⏳');
  const state: ResumeState = (ctx.session as any).rs;
  
  // Show a loading message in the same place
  const chatId = ctx.chat!.id;
  try {
    await ctx.telegram.editMessageText(
      chatId, 
      state.mainMessageId!, 
      undefined, 
      '✨ <i>در حال ارتباط با هوش مصنوعی (Gemma) و تولید خلاصه حرفه‌ای... لطفاً چند لحظه صبر کنید.</i> ⏳',
      { parse_mode: 'HTML' }
    );
  } catch {}

  // Generate summary
  const summary = await generateProfessionalSummary(state.data);
  state.data.summary = summary;
  
  // Update view
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
      caption: '🎉 رزومه شما آماده شد!\nبا تشکر از استفاده از ربات رزومه‌ساز ما.'
    });

    // Restore the message back to review mode
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
  await ctx.answerCbQuery();
  const state = initState();
  (ctx.session as any).rs = state;
  const { text, keyboard } = buildMessage(state, ctx.from?.first_name);
  const chatId = ctx.chat!.id;
  try {
    await ctx.telegram.editMessageText(chatId, ((ctx.session as any).rs_old_msg || 0), undefined, '🗑 حذف شد.', { parse_mode: 'HTML' });
  } catch {}
  const msg = await ctx.telegram.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: keyboard });
  state.mainMessageId = msg.message_id;
});

// Cancel
resumeScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery();
  const state = initState();
  (ctx.session as any).rs = state;
  const { text, keyboard } = buildMessage(state, ctx.from?.first_name);
  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch {}
});

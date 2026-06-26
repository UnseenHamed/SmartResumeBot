import { Markup } from 'telegraf';

// ─── Types ────────────────────────────────────────────────────────

export interface Education { degree: string; university: string; date: string }
export interface Experience { title: string; company: string; date: string; descriptions: string[] }
export interface SkillGroup { category: string; items: string[] }
export interface Project { name: string; role: string; descriptions: string[]; techStack: string; link?: string }
export interface KnownLanguage { name: string; level: string }

export interface ResumeData {
  language?: string;
  template?: string;
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  socialLinks?: { name: string; url: string }[];
  education: Education[];
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  knownLanguages: KnownLanguage[];
  summary?: string;
}

export type Section = 'welcome' | 'language' | 'template' | 'ai_chat';

export interface ResumeState {
  section: Section;
  data: ResumeData;
  mainMessageId?: number;
  aiMessage?: string; // Store last AI response
}

const DIV = '\n━━━━━━━━━━━━━━━━━━━\n';

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildWelcomeMsg(name: string): { text: string; keyboard: any } {
  let t = `<b>🎯 Smart Resume AI</b>\n`;
  t += DIV;
  t += `\nسلام <b>${esc(name)}</b>! 👋\n\n`;
  t += `من دستیار هوشمند ساخت رزومه هستم.\n`;
  t += `بدون پر کردن فرم‌های طولانی، فقط با چت کردن یک رزومه فوق حرفه‌ای بساز!\n\n`;
  t += `✦ تبدیل صحبت‌های شما به ساختار رزومه\n`;
  t += `✦ ترجمه تخصصی و استاندارد\n`;
  t += `✦ چیدمان هوشمند در قالب‌های پرمیوم\n`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('✨ شروع ساخت رزومه جادویی', 'start_resume')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildLanguageMsg(): { text: string; keyboard: any } {
  let t = `<b>🎯 Smart Resume AI</b>\n\n`;
  t += `🌐  <b>زبان نهایی رزومه رو انتخاب کن</b>\n\n`;
  t += `<i>(می‌تونی فارسی چت کنی، اما من کل اطلاعاتت رو به زبانی که اینجا انتخاب می‌کنی ترجمه و تایپ می‌کنم)</i>`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('🇮🇷  فارسی', 'lang_fa'), Markup.button.callback('🇬🇧  English', 'lang_en')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildTemplateMsg(): { text: string; keyboard: any } {
  let t = `<b>🎯 Smart Resume AI</b>\n\n`;
  t += `🎨  <b>قالب رزومه رو انتخاب کن</b>\n\n`;
  t += `<i>ظاهر نهایی رزومه‌ات چطور باشه؟</i>`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('🎨 مدرن (Modern)', 'tpl_modern')],
    [Markup.button.callback('🏛 کلاسیک (Classic)', 'tpl_classic')],
    [Markup.button.callback('✨ مینیمال (Minimal)', 'tpl_minimal')],
    [Markup.button.callback('🎭 خلاقانه (Creative)', 'tpl_creative')],
    [Markup.button.callback('👔 حرفه‌ای (Professional)', 'tpl_professional')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildAiChatMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = `<b>🧠 دستیار هوشمند استخدام (AI Coach)</b>\n`;
  t += DIV;
  
  if (state.aiMessage) {
    t += `${state.aiMessage}\n\n`;
    t += `<i>(برای اضافه کردن اطلاعات فقط کافیه برام تایپ کنی)</i>`;
  } else {
    t += `آماده‌ام! 🚀\n\n`;
    t += `لطفاً در یک پیام (یا چند پیام) درباره خودت بهم بگو. \nمثلاً:\n`;
    t += `<i>"من حامدم ۲۴ سالمه، ۳ ساله توی اسنپ برنامه‌نویس ریکت هستم. آیدی تلگرامم hamed هست و تو دانشگاه تهران درس خوندم..."</i>\n\n`;
    t += `من همه رو می‌خونم، ترجمه می‌کنم و رزومه‌ات رو می‌سازم!`;
  }

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('📄 مشاهده و دریافت PDF', 'generate_pdf')],
    [Markup.button.callback('🗑 شروع از اول', 'restart')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildMessage(state: ResumeState, name?: string): { text: string; keyboard: any } {
  switch (state.section) {
    case 'welcome':  return buildWelcomeMsg(name || 'کاربر');
    case 'language': return buildLanguageMsg();
    case 'template': return buildTemplateMsg();
    case 'ai_chat':  return buildAiChatMsg(state);
    default:         return buildWelcomeMsg(name || 'کاربر');
  }
}



// ─── Router ───────────────────────────────────────────────────────

export function buildMessage(state: ResumeState, name?: string): { text: string; keyboard: any } {
  switch (state.section) {
    case 'welcome':       return buildWelcomeMsg(name || 'کاربر');
    case 'language':      return buildLanguageMsg();
    case 'template':      return buildTemplateMsg();
    case 'personal':      return buildPersonalMsg(state);
    case 'education':     return buildEducationMsg(state);
    case 'experience':    return buildExperienceMsg(state);
    case 'skills':        return buildSkillsMsg(state);
    case 'projects':      return buildProjectsMsg(state);
    case 'knownLanguages': return buildKnownLanguagesMsg(state);
    case 'review':        return buildReviewMsg(state);
    default:              return buildWelcomeMsg(name || 'کاربر');
  }
}

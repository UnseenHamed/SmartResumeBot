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
  linkedin?: string;
  github?: string;
  education: Education[];
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  knownLanguages: KnownLanguage[];
  summary?: string;
}

export type Section = 'welcome' | 'language' | 'template' | 'personal' | 'education' | 'experience' | 'skills' | 'projects' | 'knownLanguages' | 'review';

export interface ResumeState {
  section: Section;
  subStep: string;
  data: ResumeData;
  tempEntry?: any;
  mainMessageId?: number;
}

export const SECTION_FLOW: Section[] = [
  'welcome', 'language', 'template', 'personal', 'education',
  'experience', 'skills', 'projects', 'knownLanguages', 'review'
];

export function nextSection(current: Section): Section {
  const idx = SECTION_FLOW.indexOf(current);
  return SECTION_FLOW[Math.min(idx + 1, SECTION_FLOW.length - 1)];
}

export const PERSONAL_FIELDS = [
  { key: 'fullName',  icon: '👤', label: 'نام کامل',      example: 'حامد لطفی',             required: true },
  { key: 'jobTitle',  icon: '💼', label: 'عنوان شغلی',    example: 'Full-Stack Developer',   required: true },
  { key: 'email',     icon: '📧', label: 'ایمیل',          example: 'example@gmail.com',      required: true },
  { key: 'phone',     icon: '📱', label: 'شماره تماس',    example: '+98 912 345 6789',       required: false },
  { key: 'location',  icon: '📍', label: 'موقعیت مکانی',  example: 'تهران، ایران',           required: false },
  { key: 'linkedin',  icon: '🔗', label: 'لینکدین',        example: 'linkedin.com/in/user',   required: false },
  { key: 'github',    icon: '💻', label: 'گیت‌هاب',       example: 'github.com/user',        required: false },
];

// ─── Utilities ────────────────────────────────────────────────────

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function progressBar(step: number, total: number = 9): string {
  const filled = '▰'.repeat(step);
  const empty = '▱'.repeat(total - step);
  return `${filled}${empty}  ${step}/${total}`;
}

function sectionStep(section: Section): number {
  const steps: Record<Section, number> = {
    welcome: 0, language: 1, template: 2, personal: 3, education: 4,
    experience: 5, skills: 6, projects: 7, knownLanguages: 8, review: 9
  };
  return steps[section] || 0;
}

function header(section: Section): string {
  let h = `<b>🎯 Smart Resume AI</b>\n`;
  const step = sectionStep(section);
  if (step > 0) h += `${progressBar(step)}\n`;
  h += `\n━━━━━━━━━━━━━━━━━━━\n\n`;
  return h;
}

const DIV = '\n━━━━━━━━━━━━━━━━━━━\n';

// ─── Message Builders ─────────────────────────────────────────────

export function buildWelcomeMsg(name: string): { text: string; keyboard: any } {
  let t = `<b>🎯 Smart Resume AI</b>\n`;
  t += DIV;
  t += `\nسلام <b>${esc(name)}</b>! 👋\n\n`;
  t += `من دستیار هوشمند ساخت رزومه هستم.\n`;
  t += `در چند دقیقه یه رزومه حرفه‌ای بساز!\n\n`;
  t += `✦  ۵ قالب حرفه‌ای زیبا\n`;
  t += `✦  پشتیبانی فارسی و انگلیسی\n`;
  t += `✦  خلاصه حرفه‌ای با هوش مصنوعی\n`;
  t += `✦  خروجی PDF آماده پرینت\n`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('📝  ساخت رزومه جدید', 'start_resume')],
    [Markup.button.callback('❓  راهنما', 'show_help')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildLanguageMsg(): { text: string; keyboard: any } {
  let t = header('language');
  t += `🌐  <b>زبان رزومه رو انتخاب کن</b>\n\n`;
  t += `<i>زبان ربات جدا از زبان رزومه‌ست.\nمثلاً می‌تونی فارسی چت کنی ولی\nرزومه‌ت انگلیسی باشه.</i>`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('🇮🇷  فارسی', 'lang_fa'), Markup.button.callback('🇬🇧  English', 'lang_en')],
    [Markup.button.callback('🔙  برگشت', 'go_welcome')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildTemplateMsg(): { text: string; keyboard: any } {
  let t = header('template');
  t += `🎨  <b>قالب رزومه رو انتخاب کن</b>\n\n`;
  t += `<i>هر قالب یه استایل خاص داره 👇</i>`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('🎨  مدرن — Modern', 'tpl_modern')],
    [Markup.button.callback('🏛  کلاسیک — Classic', 'tpl_classic')],
    [Markup.button.callback('✨  مینیمال — Minimal', 'tpl_minimal')],
    [Markup.button.callback('🎭  خلاقانه — Creative', 'tpl_creative')],
    [Markup.button.callback('👔  حرفه‌ای — Professional', 'tpl_professional')],
    [Markup.button.callback('🔙  برگشت', 'go_language')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
}

export function buildPersonalMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('personal');
  t += `👤  <b>اطلاعات شخصی</b>\n\n`;

  const currentIdx = PERSONAL_FIELDS.findIndex(f => f.key === state.subStep);

  for (let i = 0; i < PERSONAL_FIELDS.length; i++) {
    const f = PERSONAL_FIELDS[i];
    const val = (state.data as any)[f.key];
    if (val) {
      t += `  ${f.icon}  ${esc(val)}\n`;
    } else if (i === currentIdx) {
      t += `  ${f.icon}  <i>⏳ در انتظار...</i>\n`;
    } else {
      t += `  ${f.icon}  ─\n`;
    }
  }

  const currentField = PERSONAL_FIELDS[currentIdx];
  if (currentField) {
    t += `\n📌 <b>${currentField.label}ت رو بنویس</b>\n`;
    t += `<i>مثال: ${currentField.example}</i>`;
  }

  const btns: any[] = [];
  if (currentField && !currentField.required) {
    btns.push([Markup.button.callback('⏭  رد شود', 'skip_field')]);
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildEducationMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('education');
  t += `🎓  <b>تحصیلات</b>\n\n`;

  // Show existing entries
  state.data.education.forEach((e, i) => {
    t += `  ✅ ${esc(e.degree)}\n`;
    t += `      ${esc(e.university)}  •  ${esc(e.date)}\n\n`;
  });

  // Show temp entry being filled
  if (state.tempEntry && state.subStep !== 'confirm') {
    t += `  📝 <i>در حال ثبت:</i>\n`;
    if (state.tempEntry.degree) t += `      مقطع: ${esc(state.tempEntry.degree)}\n`;
    if (state.tempEntry.university) t += `      دانشگاه: ${esc(state.tempEntry.university)}\n`;
    t += `\n`;
  }

  // Current prompt
  const btns: any[] = [];
  switch (state.subStep) {
    case 'degree':
      t += `📌 <b>مقطع تحصیلیت رو بنویس</b>\n<i>مثال: کارشناسی مهندسی کامپیوتر</i>`;
      if (state.data.education.length === 0) btns.push([Markup.button.callback('⏭  رد کردن (ندارم)', 'skip_section')]);
      else btns.push([Markup.button.callback('🔙  برگشت', 'go_confirm')]);
      break;
    case 'university':
      t += `📌 <b>نام دانشگاه رو بنویس</b>\n<i>مثال: دانشگاه تهران</i>`;
      break;
    case 'date':
      t += `📌 <b>سال شروع و پایان رو بنویس</b>\n<i>مثال: 2022 — Present</i>`;
      break;
    case 'confirm':
      t += `📌 <b>مورد دیگه‌ای اضافه کنی؟</b>`;
      btns.push([Markup.button.callback('➕  افزودن مورد جدید', 'add_more')]);
      btns.push([Markup.button.callback('⏭  مرحله بعد', 'next_section')]);
      break;
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildExperienceMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('experience');
  t += `💼  <b>سوابق کاری</b>\n\n`;

  state.data.experience.forEach((e) => {
    t += `  ✅ ${esc(e.title)}\n`;
    t += `      ${esc(e.company)}  •  ${esc(e.date)}\n`;
    e.descriptions.forEach(d => { t += `      • ${esc(d)}\n`; });
    t += `\n`;
  });

  if (state.tempEntry && state.subStep !== 'confirm') {
    t += `  📝 <i>در حال ثبت:</i>\n`;
    if (state.tempEntry.title) t += `      عنوان: ${esc(state.tempEntry.title)}\n`;
    if (state.tempEntry.company) t += `      شرکت: ${esc(state.tempEntry.company)}\n`;
    if (state.tempEntry.date) t += `      بازه: ${esc(state.tempEntry.date)}\n`;
    if (state.tempEntry.descriptions?.length) {
      state.tempEntry.descriptions.forEach((d: string) => { t += `      • ${esc(d)}\n`; });
    }
    t += `\n`;
  }

  const btns: any[] = [];
  switch (state.subStep) {
    case 'title':
      t += `📌 <b>عنوان شغلی رو بنویس</b>\n<i>مثال: توسعه‌دهنده ارشد فرانت‌اند</i>`;
      if (state.data.experience.length === 0) btns.push([Markup.button.callback('⏭  رد کردن (ندارم)', 'skip_section')]);
      else btns.push([Markup.button.callback('🔙  برگشت', 'go_confirm')]);
      break;
    case 'company':
      t += `📌 <b>نام شرکت/سازمان</b>\n<i>مثال: شرکت اسنپ</i>`;
      break;
    case 'date':
      t += `📌 <b>بازه زمانی</b>\n<i>مثال: 2023 — Present</i>`;
      break;
    case 'desc':
      t += `📌 <b>توضیحات رو بنویس</b>\n<i>هر توضیح رو جدا بفرست\nمثال: طراحی و پیاده‌سازی ۱۰ صفحه وب</i>`;
      btns.push([Markup.button.callback('✅  اتمام توضیحات', 'finish_desc')]);
      break;
    case 'confirm':
      t += `📌 <b>سابقه دیگه‌ای اضافه کنی؟</b>`;
      btns.push([Markup.button.callback('➕  افزودن مورد جدید', 'add_more')]);
      btns.push([Markup.button.callback('⏭  مرحله بعد', 'next_section')]);
      break;
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildSkillsMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('skills');
  t += `🛠  <b>مهارت‌ها</b>\n\n`;

  state.data.skills.forEach((s) => {
    t += `  ✅ <b>${esc(s.category)}:</b>  ${s.items.map(i => esc(i)).join('، ')}\n`;
  });
  if (state.data.skills.length) t += `\n`;

  if (state.tempEntry && state.subStep === 'items') {
    t += `  📝 دسته: ${esc(state.tempEntry.category)}\n\n`;
  }

  const btns: any[] = [];
  switch (state.subStep) {
    case 'category':
      t += `📌 <b>نام دسته‌بندی رو بنویس</b>\n<i>مثال: Frontend, Backend, طراحی</i>`;
      if (state.data.skills.length === 0) btns.push([Markup.button.callback('⏭  رد کردن', 'skip_section')]);
      else btns.push([Markup.button.callback('🔙  برگشت', 'go_confirm')]);
      break;
    case 'items':
      t += `📌 <b>مهارت‌ها رو بنویس (با کاما جدا کن)</b>\n<i>مثال: React, Next.js, TypeScript</i>`;
      break;
    case 'confirm':
      t += `📌 <b>دسته دیگه‌ای اضافه کنی؟</b>`;
      btns.push([Markup.button.callback('➕  افزودن دسته جدید', 'add_more')]);
      btns.push([Markup.button.callback('⏭  مرحله بعد', 'next_section')]);
      break;
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildProjectsMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('projects');
  t += `📂  <b>پروژه‌ها</b>\n\n`;

  state.data.projects.forEach((p) => {
    t += `  ✅ <b>${esc(p.name)}</b>  —  ${esc(p.role)}\n`;
    p.descriptions.forEach(d => { t += `      • ${esc(d)}\n`; });
    t += `      🔧 ${esc(p.techStack)}\n`;
    if (p.link) t += `      🔗 ${esc(p.link)}\n`;
    t += `\n`;
  });

  if (state.tempEntry && state.subStep !== 'confirm') {
    t += `  📝 <i>در حال ثبت:</i>\n`;
    if (state.tempEntry.name) t += `      نام: ${esc(state.tempEntry.name)}\n`;
    if (state.tempEntry.role) t += `      نقش: ${esc(state.tempEntry.role)}\n`;
    if (state.tempEntry.descriptions?.length) {
      state.tempEntry.descriptions.forEach((d: string) => { t += `      • ${esc(d)}\n`; });
    }
    if (state.tempEntry.techStack) t += `      🔧 ${esc(state.tempEntry.techStack)}\n`;
    t += `\n`;
  }

  const btns: any[] = [];
  switch (state.subStep) {
    case 'name':
      t += `📌 <b>نام پروژه رو بنویس</b>\n<i>مثال: فروشگاه آنلاین</i>`;
      if (state.data.projects.length === 0) btns.push([Markup.button.callback('⏭  رد کردن (ندارم)', 'skip_section')]);
      else btns.push([Markup.button.callback('🔙  برگشت', 'go_confirm')]);
      break;
    case 'role':
      t += `📌 <b>نقشت تو پروژه</b>\n<i>مثال: Full-Stack Developer</i>`;
      break;
    case 'desc':
      t += `📌 <b>توضیحات پروژه رو بنویس</b>\n<i>هر مورد رو جدا بفرست</i>`;
      btns.push([Markup.button.callback('✅  اتمام توضیحات', 'finish_desc')]);
      break;
    case 'tech':
      t += `📌 <b>تکنولوژی‌های استفاده شده</b>\n<i>مثال: Next.js, Node.js, PostgreSQL</i>`;
      break;
    case 'link':
      t += `📌 <b>لینک پروژه (اختیاری)</b>\n<i>مثال: https://myproject.com</i>`;
      btns.push([Markup.button.callback('⏭  رد شود', 'skip_link')]);
      break;
    case 'confirm':
      t += `📌 <b>پروژه دیگه‌ای اضافه کنی؟</b>`;
      btns.push([Markup.button.callback('➕  افزودن پروژه جدید', 'add_more')]);
      btns.push([Markup.button.callback('⏭  مرحله بعد', 'next_section')]);
      break;
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildKnownLanguagesMsg(state: ResumeState): { text: string; keyboard: any } {
  let t = header('knownLanguages');
  t += `🗣  <b>زبان‌ها</b>\n\n`;

  state.data.knownLanguages.forEach((l) => {
    t += `  ✅ ${esc(l.name)}  —  ${esc(l.level)}\n`;
  });
  if (state.data.knownLanguages.length) t += `\n`;

  if (state.tempEntry && state.subStep === 'level') {
    t += `  📝 زبان: ${esc(state.tempEntry.name)}\n\n`;
  }

  const btns: any[] = [];
  switch (state.subStep) {
    case 'name':
      t += `📌 <b>نام زبان رو بنویس</b>\n<i>مثال: English</i>`;
      if (state.data.knownLanguages.length === 0) btns.push([Markup.button.callback('⏭  رد کردن', 'skip_section')]);
      else btns.push([Markup.button.callback('🔙  برگشت', 'go_confirm')]);
      break;
    case 'level':
      t += `📌 <b>سطح تسلط رو انتخاب کن</b>`;
      btns.push([Markup.button.callback('🟢  Native / بومی', 'lvl_Native')]);
      btns.push([Markup.button.callback('🔵  Professional / حرفه‌ای', 'lvl_Professional')]);
      btns.push([Markup.button.callback('🟡  Intermediate / متوسط', 'lvl_Intermediate')]);
      btns.push([Markup.button.callback('🟠  Basic / مبتدی', 'lvl_Basic')]);
      break;
    case 'confirm':
      t += `📌 <b>زبان دیگه‌ای اضافه کنی؟</b>`;
      btns.push([Markup.button.callback('➕  افزودن زبان جدید', 'add_more')]);
      btns.push([Markup.button.callback('⏭  بازبینی نهایی', 'next_section')]);
      break;
  }
  btns.push([Markup.button.callback('❌  لغو', 'cancel')]);
  return { text: t, keyboard: Markup.inlineKeyboard(btns).reply_markup };
}

export function buildReviewMsg(state: ResumeState): { text: string; keyboard: any } {
  const d = state.data;
  let t = `<b>🎯 Smart Resume AI</b>\n`;
  t += `▰▰▰▰▰▰▰▰▰  بازبینی نهایی\n`;
  t += DIV + `\n`;
  t += `📋  <b>خلاصه رزومه شما</b>\n`;
  t += DIV + `\n`;

  t += `👤  <b>${esc(d.fullName || '—')}</b>\n`;
  t += `💼  ${esc(d.jobTitle || '—')}\n`;
  if (d.email) t += `📧  ${esc(d.email)}\n`;
  if (d.phone) t += `📱  ${esc(d.phone)}\n`;
  if (d.location) t += `📍  ${esc(d.location)}\n`;
  if (d.linkedin) t += `🔗  ${esc(d.linkedin)}\n`;
  if (d.github) t += `💻  ${esc(d.github)}\n`;

  t += DIV + `\n`;
  t += `🎓  تحصیلات: <b>${d.education.length}</b> مورد\n`;
  t += `💼  سوابق کاری: <b>${d.experience.length}</b> مورد\n`;
  t += `🛠  مهارت‌ها: <b>${d.skills.length}</b> دسته\n`;
  t += `📂  پروژه‌ها: <b>${d.projects.length}</b> مورد\n`;
  t += `🗣  زبان‌ها: <b>${d.knownLanguages.length}</b> مورد\n`;

  t += DIV + `\n`;
  const tplNames: Record<string, string> = { modern: 'مدرن', classic: 'کلاسیک', minimal: 'مینیمال', creative: 'خلاقانه', professional: 'حرفه‌ای' };
  t += `🎨  قالب: <b>${tplNames[d.template || ''] || d.template}</b>\n`;
  t += `🌐  زبان رزومه: <b>${d.language === 'fa' ? 'فارسی' : 'انگلیسی'}</b>\n`;
  
  if (d.summary) {
    t += DIV + `\n`;
    t += `✨  <b>خلاصه هوش مصنوعی (AI Summary)</b>\n`;
    t += `${esc(d.summary)}\n`;
  }

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback(d.summary ? '✨  تولید مجدد خلاصه' : '✨  تولید خلاصه با هوش مصنوعی', 'generate_summary')],
    [Markup.button.callback('📄  تولید PDF', 'generate_pdf')],
    [Markup.button.callback('🔁  شروع از اول', 'restart')],
  ]);
  return { text: t, keyboard: kb.reply_markup };
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

import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { ResumeData } from '../bot/helpers/format';

const ai = new GoogleGenAI({ apiKey: config.GOOGLE_API_KEY });

export async function generateProfessionalSummary(data: ResumeData): Promise<string> {
  // We keep this for backward compatibility or direct summary generation
  if (!config.GOOGLE_API_KEY) return '';
  const context = JSON.stringify(data);
  const langPrompt = data.language === 'en' ? 'Write in English.' : 'Write in Persian (Farsi).';
  const prompt = `You are an expert resume writer. Write a concise professional summary (3 sentences). ${langPrompt}\nData: ${context}`;
  try {
    const response = await ai.models.generateContent({ model: 'gemma-4-31b-it', contents: prompt });
    return response.text || '';
  } catch (e) {
    return '';
  }
}

export async function processResumeText(userInput: string, currentData: ResumeData): Promise<{ resumeData: ResumeData, aiMessage: string }> {
  if (!config.GOOGLE_API_KEY) throw new Error('AI Disabled');

  const langDirective = currentData.language === 'en' 
    ? 'CRITICAL: The user wants an ENGLISH resume. You MUST translate and enhance all extracted information (names, titles, descriptions, skills) into highly professional English, regardless of the language the user typed in.' 
    : 'The user wants a PERSIAN resume. Keep the extracted information in Persian, but enhance it professionally.';

  const prompt = `
You are an elite, premium AI Career Coach and Resume Builder.
The user is talking to you in a chat to build their resume.
Current Resume Data state: ${JSON.stringify(currentData)}

The user just sent this new message: "${userInput}"

Your task is to:
1. Extract any new information from the user's message (e.g. names, jobs, universities, skills, links like Telegram/LinkedIn/GitHub).
2. MERGE this new information with the 'Current Resume Data'.
3. ${langDirective} (Very important: enhance descriptions to be ATS-friendly and professional).
4. For social links (Telegram, Github, LinkedIn, WhatsApp, Twitter/X, Instagram, personal website, portfolio), add them to the 'socialLinks' array.
   CRITICAL: The 'name' field MUST be exactly one of these lowercase values: telegram, github, linkedin, whatsapp, twitter, instagram, website, portfolio.
   Examples: If user says "آیدی تلگرامم hamed_dev هست" → { "name": "telegram", "url": "hamed_dev" }
             If user says "گیت‌هاب من github.com/hamed" → { "name": "github", "url": "github.com/hamed" }
             If user says "سایت شخصی من example.com" → { "name": "website", "url": "example.com" }
    "socialLinks": [{ "name": string, "url": string }],
5. Generate a 'summary' if there's enough data (experience/skills), otherwise leave it empty.
6. Write a conversational, premium, and friendly 'aiMessage' IN PERSIAN (Farsi) to reply to the user. 
   - In the aiMessage, first acknowledge what you successfully added (e.g. "اطلاعات شغلی شما در اسنپ رو با موفقیت ثبت کردم!").
   - Then, intelligently analyze what CRITICAL resume sections are still empty (e.g., Education, Skills, Contact Info, Languages).
   - Politely and creatively encourage them to provide that missing info (e.g. "حامد عزیز، رزومه‌ات داره عالی میشه! اما هنوز بخش تحصیلات خالیه. دوست داری بهم بگی کجا درس خوندی؟").
   - Keep the aiMessage concise but extremely premium.

Return EXACTLY a JSON object matching this schema:
{
  "resumeData": {
    "language": "en" or "fa",
    "template": string,
    "fullName": string,
    "jobTitle": string,
    "email": string,
    "phone": string,
    "location": string,
    "socialLinks": [{ "name": string, "url": string }],
    "education": [{ "degree": string, "university": string, "date": string }],
    "experience": [{ "title": string, "company": string, "date": string, "descriptions": [string] }],
    "skills": [{ "category": string, "items": [string] }],
    "projects": [{ "name": string, "role": string, "descriptions": [string], "techStack": string, "link": string }],
    "knownLanguages": [{ "name": string, "level": string }],
    "summary": string
  },
  "aiMessage": string
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents: prompt,
    });
    
    if (response.text) {
      // Clean up markdown block if model wraps JSON in ```json ... ```
      let text = response.text.trim();
      if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      else if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
      return JSON.parse(text);
    }
    throw new Error('Empty AI response');
  } catch (error: any) {
    console.error('Error processing resume text:', error);
    throw error;
  }
}

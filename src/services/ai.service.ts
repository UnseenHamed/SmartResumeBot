import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { ResumeData } from '../bot/helpers/format';

const ai = new GoogleGenAI({ apiKey: config.GOOGLE_API_KEY });

export async function generateProfessionalSummary(data: ResumeData): Promise<string> {
  if (!config.GOOGLE_API_KEY) {
    return 'Summary generation is disabled (No API Key provided).';
  }

  // Create a context string from resume data
  const context = `
    Name: ${data.fullName || ''}
    Job Title: ${data.jobTitle || ''}
    Education: ${data.education.map(e => `${e.degree} at ${e.university} (${e.date})`).join(', ')}
    Experience: ${data.experience.map(e => `${e.title} at ${e.company} (${e.date}): ${e.descriptions.join(', ')}`).join(' | ')}
    Skills: ${data.skills.map(s => `${s.category}: ${s.items.join(', ')}`).join(' | ')}
    Projects: ${data.projects.map(p => `${p.name} (${p.role}): ${p.descriptions.join(', ')} - ${p.techStack}`).join(' | ')}
    Languages: ${data.knownLanguages.map(l => `${l.name} (${l.level})`).join(', ')}
  `;

  const langPrompt = data.language === 'en' 
    ? 'Write the summary in English.' 
    : 'Write the summary in Persian (Farsi).';

  const prompt = `
    You are an expert resume writer. Based on the following information, write a highly professional, engaging, and concise professional summary (about 3-4 sentences) for a resume. 
    Focus on highlighting key achievements, core skills, and professional value.
    Do not include any placeholders or missing info. Make it sound confident and polished.
    ${langPrompt}
    
    Resume Info:
    ${context}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-31b',
      contents: prompt,
    });
    
    return response.text || 'Unable to generate summary at this time.';
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    return 'An error occurred while generating the summary.';
  }
}

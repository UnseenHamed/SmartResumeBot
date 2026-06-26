import puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import { ResumeData } from '../bot/helpers/format';

export async function generatePdf(data: ResumeData): Promise<Buffer> {
  const templateName = data.template || 'modern';
  const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
  
  // Render HTML using EJS
  const html = await ejs.renderFile(templatePath, { data });

  // Launch Puppeteer (with args for running on servers like Render)
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process'
    ]
  });

  const page = await browser.newPage();
  
  // Set content
  await page.setContent(html, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Inject script to ensure fonts are loaded
  await page.evaluateHandle('document.fonts.ready');
  // Explicitly wait 2 seconds for external fonts (Vazirmatn, FontAwesome) to render completely
  await new Promise(r => setTimeout(r, 2000));

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  });

  await browser.close();
  
  return Buffer.from(pdfBuffer);
}

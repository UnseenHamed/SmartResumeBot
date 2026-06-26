import puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import { ResumeData } from '../bot/helpers/format';

export async function generatePdf(data: ResumeData): Promise<Buffer> {
  const templateName = data.template || 'modern';
  const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
  
  const fontsDir = 'file://' + path.resolve(__dirname, '../templates/fonts');
  
  // Render HTML using EJS
  const html = await ejs.renderFile(templatePath, { data, fontsDir });

  // Launch Puppeteer (with args for running on servers like Render)
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--font-render-hinting=none'
    ]
  });

  const page = await browser.newPage();
  
  // Allow file:// protocol for local fonts
  await page.setBypassCSP(true);
  
  // Set content — fonts are local so networkidle0 is fast
  await page.setContent(html, {
    waitUntil: 'networkidle0' as any,
    timeout: 30000
  });

  // Ensure all fonts are loaded
  await page.evaluateHandle('document.fonts.ready');

  // Emulate print media for better PDF rendering
  await page.emulateMediaType('print');

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

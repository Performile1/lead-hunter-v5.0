import nodemailer from 'nodemailer';

/**
 * Email Service för DHL Lead Hunter
 * Använder Nodemailer för att skicka emails
 */

// Skapa transporter (konfigurera med dina SMTP-inställningar)
const createTransporter = () => {
  // För Gmail
  if (process.env.EMAIL_PROVIDER === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App-specific password
      }
    });
  }
  
  // För Outlook/Office365
  if (process.env.EMAIL_PROVIDER === 'outlook') {
    return nodemailer.createTransporter({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // För SendGrid
  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Default: SMTP
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Skicka email
 */
export async function sendEmail(to, subject, html, options = {}) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"DHL Lead Hunter" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      ...options
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Skicka välkomst-email till ny användare
 */
export async function sendWelcomeEmail(user) {
  const subject = 'Välkommen till DHL Lead Hunter';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #D40511; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background-color: #D40511; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Välkommen till DHL Lead Hunter!</h1>
      </div>
      
      <div class="content">
        <p>Hej ${user.full_name},</p>
        
        <p>Ditt konto har skapats och du kan nu börja använda DHL Lead Hunter för att hitta och analysera leads.</p>
        
        <p><strong>Dina inloggningsuppgifter:</strong></p>
        <ul>
          <li>Email: ${user.email}</li>
          <li>Roll: ${user.role}</li>
        </ul>
        
        <p>Logga in för att komma igång:</p>
        <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="button">Logga in</a>
        
        <p><strong>Vad kan du göra?</strong></p>
        <ul>
          <li>Söka och analysera leads med AI</li>
          <li>Välja mellan 4 analysprotokoll</li>
          <li>Använda 5 olika AI-modeller</li>
          <li>Bevaka leads för automatiska uppdateringar</li>
          <li>Exportera data till Excel/CSV</li>
        </ul>
        
        <p>Har du frågor? Kontakta din administratör.</p>
        
        <p>Mvh,<br>DHL Lead Hunter Team</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} DHL. Alla rättigheter förbehållna.</p>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
}

/**
 * Skicka lösenordsåterställning
 */
export async function sendPasswordResetEmail(user, resetToken) {
  const subject = 'Återställ ditt lösenord - DHL Lead Hunter';
  
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #D40511; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background-color: #D40511; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Återställ Lösenord</h1>
      </div>
      
      <div class="content">
        <p>Hej ${user.full_name},</p>
        
        <p>Du har begärt att återställa ditt lösenord för DHL Lead Hunter.</p>
        
        <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>
        <a href="${resetUrl}" class="button">Återställ Lösenord</a>
        
        <p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
        <p><code>${resetUrl}</code></p>
        
        <div class="warning">
          <strong>⚠️ Viktigt:</strong> Denna länk är giltig i 1 timme. Om du inte begärde denna återställning, ignorera detta email.
        </div>
        
        <p>Mvh,<br>DHL Lead Hunter Team</p>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(user.email, subject, html);
}

/**
 * Skicka lead-tilldelning notifikation
 */
export async function sendLeadAssignmentEmail(salesperson, lead, assignedBy) {
  const subject = `Nytt lead tilldelat: ${lead.company_name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #D40511; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .lead-info { background-color: #f8f9fa; border-left: 4px solid #FFCC00; padding: 15px; margin: 20px 0; }
        .button { background-color: #D40511; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Nytt Lead Tilldelat</h1>
      </div>
      
      <div class="content">
        <p>Hej ${salesperson.full_name},</p>
        
        <p>Du har tilldelats ett nytt lead av ${assignedBy}.</p>
        
        <div class="lead-info">
          <h3>${lead.company_name}</h3>
          <p><strong>Org.nummer:</strong> ${lead.org_number || 'N/A'}</p>
          <p><strong>Segment:</strong> ${lead.segment}</p>
          <p><strong>Stad:</strong> ${lead.city || 'N/A'}</p>
          <p><strong>Omsättning:</strong> ${lead.revenue_tkr ? lead.revenue_tkr.toLocaleString('sv-SE') + ' TKR' : 'N/A'}</p>
        </div>
        
        <p>Logga in för att se fullständig information:</p>
        <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="button">Visa Lead</a>
        
        <p>Mvh,<br>DHL Lead Hunter</p>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(salesperson.email, subject, html);
}

/**
 * Skicka bulk-email till flera mottagare
 */
export async function sendBulkEmail(recipients, subject, html) {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, subject, html);
    results.push({ recipient, ...result });
    
    // Vänta lite mellan emails för att undvika rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendLeadAssignmentEmail,
  sendBulkEmail
};

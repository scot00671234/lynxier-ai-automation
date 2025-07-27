import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create transporter - in production, use proper email service credentials
const createTransporter = () => {
  // For development, use ethereal email for testing
  // In production, configure with real SMTP settings
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "test@ethereal.email",
      pass: process.env.SMTP_PASS || "test123"
    }
  });
};

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const transporter = createTransporter();
    
    // Replace template placeholders with actual data
    let emailContent = options.template;
    if (options.data) {
      Object.entries(options.data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        emailContent = emailContent.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@lynxier.com",
      to: options.to,
      subject: options.subject,
      html: emailContent,
      text: emailContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export function generateEmailTemplate(templateType: string, data: Record<string, any>): string {
  switch (templateType) {
    case "resume_analysis":
      return `
        <h2>Resume Analysis Results</h2>
        <p>Hi there,</p>
        <p>Here are the AI analysis results for the uploaded resume:</p>
        
        <h3>Candidate Information</h3>
        <ul>
          <li><strong>Name:</strong> {{candidateName}}</li>
          <li><strong>Score:</strong> {{score}}/10</li>
          <li><strong>Experience:</strong> {{yearsOfExperience}} years</li>
        </ul>
        
        <h3>Summary</h3>
        <p>{{summary}}</p>
        
        <h3>Key Skills</h3>
        <p>{{skills}}</p>
        
        <h3>Recommendations</h3>
        <p>{{recommendations}}</p>
        
        <p>Best regards,<br>Lynxier AI Workflow</p>
      `;
    
    case "workflow_completion":
      return `
        <h2>Workflow Execution Complete</h2>
        <p>Hi there,</p>
        <p>Your workflow "{{workflowName}}" has completed successfully.</p>
        
        <h3>Results</h3>
        <p>{{results}}</p>
        
        <p>Execution time: {{executionTime}}</p>
        
        <p>Best regards,<br>Lynxier AI Workflow</p>
      `;
    
    default:
      return `
        <h2>Workflow Notification</h2>
        <p>{{content}}</p>
        <p>Best regards,<br>Lynxier AI Workflow</p>
      `;
  }
}

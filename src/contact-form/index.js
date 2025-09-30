const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json'
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validateInput = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  if (!data.subject || data.subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters');
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.push('Message is required');
  }

  return errors;
};

const saveLead = async (leadData) => {
  const params = {
    TableName: DYNAMODB_TABLE,
    Item: leadData
  };

  try {
    await docClient.send(new PutCommand(params));
    console.log('Lead saved to DynamoDB:', leadData.leadId);
    return true;
  } catch (error) {
    console.error('Error saving to DynamoDB:', error);
    throw error;
  }
};

const sendNotificationEmail = async (leadData) => {
  const emailParams = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [RECIPIENT_EMAIL]
    },
    Message: {
      Subject: {
        Data: `New Contact Form Submission: ${leadData.subject}`,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4a90e2; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #4a90e2; }
                .value { margin-top: 5px; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>New Contact Form Submission</h2>
                </div>
                <div class="content">
                  <div class="field">
                    <div class="label">Name:</div>
                    <div class="value">${leadData.name}</div>
                  </div>
                  <div class="field">
                    <div class="label">Email:</div>
                    <div class="value"><a href="mailto:${leadData.email}">${leadData.email}</a></div>
                  </div>
                  ${leadData.phone ? `
                  <div class="field">
                    <div class="label">Phone:</div>
                    <div class="value"><a href="tel:${leadData.phone}">${leadData.phone}</a></div>
                  </div>
                  ` : ''}
                  <div class="field">
                    <div class="label">Subject:</div>
                    <div class="value">${leadData.subject}</div>
                  </div>
                  <div class="field">
                    <div class="label">Message:</div>
                    <div class="value">${leadData.message.replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="field">
                    <div class="label">Submitted:</div>
                    <div class="value">${new Date(leadData.timestamp).toLocaleString()}</div>
                  </div>
                  <div class="field">
                    <div class="label">Lead ID:</div>
                    <div class="value">${leadData.leadId}</div>
                  </div>
                </div>
                <div class="footer">
                  <p>This email was sent from the CreerWebConsulting.com contact form.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `
New Contact Form Submission

Name: ${leadData.name}
Email: ${leadData.email}
${leadData.phone ? `Phone: ${leadData.phone}\n` : ''}Subject: ${leadData.subject}
Message: ${leadData.message}

Submitted: ${new Date(leadData.timestamp).toLocaleString()}
Lead ID: ${leadData.leadId}
          `,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await sesClient.send(new SendEmailCommand(emailParams));
    console.log('Notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

const sendConfirmationEmail = async (leadData) => {
  const emailParams = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [leadData.email]
    },
    Message: {
      Subject: {
        Data: 'Thank you for contacting Creer Web Consulting',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4a90e2; color: white; padding: 30px 20px; text-align: center; }
                .content { background-color: #ffffff; padding: 30px 20px; }
                .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
                .button { display: inline-block; background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                .info-box { background-color: #f0f8ff; border-left: 4px solid #4a90e2; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Thank You for Reaching Out!</h1>
                </div>
                <div class="content">
                  <p>Hi ${leadData.name},</p>
                  
                  <p>Thank you for contacting <strong>Creer Web Consulting</strong>. We've received your message and will get back to you as soon as possible, typically within 24 hours.</p>
                  
                  <div class="info-box">
                    <strong>Your Message Summary:</strong><br>
                    <strong>Subject:</strong> ${leadData.subject}<br>
                    <strong>Submitted:</strong> ${new Date(leadData.timestamp).toLocaleString()}
                  </div>
                  
                  <p>In the meantime, feel free to:</p>
                  <ul>
                    <li>Visit our website: <a href="https://creerwebconsulting.com">creerwebconsulting.com</a></li>
                    <li>Learn more about our services</li>
                    <li>Check out our portfolio</li>
                  </ul>
                  
                  <p>If you have any urgent questions, you can reach us directly at:</p>
                  <p>
                    📧 Email: <a href="mailto:spencercreer@gmail.com">spencercreer@gmail.com</a><br>
                    📞 Phone: <a href="tel:+16025254634">(602) 525-4634</a>
                  </p>
                  
                  <p>We look forward to working with you!</p>
                  
                  <p>Best regards,<br>
                  <strong>Spencer Creer</strong><br>
                  Founder, Creer Web Consulting</p>
                </div>
                <div class="footer">
                  <p>This is an automated confirmation email from Creer Web Consulting.</p>
                  <p>© ${new Date().getFullYear()} Creer Web Consulting. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `
Hi ${leadData.name},

Thank you for contacting Creer Web Consulting. We've received your message and will get back to you as soon as possible, typically within 24 hours.

Your Message Summary:
Subject: ${leadData.subject}
Submitted: ${new Date(leadData.timestamp).toLocaleString()}

If you have any urgent questions, you can reach us directly at:
Email: spencercreer@gmail.com
Phone: (602) 525-4634

We look forward to working with you!

Best regards,
Spencer Creer
Founder, Creer Web Consulting

---
This is an automated confirmation email from Creer Web Consulting.
© ${new Date().getFullYear()} Creer Web Consulting. All rights reserved.
          `,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await sesClient.send(new SendEmailCommand(emailParams));
    console.log('Confirmation email sent to lead');
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    console.log('Parsed body:', body);

    // Validate input
    const validationErrors = validateInput(body);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        })
      };
    }

    // Create lead data
    const leadData = {
      leadId: uuidv4(),
      timestamp: new Date().toISOString(),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone ? body.phone.trim() : null,
      subject: body.subject.trim(),
      message: body.message.trim(),
      status: 'new',
      source: 'website-contact-form',
      emailSent: false
    };

    // Save to DynamoDB
    await saveLead(leadData);

    // Send emails
    let notificationSent = false;
    let confirmationSent = false;
    
    try {
      // Send notification email to business owner
      await sendNotificationEmail(leadData);
      notificationSent = true;
      console.log('Notification email sent to business owner');
    } catch (emailError) {
      console.error('Notification email failed:', emailError);
    }
    
    try {
      // Send confirmation email to lead
      await sendConfirmationEmail(leadData);
      confirmationSent = true;
      console.log('Confirmation email sent to lead');
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
    }
    
    // Update DynamoDB with email status
    leadData.emailSent = notificationSent;
    leadData.confirmationSent = confirmationSent;
    
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: leadData
    }));

    // Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for contacting us! We\'ll get back to you soon.',
        leadId: leadData.leadId
      })
    };

  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'An error occurred. Please try again or email us directly at ' + RECIPIENT_EMAIL,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

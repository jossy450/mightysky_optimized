import { Resend } from "resend";

// Initialize Resend with API key from environment variable
// The user will need to provide this via the webdev_request_secrets tool
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Staff email addresses to notify when a customer service request is created.
 * This can be configured via environment variables or hardcoded for now.
 */
const STAFF_EMAILS = process.env.STAFF_EMAILS?.split(",") || ["support@mightyskytech.com"];

/**
 * Send an email notification to staff when the chatbot cannot answer a question.
 */
export async function notifyStaffOfNewRequest(
  userEmail: string,
  question: string,
  requestId: number
) {
  if (!resend) {
    console.warn("[Email] Resend not configured. Skipping staff notification.");
    return { success: false, error: "Email service not configured" };
  }

  const whatsappLink = `https://wa.me/447438467102?text=${encodeURIComponent(
    `New customer question from ${userEmail}: "${question}"`
  )}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "Mighty Sky Chatbot <noreply@mightyskytech.com>",
      to: STAFF_EMAILS,
      subject: `New Customer Question - Request #${requestId}`,
      html: `
        <h2>New Customer Service Request</h2>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Customer Email:</strong> ${userEmail}</p>
        <p><strong>Question:</strong></p>
        <blockquote>${question}</blockquote>
        <p>The chatbot could not find an answer in the knowledge base.</p>
        <p><a href="${whatsappLink}" style="display: inline-block; padding: 10px 20px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px;">Respond via WhatsApp</a></p>
        <p>Or reply to this email with the answer, and the system will learn it for future use.</p>
      `,
    });

    if (error) {
      console.error("[Email] Failed to send staff notification:", error);
      return { success: false, error };
    }

    console.log("[Email] Staff notification sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("[Email] Exception while sending staff notification:", error);
    return { success: false, error };
  }
}

/**
 * Send an email to the customer with the answer to their question.
 */
export async function sendAnswerToCustomer(
  userEmail: string,
  question: string,
  answer: string
) {
  if (!resend) {
    console.warn("[Email] Resend not configured. Skipping customer response.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Mighty Sky Support <support@mightyskytech.com>",
      to: [userEmail],
      subject: "Answer to Your Question",
      html: `
        <h2>Thank you for your question!</h2>
        <p><strong>Your Question:</strong></p>
        <blockquote>${question}</blockquote>
        <p><strong>Our Answer:</strong></p>
        <p>${answer}</p>
        <hr>
        <p>If you have any further questions, feel free to reach out to us at enquries@mightyskytech.com or call us at 07438467102, 07960653601.</p>
      `,
    });

    if (error) {
      console.error("[Email] Failed to send customer answer:", error);
      return { success: false, error };
    }

    console.log("[Email] Customer answer sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("[Email] Exception while sending customer answer:", error);
    return { success: false, error };
  }
}

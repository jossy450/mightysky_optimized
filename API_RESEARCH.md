# API Research for WhatsApp & Email Integration

## WhatsApp Integration

### Key Findings

Based on research, the **official WhatsApp Business API does NOT support sending messages to WhatsApp groups**. The Groups API was deprecated by WhatsApp in April 2020.

### Available Options

1.  **Twilio Conversations API (Recommended for this project)**
    *   Twilio offers a workaround using their Conversations API to create group chats in WhatsApp.
    *   This is NOT native WhatsApp group messaging but a managed group conversation feature.
    *   Supports up to 50 participants in 24-hour sessions.
    *   Users must join by sending a message first.
    *   **Limitation:** This requires users to opt-in, which doesn't fit the requirement of "sending to a WhatsApp group."

2.  **Unofficial WhatsApp APIs (NOT RECOMMENDED for production)**
    *   Libraries like `Baileys`, `whatsapp-web.js`, or `mywaapi` can interact with WhatsApp using unofficial methods.
    *   These APIs are NOT officially supported and violate WhatsApp's Terms of Service.
    *   Risk of account bans and lack of reliability.

3.  **Alternative Approach: Direct WhatsApp Links**
    *   Instead of sending to a group programmatically, we can generate a WhatsApp link that opens a chat with a specific number.
    *   Format: `https://wa.me/<phone_number>?text=<pre-filled_message>`
    *   This is the approach currently used in the simple chatbot.

### Recommended Solution for This Project

Given the constraints, the best approach is to **send a notification to individual staff members' WhatsApp numbers** using the WhatsApp link approach, rather than attempting to send to a group.

Alternatively, we can use **Email notifications to staff** and provide a WhatsApp link in the email for them to respond.

---

## Email Integration

### Recommended Email Service Providers

1.  **Resend (Recommended)**
    *   Modern, developer-friendly API.
    *   Simple Node.js SDK.
    *   Free tier: 100 emails/day.
    *   Example: `npm install resend`

2.  **SendGrid**
    *   Established provider with robust features.
    *   Free tier: 100 emails/day.
    *   Example: `npm install @sendgrid/mail`

3.  **Nodemailer (Self-hosted SMTP)**
    *   Open-source library for sending emails via SMTP.
    *   Requires an SMTP server (e.g., Gmail, Outlook, or a custom server).
    *   Example: `npm install nodemailer`

### Recommended Solution for This Project

**Use Resend** for its simplicity and modern API. It integrates seamlessly with Node.js and requires minimal configuration.

---

## Final Integration Plan

1.  **WhatsApp Notification:** Use WhatsApp links (`https://wa.me/<number>?text=<message>`) to allow staff to respond. Send email notifications to staff with the WhatsApp link included.
2.  **Email Response to Customer:** Use Resend to send the answer back to the customer's email once a staff member responds.
3.  **Learning Logic:** Store the new Q&A pair in the database for future use.

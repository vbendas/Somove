import { escapeHtml, urlSafe } from "@/lib/html-escape";

interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
}

interface ResendApiResponse {
  id: string;
  error?: { message: string };
}

export class ResendClient {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = "Somove <hello@somove.app>") {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  private async send(params: SendEmailParams): Promise<{ id: string } | { error: string }> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: params.from || this.fromEmail,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      });

      const data: ResendApiResponse = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      return { id: data.id };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Email send failed" };
    }
  }

  async sendBookingConfirmation(params: {
    to: string;
    clientName: string;
    therapistName: string;
    scheduledAt: string;
    duration: number;
    joinUrl: string;
  }): Promise<{ id: string } | { error: string }> {
    const date = new Date(params.scheduledAt);
    const dateStr = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D2A26; font-size: 24px;">Booking Confirmed</h1>
        <p style="color: #6B655E;">Your session with ${escapeHtml(params.therapistName)} has been booked.</p>
        
        <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B655E; font-size: 14px;">Date & Time</p>
          <p style="margin: 0; color: #2D2A26; font-size: 18px; font-weight: 600;">${escapeHtml(dateStr)} at ${escapeHtml(timeStr)}</p>
          <p style="margin: 8px 0 0 0; color: #6B655E; font-size: 14px;">${escapeHtml(String(params.duration))} minutes</p>
        </div>

        <a href="${urlSafe(params.joinUrl)}" style="display: inline-block; background: #A85A2B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Session</a>
        
        <p style="color: #6B655E; font-size: 12px; margin-top: 30px;">
          You can join the session up to 10 minutes before it starts.
        </p>
      </div>
    `;

    return this.send({
      to: params.to,
      subject: `Session confirmed with ${params.therapistName}`,
      html,
    });
  }

  async sendSessionReminder(params: {
    to: string;
    clientName: string;
    therapistName: string;
    scheduledAt: string;
    joinUrl: string;
    minutesUntil: number;
  }): Promise<{ id: string } | { error: string }> {
    const timeStr = new Date(params.scheduledAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D2A26; font-size: 24px;">Session Starting Soon</h1>
        <p style="color: #6B655E;">Your session with ${escapeHtml(params.therapistName)} starts in ${escapeHtml(String(params.minutesUntil))} minutes.</p>
        
        <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #2D2A26; font-size: 18px; font-weight: 600;">Today at ${escapeHtml(timeStr)}</p>
        </div>

        <a href="${urlSafe(params.joinUrl)}" style="display: inline-block; background: #A85A2B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Now</a>
      </div>
    `;

    return this.send({
      to: params.to,
      subject: `Session with ${params.therapistName} starts in ${params.minutesUntil} min`,
      html,
    });
  }

  async sendNewMessage(params: {
    to: string;
    recipientName: string;
    senderName: string;
    messagePreview: string;
    conversationUrl: string;
  }): Promise<{ id: string } | { error: string }> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D2A26; font-size: 24px;">New Message</h1>
        <p style="color: #6B655E;">Hi ${escapeHtml(params.recipientName)},</p>
        <p style="color: #6B655E;">${escapeHtml(params.senderName)} sent you a message:</p>
        <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #2D2A26;">${escapeHtml(params.messagePreview)}</p>
        </div>
        <a href="${urlSafe(params.conversationUrl)}" style="display: inline-block; background: #A85A2B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Message</a>
      </div>
    `;

    return this.send({
      to: params.to,
      subject: `New message from ${params.senderName}`,
      html,
    });
  }

  async sendCancellationNotice(params: {
    to: string;
    recipientName: string;
    sessionDate: string;
    refundStatus: string;
  }): Promise<{ id: string } | { error: string }> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D2A26; font-size: 24px;">Session Cancelled</h1>
        <p style="color: #6B655E;">Hi ${escapeHtml(params.recipientName)},</p>
        <p style="color: #6B655E;">Your session scheduled for ${escapeHtml(params.sessionDate)} has been cancelled.</p>
        ${params.refundStatus === "refunded" ? '<p style="color: #557557; font-weight: 600;">A refund has been processed.</p>' : ""}
      </div>
    `;

    return this.send({
      to: params.to,
      subject: "Session cancelled",
      html,
    });
  }

  async sendInvite(params: {
    to: string;
    inviteUrl: string;
    role: string;
    invitedBy?: string;
  }): Promise<{ id: string } | { error: string }> {
    const roleLabel = params.role === 'therapist' ? 'Therapist' : 'Client';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2D2A26; font-size: 24px;">You've been invited to Somove</h1>
        <p style="color: #6B655E;">You have been invited to join as a ${escapeHtml(roleLabel)} on Somove.</p>
        
        <div style="margin: 30px 0;">
          <a href="${urlSafe(params.inviteUrl)}" style="display: inline-block; background: #A85A2B; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept Invitation</a>
        </div>

        <p style="color: #6B655E; font-size: 14px;">This link will expire in 7 days.</p>
        ${params.invitedBy ? `<p style="color: #6B655E; font-size: 12px;">Invited by ${escapeHtml(params.invitedBy)}</p>` : ''}
      </div>
    `;

    return this.send({
      to: params.to,
      subject: `Invitation to join Somove as ${roleLabel}`,
      html,
    });
  }
}

let _client: ResendClient | null = null;

export function getResendClient(): ResendClient | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_client) {
    _client = new ResendClient(apiKey);
  }
  return _client;
}

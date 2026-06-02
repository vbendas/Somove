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
        <p style="color: #9A9590;">Your session with ${params.therapistName} has been booked.</p>
        
        <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #9A9590; font-size: 14px;">Date & Time</p>
          <p style="margin: 0; color: #2D2A26; font-size: 18px; font-weight: 600;">${dateStr} at ${timeStr}</p>
          <p style="margin: 8px 0 0 0; color: #9A9590; font-size: 14px;">${params.duration} minutes</p>
        </div>

        <a href="${params.joinUrl}" style="display: inline-block; background: #D4A574; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Session</a>
        
        <p style="color: #9A9590; font-size: 12px; margin-top: 30px;">
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
        <p style="color: #9A9590;">Your session with ${params.therapistName} starts in ${params.minutesUntil} minutes.</p>
        
        <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #2D2A26; font-size: 18px; font-weight: 600;">Today at ${timeStr}</p>
        </div>

        <a href="${params.joinUrl}" style="display: inline-block; background: #D4A574; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Now</a>
      </div>
    `;

    return this.send({
      to: params.to,
      subject: `Session with ${params.therapistName} starts in ${params.minutesUntil} min`,
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
        <p style="color: #9A9590;">Hi ${params.recipientName},</p>
        <p style="color: #9A9590;">Your session scheduled for ${params.sessionDate} has been cancelled.</p>
        ${params.refundStatus === "refunded" ? '<p style="color: #8BA888; font-weight: 600;">A refund has been processed.</p>' : ""}
      </div>
    `;

    return this.send({
      to: params.to,
      subject: "Session cancelled",
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

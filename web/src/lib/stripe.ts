import Stripe from "stripe";
import type {
  StripeCheckoutResult,
  StripeRefundResult,
  StripeTestResult,
  CreateCheckoutParams,
  StripeApiResponse,
} from "./stripe.types";

export class StripeClient {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async testConnection(): Promise<StripeApiResponse<StripeTestResult>> {
    try {
      await this.stripe.balance.retrieve();
      return {
        data: {
          success: true,
          accountId: "connected",
          email: undefined,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Failed to connect to Stripe",
        },
      };
    }
  }

  async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<StripeApiResponse<StripeCheckoutResult>> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: params.lineItems.map((item) => ({
          price_data: {
            currency: item.priceData.currency,
            product_data: {
              name: item.priceData.productData.name,
              description: item.priceData.productData.description,
            },
            unit_amount: item.priceData.unitAmount,
          },
          quantity: item.quantity,
        })),
        mode: params.mode,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: params.metadata,
      });

      if (!session.url) {
        return {
          data: null,
          error: { message: "No checkout URL returned" },
        };
      }

      return {
        data: {
          sessionId: session.id,
          url: session.url,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Failed to create checkout session",
        },
      };
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<StripeApiResponse<StripeRefundResult>> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount,
      });

      return {
        data: {
          refundId: refund.id,
          status: refund.status || "unknown",
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : "Failed to create refund",
        },
      };
    }
  }

  verifyWebhook(
    body: string,
    signature: string,
    secret: string
  ): Stripe.Event | null {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      return null;
    }
  }
}

export type { StripeApiResponse };

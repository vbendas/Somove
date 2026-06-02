import Stripe from "stripe";
import type {
  StripeCheckoutResult,
  StripeRefundResult,
  StripeTestResult,
  CreateCheckoutParams,
  CreateConnectedCheckoutParams,
  AccountStatusResult,
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
        return { data: null, error: { message: "No checkout URL returned" } };
      }

      return { data: { sessionId: session.id, url: session.url }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to create checkout session" },
      };
    }
  }

  async createConnectedCheckout(
    params: CreateConnectedCheckoutParams
  ): Promise<StripeApiResponse<StripeCheckoutResult>> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: params.currency,
              product_data: {
                name: params.productName,
                description: params.productDescription,
              },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: params.applicationFeeAmount,
          transfer_data: {
            destination: params.connectedAccountId,
          },
          metadata: params.metadata,
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: params.metadata,
      });

      if (!session.url) {
        return { data: null, error: { message: "No checkout URL returned" } };
      }

      return { data: { sessionId: session.id, url: session.url }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to create connected checkout" },
      };
    }
  }

  async createConnectedAccount(
    email: string,
    country: string = "DE"
  ): Promise<StripeApiResponse<{ accountId: string }>> {
    try {
      const account = await this.stripe.accounts.create({
        type: "express",
        email,
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });

      return { data: { accountId: account.id }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to create connected account" },
      };
    }
  }

  async createOnboardingLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<StripeApiResponse<{ url: string }>> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });

      return { data: { url: accountLink.url }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to create onboarding link" },
      };
    }
  }

  async getAccountStatus(
    accountId: string
  ): Promise<StripeApiResponse<AccountStatusResult>> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        data: {
          chargesEnabled: account.charges_enabled ?? false,
          payoutsEnabled: account.payouts_enabled ?? false,
          requirements: {
            currently_due: account.requirements?.currently_due || [],
            eventually_due: account.requirements?.eventually_due || [],
            past_due: account.requirements?.past_due || [],
          },
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to get account status" },
      };
    }
  }

  async createDashboardLink(
    accountId: string
  ): Promise<StripeApiResponse<{ url: string }>> {
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return { data: { url: loginLink.url }, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : "Failed to create dashboard link" },
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
        error: { message: err instanceof Error ? err.message : "Failed to create refund" },
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

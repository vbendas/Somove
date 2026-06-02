export interface StripeCheckoutResult {
  sessionId: string;
  url: string;
}

export interface StripeRefundResult {
  refundId: string;
  status: string;
}

export interface StripeTestResult {
  success: boolean;
  accountId?: string;
  email?: string;
  error?: string;
}

export interface CreateCheckoutParams {
  lineItems: Array<{
    priceData: {
      currency: string;
      productData: {
        name: string;
        description?: string;
      };
      unitAmount: number;
    };
    quantity: number;
  }>;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CreateConnectedCheckoutParams {
  amount: number;
  currency: string;
  connectedAccountId: string;
  applicationFeeAmount: number;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  productName: string;
  productDescription?: string;
}

export interface AccountStatusResult {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export interface StripeApiError {
  message: string;
  statusCode?: number;
}

export interface StripeApiResponse<T> {
  data: T | null;
  error: StripeApiError | null;
}

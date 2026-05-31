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

export interface StripeApiError {
  message: string;
  statusCode?: number;
}

export interface StripeApiResponse<T> {
  data: T | null;
  error: StripeApiError | null;
}

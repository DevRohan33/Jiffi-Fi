// types.ts
export type PlanType = 'monthly' | 'sixMonth' | 'yearly' | 'demo';

export interface Plan {
  title: string;
  price: string;
  duration: string;
  features: string[];
  tag?: string;
  planType: PlanType;
}

export interface PaymentResponse {
  paymentLink: string;
  orderId: string;
  planType: PlanType;
}

export interface PaymentVerificationResponse {
  success: boolean;
  planType?: PlanType;
  message?: string;
}
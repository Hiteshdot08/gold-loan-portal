export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields: FieldError[];
  extra: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields: FieldError[] = [],
    extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.extra = extra;
  }
}

export interface Plan {
  id: string;
  name: string;
  annualInterestRate: number;
  tenureMonths: number;
  maxLtv: number;
  repaymentType: string;
}

export interface PlanQuote {
  planId: string;
  planName: string;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
}

export interface QuoteResponse {
  netWeightGrams: number;
  karat: number;
  quotes: PlanQuote[];
}

export interface LeadInput {
  name: string;
  mobileNumber: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  planId: string;
}

export interface LeadResult {
  applicationId: string;
  status: string;
  planId: string;
  netWeightGrams: number;
  grossWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  createdAt: string;
}

export interface LeadRow {
  applicationId: string;
  name: string;
  mobileNumber: string;
  netWeightGrams: number;
  grossWeightGrams: number;
  karat: number;
  planId: string;
  goldValue: number;
  eligibleLoan: number;
  status: string;
  createdAt: string;
}

// Gemini conversation history: the client just stores it and sends it back.
export interface ChatMessage {
  role: 'user' | 'model';
  parts: unknown[];
}

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
  pendingApplication?: Record<string, unknown>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection.');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    const { code, message, fields, ...extra } = e ?? {};
    throw new ApiError(
      res.status,
      code ?? 'UNKNOWN_ERROR',
      message ?? 'Something went wrong',
      fields ?? [],
      extra
    );
  }
  return body as T;
}

const post = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) });

export const getPlans = () => request<Plan[]>('/api/v1/loan-schemes');

export const getQuotes = (data: {
  netWeightGrams: number;
  grossWeightGrams: number;
  karat: number;
}) => post<QuoteResponse>('/api/v1/quotes', data);

export const createLead = (data: LeadInput) => post<LeadResult>('/api/v1/leads', data);

export const getLeads = (planId?: string) =>
  request<LeadRow[]>(
    planId ? `/api/v1/leads?planId=${encodeURIComponent(planId)}` : '/api/v1/leads'
  );

export const sendChat = (message: string, history: ChatMessage[]) =>
  post<ChatResponse>('/api/v1/chat', { message, history });

export const confirmChat = (
  history: ChatMessage[],
  application: Record<string, unknown>,
  confirmed: boolean
) => post<ChatResponse>('/api/v1/chat/confirm', { history, application, confirmed });

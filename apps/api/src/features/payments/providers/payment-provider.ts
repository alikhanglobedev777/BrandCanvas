export interface PaymentProvider { readonly code: string; create(input:{paymentId:string;amountMinor:number;currency:string}):Promise<{status:"pending"|"paid";providerReference?:string}>; refund(input:{paymentId:string;amountMinor:number;reason?:string}):Promise<{status:"pending"|"refunded"}>; }
export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

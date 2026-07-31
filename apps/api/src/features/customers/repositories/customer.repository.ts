import type { CustomerAddressDto, CustomerAddressInputDto, CustomerProfileDto, UpdateCustomerProfileDto } from "../dto";
export interface CustomerAuthRecord extends CustomerProfileDto { passwordHash: string; storeId: string; status: "active" | "blocked"; }
export abstract class CustomerRepository {
  abstract findByEmail(storeId: string, email: string): Promise<CustomerAuthRecord | null>;
  abstract findById(storeId: string, customerId: string): Promise<CustomerProfileDto | null>;
  abstract create(input: { storeId: string; email: string; passwordHash: string; firstName: string; lastName: string; phone?: string; marketingConsent: boolean }): Promise<CustomerProfileDto | "duplicate">;
  abstract updateProfile(storeId: string, customerId: string, input: UpdateCustomerProfileDto): Promise<CustomerProfileDto | null>;
  abstract createSession(input: { customerId: string; storeId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ipAddress?: string; rotatedFromId?: string }): Promise<string>;
  abstract revokeSession(sessionId: string): Promise<void>;
  abstract createToken(input: { customerId: string; type: "email_verification" | "password_reset"; tokenHash: string; expiresAt: Date }): Promise<void>;
  abstract consumePasswordReset(tokenHash: string, passwordHash: string): Promise<boolean>;
  abstract mergeGuestCart(input: { storeId: string; customerId: string; guestTokenHash?: string }): Promise<void>;
  abstract listAddresses(storeId: string, customerId: string): Promise<CustomerAddressDto[]>;
  abstract createAddress(storeId: string, customerId: string, input: CustomerAddressInputDto): Promise<CustomerAddressDto>;
  abstract updateAddress(storeId: string, customerId: string, addressId: string, input: CustomerAddressInputDto): Promise<CustomerAddressDto | null>;
  abstract deleteAddress(storeId: string, customerId: string, addressId: string): Promise<boolean>;
}

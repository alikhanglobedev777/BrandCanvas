import { randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PasswordService } from "../../auth/services";
import { CreateStoreDto, CreateStoreResponseDto, StoreListResponseDto, StoreQueryDto, StoreResponseDto, StoreStatusCountDto, UpdateStoreStatusDto } from "../dto";
import { StoreMapper } from "../mappers";
import { StoreRepository } from "../repositories";

@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly passwordService: PasswordService,
  ) {}

  getSummary(): Promise<StoreStatusCountDto> {
    return this.storeRepository.getSummary();
  }

  async findMany(query: StoreQueryDto): Promise<StoreListResponseDto> {
    const result = await this.storeRepository.findMany({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
    });
    return {
      items: result.items.map(StoreMapper.toResponse),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    };
  }

  async findOne(storeId: string): Promise<StoreResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundException("Store was not found.");
    return StoreMapper.toResponse(store);
  }

  async create(input: CreateStoreDto): Promise<CreateStoreResponseDto> {
    const temporaryPassword = this.generateTemporaryPassword();
    try {
      const store = await this.storeRepository.createWithOwner({
        sellerName: input.sellerName.trim(),
        sellerEmail: input.sellerEmail.toLowerCase(),
        passwordHash: await this.passwordService.hash(temporaryPassword),
        storeName: input.storeName.trim(),
        slug: input.subdomain,
        subdomain: input.subdomain,
        status: input.status,
      });
      return { store: StoreMapper.toResponse(store), temporaryPassword };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("The seller email, store slug, or subdomain is already in use.");
      }
      throw error;
    }
  }

  async updateStatus(storeId: string, input: UpdateStoreStatusDto, changedBy: string): Promise<StoreResponseDto> {
    if (["inactive", "suspended"].includes(input.status) && !input.reason?.trim()) {
      throw new BadRequestException("A reason is required when deactivating or suspending a store.");
    }
    const store = await this.storeRepository.updateStatus({
      storeId,
      status: input.status,
      ...(input.reason ? { reason: input.reason.trim() } : {}),
      changedBy,
    });
    if (!store) throw new NotFoundException("Store was not found.");
    return StoreMapper.toResponse(store);
  }

  private generateTemporaryPassword(): string {
    return `Bc!${randomBytes(12).toString("base64url")}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505";
  }
}

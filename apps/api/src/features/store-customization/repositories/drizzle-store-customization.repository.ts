import { Injectable } from "@nestjs/common";
import {
  storeAssets,
  storeMembers,
  storeSettings,
  stores,
  storeThemeConfigurations,
} from "@brandcanvas/database";
import { and, desc, eq, inArray, max, ne, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type {
  StoreAssetEntity,
  StoreSettingsEntity,
  StoreThemeEntity,
} from "../entities";
import {
  StoreCustomizationRepository,
  type RemoveAssetResult,
  type ThemePersistenceInput,
  type UpdateSettingsPersistenceInput,
  type UpsertAssetPersistenceInput,
} from "./store-customization.repository";

@Injectable()
export class DrizzleStoreCustomizationRepository implements StoreCustomizationRepository {
  constructor(private readonly database: DatabaseService) {}

  async findSellerAccess(userId: string, storeId: string) {
    const [row] = await this.database.db
      .select({
        storeId: stores.id,
        status: stores.status,
        memberRole: storeMembers.role,
      })
      .from(storeMembers)
      .innerJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(
        and(eq(storeMembers.userId, userId), eq(storeMembers.storeId, storeId)),
      )
      .limit(1);
    return row ?? null;
  }

  async findSettings(storeId: string): Promise<StoreSettingsEntity | null> {
    const [row] = await this.database.db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, storeId))
      .limit(1);
    return row ?? null;
  }

  async updateSettings(
    storeId: string,
    input: UpdateSettingsPersistenceInput,
  ): Promise<StoreSettingsEntity | null> {
    const [row] = await this.database.db
      .update(storeSettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(storeSettings.storeId, storeId))
      .returning();
    return row ?? null;
  }

  async findDraft(storeId: string): Promise<StoreThemeEntity | null> {
    return this.findTheme(storeId, "draft");
  }

  async findPublished(storeId: string): Promise<StoreThemeEntity | null> {
    return this.findTheme(storeId, "published");
  }

  async findPublicPublishedBySlug(
    slug: string,
  ): Promise<StoreThemeEntity | null> {
    const [row] = await this.database.db
      .select({ theme: storeThemeConfigurations })
      .from(storeThemeConfigurations)
      .innerJoin(stores, eq(stores.id, storeThemeConfigurations.storeId))
      .where(
        and(
          eq(stores.slug, slug),
          eq(stores.status, "active"),
          eq(storeThemeConfigurations.lifecycle, "published"),
        ),
      )
      .limit(1);
    return row?.theme ?? null;
  }

  async saveDraft(
    storeId: string,
    input: ThemePersistenceInput,
  ): Promise<StoreThemeEntity | null> {
    const [row] = await this.database.db
      .update(storeThemeConfigurations)
      .set({
        ...input,
        revision: sql`${storeThemeConfigurations.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storeThemeConfigurations.storeId, storeId),
          eq(storeThemeConfigurations.lifecycle, "draft"),
        ),
      )
      .returning();
    return row ?? null;
  }

  async publishDraft(storeId: string): Promise<StoreThemeEntity | null> {
    return this.database.db.transaction(async (tx) => {
      const [draft] = await tx
        .select()
        .from(storeThemeConfigurations)
        .where(
          and(
            eq(storeThemeConfigurations.storeId, storeId),
            eq(storeThemeConfigurations.lifecycle, "draft"),
          ),
        )
        .limit(1)
        .for("update");
      if (!draft) return null;

      const [current] = await tx
        .select()
        .from(storeThemeConfigurations)
        .where(
          and(
            eq(storeThemeConfigurations.storeId, storeId),
            eq(storeThemeConfigurations.lifecycle, "published"),
          ),
        )
        .limit(1)
        .for("update");
      const [versionRow] = await tx
        .select({ value: max(storeThemeConfigurations.publishedVersion) })
        .from(storeThemeConfigurations)
        .where(eq(storeThemeConfigurations.storeId, storeId));
      const nextVersion = Number(versionRow?.value ?? 0) + 1;
      const now = new Date();

      if (current) {
        await tx
          .update(storeThemeConfigurations)
          .set({ lifecycle: "archived", updatedAt: now })
          .where(eq(storeThemeConfigurations.id, current.id));
      }

      const [published] = await tx
        .insert(storeThemeConfigurations)
        .values({
          storeId,
          lifecycle: "published",
          revision: draft.revision,
          publishedVersion: nextVersion,
          ...this.themeValues(draft),
          publishedAt: now,
        })
        .returning();
      return published ?? null;
    });
  }

  async listPublishedVersions(storeId: string): Promise<StoreThemeEntity[]> {
    return this.database.db
      .select()
      .from(storeThemeConfigurations)
      .where(
        and(
          eq(storeThemeConfigurations.storeId, storeId),
          inArray(storeThemeConfigurations.lifecycle, [
            "published",
            "archived",
          ]),
        ),
      )
      .orderBy(desc(storeThemeConfigurations.publishedVersion));
  }

  async rollback(
    storeId: string,
    version: number,
  ): Promise<StoreThemeEntity | null> {
    return this.database.db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(storeThemeConfigurations)
        .where(
          and(
            eq(storeThemeConfigurations.storeId, storeId),
            eq(storeThemeConfigurations.lifecycle, "archived"),
            eq(storeThemeConfigurations.publishedVersion, version),
          ),
        )
        .limit(1)
        .for("update");
      if (!target) return null;

      const [current] = await tx
        .select()
        .from(storeThemeConfigurations)
        .where(
          and(
            eq(storeThemeConfigurations.storeId, storeId),
            eq(storeThemeConfigurations.lifecycle, "published"),
          ),
        )
        .limit(1)
        .for("update");
      const [versionRow] = await tx
        .select({ value: max(storeThemeConfigurations.publishedVersion) })
        .from(storeThemeConfigurations)
        .where(eq(storeThemeConfigurations.storeId, storeId));
      const nextVersion = Number(versionRow?.value ?? 0) + 1;
      const now = new Date();

      if (current) {
        await tx
          .update(storeThemeConfigurations)
          .set({ lifecycle: "archived", updatedAt: now })
          .where(eq(storeThemeConfigurations.id, current.id));
      }

      const [published] = await tx
        .insert(storeThemeConfigurations)
        .values({
          storeId,
          lifecycle: "published",
          revision: target.revision,
          publishedVersion: nextVersion,
          ...this.themeValues(target),
          publishedAt: now,
        })
        .returning();
      return published ?? null;
    });
  }

  async upsertAsset(
    input: UpsertAssetPersistenceInput,
  ): Promise<StoreAssetEntity | null> {
    return this.database.db.transaction(async (tx) => {
      if (input.id) {
        const [existing] = await tx
          .select({ id: storeAssets.id })
          .from(storeAssets)
          .where(
            and(
              eq(storeAssets.id, input.id),
              eq(storeAssets.storeId, input.storeId),
            ),
          )
          .limit(1)
          .for("update");
        if (!existing) return null;
      }

      if (input.isCurrent) {
        const condition = input.id
          ? and(
              eq(storeAssets.storeId, input.storeId),
              eq(storeAssets.category, input.category),
              ne(storeAssets.id, input.id),
            )
          : and(
              eq(storeAssets.storeId, input.storeId),
              eq(storeAssets.category, input.category),
            );
        await tx
          .update(storeAssets)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(condition);
      }

      const values = {
        category: input.category,
        storageProvider: input.storageProvider,
        storageKey: input.storageKey,
        publicUrl: input.publicUrl,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        isCurrent: input.isCurrent,
      };

      if (input.id) {
        const [updated] = await tx
          .update(storeAssets)
          .set({ ...values, updatedAt: new Date() })
          .where(
            and(
              eq(storeAssets.id, input.id),
              eq(storeAssets.storeId, input.storeId),
            ),
          )
          .returning();
        return updated ?? null;
      }

      const [created] = await tx
        .insert(storeAssets)
        .values({ storeId: input.storeId, ...values })
        .returning();
      return created ?? null;
    });
  }

  async removeUnusedAsset(
    storeId: string,
    assetId: string,
  ): Promise<RemoveAssetResult> {
    return this.database.db.transaction(async (tx) => {
      const [asset] = await tx
        .select({ id: storeAssets.id, isCurrent: storeAssets.isCurrent })
        .from(storeAssets)
        .where(
          and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)),
        )
        .limit(1)
        .for("update");
      if (!asset) return "not_found";
      if (asset.isCurrent) return "in_use";
      await tx
        .delete(storeAssets)
        .where(
          and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)),
        );
      return "removed";
    });
  }

  private async findTheme(
    storeId: string,
    lifecycle: "draft" | "published",
  ): Promise<StoreThemeEntity | null> {
    const [row] = await this.database.db
      .select()
      .from(storeThemeConfigurations)
      .where(
        and(
          eq(storeThemeConfigurations.storeId, storeId),
          eq(storeThemeConfigurations.lifecycle, lifecycle),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  private themeValues(theme: StoreThemeEntity): ThemePersistenceInput {
    return {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      headerLayout: theme.headerLayout,
      headerSticky: theme.headerSticky,
      headerShowLogo: theme.headerShowLogo,
      footerShowContact: theme.footerShowContact,
      footerText: theme.footerText,
    };
  }
}

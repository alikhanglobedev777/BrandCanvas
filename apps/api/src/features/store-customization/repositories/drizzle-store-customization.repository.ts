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
  type SaveThemeDraftPersistenceInput,
  type ThemePersistenceInput,
  type ThemeWriteResult,
  type UpdateSettingsPersistenceInput,
  type CreateCurrentAssetPersistenceInput,
  type ReplaceCurrentAssetResult,
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
    input: SaveThemeDraftPersistenceInput,
  ): Promise<ThemeWriteResult> {
    const { expectedRevision, ...themeValues } = input;
    const [row] = await this.database.db
      .update(storeThemeConfigurations)
      .set({
        ...themeValues,
        revision: sql`${storeThemeConfigurations.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storeThemeConfigurations.storeId, storeId),
          eq(storeThemeConfigurations.lifecycle, "draft"),
          eq(storeThemeConfigurations.revision, expectedRevision),
        ),
      )
      .returning();

    if (row) return row;
    return (await this.findDraft(storeId)) ? "revision_conflict" : null;
  }

  async publishDraft(
    storeId: string,
    expectedRevision: number,
  ): Promise<ThemeWriteResult> {
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
      if (draft.revision !== expectedRevision) return "revision_conflict";

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

  async listCurrentAssets(storeId: string): Promise<StoreAssetEntity[]> {
    return this.database.db
      .select()
      .from(storeAssets)
      .where(
        and(
          eq(storeAssets.storeId, storeId),
          eq(storeAssets.isCurrent, true),
          inArray(storeAssets.category, ["logo", "favicon"]),
        ),
      )
      .orderBy(storeAssets.category);
  }

  async replaceCurrentAsset(
    input: CreateCurrentAssetPersistenceInput,
  ): Promise<ReplaceCurrentAssetResult> {
    return this.database.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${input.storeId}:${input.category}`}))`,
      );

      const [replaced] = await tx
        .select()
        .from(storeAssets)
        .where(
          and(
            eq(storeAssets.storeId, input.storeId),
            eq(storeAssets.category, input.category),
            eq(storeAssets.isCurrent, true),
          ),
        )
        .limit(1)
        .for("update");

      if (replaced) {
        await tx.delete(storeAssets).where(eq(storeAssets.id, replaced.id));
      }

      const [asset] = await tx
        .insert(storeAssets)
        .values({
          ...input,
          isCurrent: true,
        })
        .returning();

      if (!asset) {
        throw new Error("Store asset insert did not return a record.");
      }

      if (input.category === "logo") {
        await tx
          .update(stores)
          .set({ logoUrl: input.publicUrl, updatedAt: new Date() })
          .where(eq(stores.id, input.storeId));
      }

      return { asset, replaced: replaced ?? null };
    });
  }

  async deleteAsset(
    storeId: string,
    assetId: string,
  ): Promise<StoreAssetEntity | null> {
    return this.database.db.transaction(async (tx) => {
      const [asset] = await tx
        .select()
        .from(storeAssets)
        .where(
          and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)),
        )
        .limit(1)
        .for("update");

      if (!asset) return null;

      await tx
        .delete(storeAssets)
        .where(
          and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)),
        );

      if (asset.category === "logo" && asset.isCurrent) {
        await tx
          .update(stores)
          .set({ logoUrl: null, updatedAt: new Date() })
          .where(eq(stores.id, storeId));
      }

      return asset;
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
      headerStyle: theme.headerStyle,
      headerSticky: theme.headerSticky,
      headerShowLogo: theme.headerShowLogo,
      buttonRadius: theme.buttonRadius,
      cardRadius: theme.cardRadius,
      productCardStyle: theme.productCardStyle,
      footerStyle: theme.footerStyle,
      footerShowContact: theme.footerShowContact,
      footerText: theme.footerText,
    };
  }
}

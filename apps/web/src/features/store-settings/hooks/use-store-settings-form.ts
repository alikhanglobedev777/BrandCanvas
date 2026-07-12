"use client";

import type { StoreSettingsResponseDto } from "@brandcanvas/contracts";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { StoreSettingsFormValues } from "../model/store-settings-form-values";
import {
  createEmptyStoreSettingsFormValues,
  createStoreSettingsFormValues,
} from "../lib/store-settings-form";
import { useUnsavedChangesProtection } from "../lib/use-unsaved-changes-protection";

export function useStoreSettingsForm(settings?: StoreSettingsResponseDto) {
  const form = useForm<StoreSettingsFormValues>({
    defaultValues: createEmptyStoreSettingsFormValues(),
  });

  useEffect(() => {
    if (settings) {
      form.reset(createStoreSettingsFormValues(settings));
    }
  }, [form, settings]);

  useUnsavedChangesProtection(form.formState.isDirty);

  return form;
}

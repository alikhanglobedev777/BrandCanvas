"use client";

import type { StoreThemeResponseDto } from "@brandcanvas/contracts";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createStoreBrandingFormValues } from "../lib/store-settings-form";
import type { StoreBrandingFormValues } from "../model/store-branding-options";
import { useUnsavedChangesProtection } from "../lib/use-unsaved-changes-protection";

export function useStoreBrandingForm(theme?: StoreThemeResponseDto | null) {
  const form = useForm<StoreBrandingFormValues>({
    defaultValues: createStoreBrandingFormValues(theme),
  });

  useEffect(() => {
    form.reset(createStoreBrandingFormValues(theme));
  }, [form, theme]);

  useUnsavedChangesProtection(form.formState.isDirty);

  return form;
}

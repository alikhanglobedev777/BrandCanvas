"use client";
import type { ProductDetailsResponseDto } from "@brandcanvas/contracts";
import { AppButton, EmptyState } from "@brandcanvas/ui";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
export function ProductOptionsEditor({
  product,
  disabled,
  onAddOption,
  onDeleteOption,
  onAddValue,
  onDeleteValue,
}: {
  product: ProductDetailsResponseDto;
  disabled: boolean;
  onAddOption: (name: string, position: number) => void;
  onDeleteOption: (id: string) => void;
  onAddValue: (optionId: string, value: string, position: number) => void;
  onDeleteValue: (id: string) => void;
}) {
  const [optionName, setOptionName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Options and values</Typography>
        {product.options.length === 0 ? (
          <EmptyState
            title="No options"
            description="Add options such as Size or Color before creating combinations."
          />
        ) : (
          product.options.map((option) => (
            <Paper key={option.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {option.name}
                  </Typography>
                  <AppButton
                    variant="text"
                    disabled={disabled}
                    onClick={() => onDeleteOption(option.id)}
                  >
                    Delete
                  </AppButton>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {option.values.map((value) => (
                    <AppButton
                      key={value.id}
                      variant="outlined"
                      disabled={disabled}
                      onClick={() => onDeleteValue(value.id)}
                    >
                      {value.value} ×
                    </AppButton>
                  ))}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    size="small"
                    label={`Add ${option.name} value`}
                    value={values[option.id] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [option.id]: event.target.value,
                      }))
                    }
                  />
                  <AppButton
                    variant="outlined"
                    disabled={disabled || !(values[option.id] ?? "").trim()}
                    onClick={() => {
                      onAddValue(
                        option.id,
                        values[option.id]!.trim(),
                        option.values.length,
                      );
                      setValues((current) => ({ ...current, [option.id]: "" }));
                    }}
                  >
                    Add value
                  </AppButton>
                </Stack>
              </Stack>
            </Paper>
          ))
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            label="New option"
            value={optionName}
            onChange={(event) => setOptionName(event.target.value)}
            disabled={product.options.length >= 3}
          />
          <AppButton
            disabled={
              disabled || product.options.length >= 3 || !optionName.trim()
            }
            onClick={() => {
              onAddOption(optionName.trim(), product.options.length);
              setOptionName("");
            }}
          >
            Add option
          </AppButton>
        </Stack>
      </Stack>
    </Paper>
  );
}

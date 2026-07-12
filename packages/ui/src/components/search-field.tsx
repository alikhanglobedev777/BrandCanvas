"use client";

import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

export type SearchFieldProps = Omit<TextFieldProps, "type">;

export function SearchField(props: SearchFieldProps) {
  return (
    <TextField
      placeholder="Search"
      {...props}
      slotProps={{
        ...props.slotProps,
        input: {
          startAdornment: <InputAdornment position="start">⌕</InputAdornment>,
          ...props.slotProps?.input,
        },
      }}
    />
  );
}

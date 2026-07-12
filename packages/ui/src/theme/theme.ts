"use client";

import { createTheme } from "@mui/material/styles";

export const brandCanvasTheme = createTheme({
  cssVariables: {
    cssVarPrefix: "brandcanvas",
    colorSchemeSelector: "data-brandcanvas-color-scheme",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#4F46E5" },
        secondary: { main: "#0F766E" },
        background: {
          default: "#F7F8FC",
          paper: "#FFFFFF",
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 750 },
    h4: { fontWeight: 750 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, borderRadius: 10 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid", borderColor: "var(--brandcanvas-palette-divider)" },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
    MuiDialog: {
      defaultProps: { fullWidth: true },
    },
  },
});

"use client";

import type { PublicThemeDto } from "@brandcanvas/contracts";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useMemo } from "react";

const fontFamily: Record<string, string> = {
  system_sans: "system-ui, sans-serif",
  system_serif: "Georgia, serif",
  georgia: "Georgia, serif",
  arial: "Arial, sans-serif",
  verdana: "Verdana, sans-serif",
};

export function StorefrontThemeProvider({ theme, children }: { theme: PublicThemeDto; children: ReactNode }) {
  const muiTheme = useMemo(() => createTheme({
    palette: { primary: { main: theme.primaryColor }, secondary: { main: theme.secondaryColor }, background: { default: theme.backgroundColor }, text: { primary: theme.textColor } },
    typography: { fontFamily: fontFamily[theme.bodyFont] ?? fontFamily.system_sans, h1: { fontFamily: fontFamily[theme.headingFont] ?? fontFamily.system_sans }, h2: { fontFamily: fontFamily[theme.headingFont] ?? fontFamily.system_sans }, h3: { fontFamily: fontFamily[theme.headingFont] ?? fontFamily.system_sans } },
    shape: { borderRadius: theme.cardRadius },
    components: { MuiButton: { styleOverrides: { root: { borderRadius: theme.buttonRadius } } } },
  }), [theme]);
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}

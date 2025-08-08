// app/layout.tsx veya _app.tsx dosyan (Next App Router ile!)
"use client";

import { ReactNode } from "react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

// Modern ve şık tema
const myTheme = createTheme({
  palette: {
    mode: "light",
    primary: { 
      main: "#2563eb", // Modern mavi
      light: "#3b82f6",
      dark: "#1d4ed8"
    },
    secondary: { 
      main: "#f59e0b", // Amber accent
      light: "#fbbf24",
      dark: "#d97706"
    },
    background: {
      default: "#f8fafc", // Çok açık gri
      paper: "#ffffff", // Beyaz kartlar
    },
    text: { 
      primary: "#1e293b", 
      secondary: "#64748b" 
    },
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    info: { main: "#06b6d4" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: "2.5rem" },
    h2: { fontWeight: 600, fontSize: "2rem" },
    h3: { fontWeight: 600, fontSize: "1.5rem" },
    h4: { fontWeight: 600, fontSize: "1.25rem" },
    h5: { fontWeight: 500, fontSize: "1.125rem" },
    h6: { fontWeight: 500, fontSize: "1rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider theme={myTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

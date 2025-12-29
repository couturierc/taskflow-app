/**
 * Theme constants and color palette.
 */

export type ColorScheme = "light" | "dark";

export const Colors = {
  light: {
    primary: "#E44332",
    background: "#ffffff",
    surface: "#f5f5f5",
    foreground: "#11181C",
    muted: "#687076",
    border: "#E5E7EB",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    // Aliases for compatibility
    text: "#11181C",
    tint: "#E44332",
    icon: "#687076",
  },
  dark: {
    primary: "#E44332",
    background: "#1a1a1a",
    surface: "#2a2a2a",
    foreground: "#ECEDEE",
    muted: "#9BA1A6",
    border: "#3f3f46",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    // Aliases for compatibility
    text: "#ECEDEE",
    tint: "#E44332",
    icon: "#9BA1A6",
  },
};

export type ThemeColorPalette = typeof Colors.light;
export type ThemeColors = keyof ThemeColorPalette;

export const SchemeColors = {
  light: Colors.light,
  dark: Colors.dark,
};

export const Fonts = {
  regular: "System",
  medium: "System",
  bold: "System",
};

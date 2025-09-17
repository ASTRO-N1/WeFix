"use client";
import { theme as baseTheme } from "@chakra-ui/theme";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = {
  ...baseTheme,
  config, // Add config here
  fonts: {
    ...baseTheme.fonts,
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
};

export default theme;

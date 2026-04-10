import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark UI palette — WoofJot design system
        page:     "#0B1426",   // page background
        surface:  "#0F1E35",   // card / component background
        elevated: "#1E2D45",   // raised surface, skeleton, icon bg
        lift:     "#1E3455",   // active states, spinner tracks
        line:     "#2A3F58",   // borders, dividers
        muted:    "#3D516B",   // muted text, secondary icons
        subtle:   "#6B7FA3",   // very muted text (disabled states)
        faint:    "#8FA3BF",   // lightest body text
        accent:   "#F5C518",   // yellow primary
      },
    },
  },
  plugins: [],
};

export default config;

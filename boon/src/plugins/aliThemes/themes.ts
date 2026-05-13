/*
 * BOON Plugin: AliThemes — built-in theme presets.
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Each theme is a CSS string that overrides Discord's CSS custom properties.
 * Discord's CSS variables follow `--background-primary`, `--text-normal`, etc.
 */

export type ThemeId = "default" | "midnight" | "sunset" | "ocean" | "cyber" | "sand";

export const THEMES: Record<ThemeId, string> = {
    default: "",

    midnight: `
:root {
    --background-primary: #0a0b0e !important;
    --background-secondary: #0d0e12 !important;
    --background-secondary-alt: #111318 !important;
    --background-tertiary: #06070a !important;
    --background-floating: #0d0e12 !important;
    --background-accent: #1a1c22 !important;
    --channeltextarea-background: #161820 !important;
    --background-message-hover: rgba(255,255,255,0.03) !important;
    --text-normal: #e6e8eb !important;
    --text-muted: #7a7e87 !important;
    --interactive-normal: #c2c5cb !important;
    --interactive-hover: #ffffff !important;
}
`,

    sunset: `
:root {
    --background-primary: #1f1a2e !important;
    --background-secondary: #1a1626 !important;
    --background-secondary-alt: #2a2440 !important;
    --background-tertiary: #14111e !important;
    --background-floating: #1a1626 !important;
    --background-accent: #322a4d !important;
    --channeltextarea-background: #26203a !important;
    --text-normal: #f5e6d3 !important;
    --text-muted: #b89a7c !important;
    --header-primary: #ff8c5a !important;
}
`,

    ocean: `
:root {
    --background-primary: #0f1a26 !important;
    --background-secondary: #0b1420 !important;
    --background-secondary-alt: #14253a !important;
    --background-tertiary: #08101a !important;
    --background-floating: #0b1420 !important;
    --background-accent: #1a2f4a !important;
    --channeltextarea-background: #122236 !important;
    --text-normal: #d6e6f5 !important;
    --text-muted: #7a99b8 !important;
    --header-primary: #5eaedd !important;
}
`,

    cyber: `
:root {
    --background-primary: #0d0d0d !important;
    --background-secondary: #050505 !important;
    --background-secondary-alt: #1a1a1a !important;
    --background-tertiary: #000000 !important;
    --background-floating: #0a0a0a !important;
    --background-accent: #1a2a1a !important;
    --channeltextarea-background: #121212 !important;
    --text-normal: #d0ffd0 !important;
    --text-muted: #6aaa6a !important;
    --header-primary: #00ff88 !important;
    --interactive-active: #00ff88 !important;
}
[class*="messageListItem"] { border-left: 1px solid rgba(0,255,136,0.06) !important; }
`,

    sand: `
:root {
    --background-primary: #f5efe6 !important;
    --background-secondary: #ece4d4 !important;
    --background-secondary-alt: #e0d6c2 !important;
    --background-tertiary: #d9cdb4 !important;
    --background-floating: #ece4d4 !important;
    --background-accent: #d4c4a0 !important;
    --channeltextarea-background: #ece4d4 !important;
    --text-normal: #2b261d !important;
    --text-muted: #6e6450 !important;
    --interactive-normal: #3a3429 !important;
    --interactive-hover: #1c1812 !important;
    --header-primary: #1c1812 !important;
}
`,
};

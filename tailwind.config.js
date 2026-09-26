/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-tertiary-fixed-variant": "#304f00",
        "surface-variant": "#dae2fd",
        "outline-variant": "#bccac0",
        "on-tertiary": "#ffffff",
        "primary-fixed": "#85f8c4",
        "tertiary-fixed-dim": "#91db2a",
        "surface-container": "#eaedff",
        "outline": "#6d7a72",
        "background": "#faf8ff",
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#001d31",
        "on-primary-fixed-variant": "#005137",
        "surface-bright": "#faf8ff",
        "secondary-fixed-dim": "#93ccff",
        "on-tertiary-fixed": "#102000",
        "on-surface": "#131b2e",
        "on-primary": "#ffffff",
        "surface-tint": "#006c4a",
        "surface": "#faf8ff",
        "surface-container-low": "#f2f3ff",
        "on-secondary": "#ffffff",
        "surface-dim": "#d2d9f4",
        "secondary": "#006398",
        "on-secondary-fixed-variant": "#004b73",
        "on-background": "#131b2e",
        "tertiary-container": "#518200",
        "primary": "#006948",
        "on-tertiary-container": "#f9ffea",
        "surface-container-high": "#e2e7ff",
        "surface-container-lowest": "#ffffff",
        "tertiary": "#3f6700",
        "secondary-container": "#5bb8fe",
        "on-primary-container": "#f5fff7",
        "inverse-surface": "#283044",
        "on-primary-fixed": "#002114",
        "on-error": "#ffffff",
        "inverse-on-surface": "#eef0ff",
        "primary-container": "#00855d",
        "on-secondary-container": "#00476e",
        "surface-container-highest": "#dae2fd",
        "tertiary-fixed": "#acf847",
        "primary-fixed-dim": "#68dba9",
        "secondary-fixed": "#cce5ff",
        "error-container": "#ffdad6",
        "error": "#ba1a1a",
        "on-surface-variant": "#3d4a42",
        "inverse-primary": "#68dba9"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "space-lg": "1.5rem",
        "gutter-mobile": "1rem",
        "space-sm": "0.5rem",
        "gutter": "1.5rem",
        "space-md": "1rem",
        "space-xl": "2.5rem",
        "margin": "2rem",
        "space-xs": "0.25rem",
        "margin-mobile": "1rem"
      },
      "fontFamily": {
        "sf-rounded": [
          "SF Pro Rounded",
          "ui-rounded",
          "Plus Jakarta Sans",
          "sans-serif"
        ],
        "body-sm": [
          "Plus Jakarta Sans"
        ],
        "headline-lg-mobile": [
          "Plus Jakarta Sans"
        ],
        "display": [
          "Plus Jakarta Sans"
        ],
        "label-sm": [
          "Inter"
        ],
        "body-md": [
          "Plus Jakarta Sans"
        ],
        "body-lg": [
          "Plus Jakarta Sans"
        ],
        "headline-lg": [
          "Plus Jakarta Sans"
        ],
        "headline-md": [
          "Plus Jakarta Sans"
        ],
        "headline-sm": [
          "Plus Jakarta Sans"
        ],
        "label-md": [
          "Inter"
        ]
      },
      "fontSize": {
        "body-sm": [
          "14px",
          {
            "lineHeight": "20px",
            "fontWeight": "400"
          }
        ],
        "headline-lg-mobile": [
          "28px",
          {
            "lineHeight": "36px",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.02em",
            "fontWeight": "800"
          }
        ],
        "label-sm": [
          "10px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.06em",
            "fontWeight": "700"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "400"
          }
        ],
        "headline-lg": [
          "36px",
          {
            "lineHeight": "44px",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "headline-sm": [
          "20px",
          {
            "lineHeight": "28px",
            "fontWeight": "600"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.04em",
            "fontWeight": "600"
          }
        ]
      }
    },
  },
  plugins: [],
}

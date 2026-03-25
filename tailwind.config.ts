// tailwind.config.ts (🚨 파일명은 .ts입니다)
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    // 🚨 Next.js와 shadcn/ui를 위한 모든 경로를 포함해야 합니다.
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // shadcn/ui의 테마 설정 (이전에 init 시 생성된 CSS 변수 참조)
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Chef/Michelin Premium Theme Colors
        "chef-bg": "var(--chef-bg)",
        "chef-card": "var(--chef-card-bg)",
        "chef-text": "var(--chef-text)",
        "chef-border": "var(--chef-border)",
        "chef-panel": "var(--chef-panel)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Remove animations for performance
      keyframes: {},
      animation: {},
      fontFamily: {
        sans: ["var(--font-poppins)", "Pretendard", "var(--font-noto-sans-kr)", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        pretendard: ["Pretendard", "sans-serif"],
      },
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")], // Removed tailwindcss-animate
} satisfies Config;

export default config;

# UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize TrAP's visual design to an Academic/Institutional theme (navy + warm gray, Inter + Lora) across all 16 pages without touching any business logic.

**Architecture:** Surgical styling-only edits — new Tailwind color tokens, updated shadcn base components, then page-by-page JSX class replacement. No logic, routing, state, or API calls are changed. Pages without a test suite are verified visually in a running browser.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v3, shadcn/ui (CVA), Google Fonts (Inter + Lora), lucide-react icons.

---

## Running the app

```powershell
# Backend (run in one terminal)
cd C:\prs\TrAP--TroubleMaker-Agent-Platform\backend
.\.venv\Scripts\python.exe manage.py runserver

# Frontend (run in another terminal)
cd C:\prs\TrAP--TroubleMaker-Agent-Platform\frontend
npm run dev
```

App is at http://localhost:3000

---

## Task 1: Design Tokens — Tailwind Config + Global CSS + Fonts

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Add navy color palette to tailwind.config.ts**

Replace the entire `theme.extend` block:

```ts
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4fb',
          100: '#e8eef7',
          500: '#2d5fa3',
          700: '#1a3a6b',
          900: '#0f2044',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

- [ ] **Step 2: Update globals.css — update shadcn primary token to navy + set body font**

Replace the entire content of `frontend/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 24 9.8% 10%;
    --card: 0 0% 100%;
    --card-foreground: 24 9.8% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 24 9.8% 10%;
    --primary: 220 60% 25%;
    --primary-foreground: 0 0% 98%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 220 36% 96%;
    --accent-foreground: 220 60% 25%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 220 60% 40%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 220 60% 25%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 220 60% 40%;
  }
  .dark {
    --background: 24 9.8% 10%;
    --foreground: 0 0% 98%;
    --card: 24 9.8% 10%;
    --card-foreground: 0 0% 98%;
    --popover: 24 9.8% 10%;
    --popover-foreground: 0 0% 98%;
    --primary: 220 60% 55%;
    --primary-foreground: 0 0% 9%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 0 0% 98%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 220 60% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-inter antialiased;
  }
  h1, h2, h3 {
    @apply font-lora;
  }
}

/* Autofill override */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active {
    -webkit-text-fill-color: #1c1917 !important;
    -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
    transition: background-color 5000s ease-in-out 0s !important;
    font-family: inherit !important;
    font-size: inherit !important;
}
```

- [ ] **Step 3: Load Inter and Lora fonts in layout.tsx**

Replace the entire content of `frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrAP — TroubleMaker Agent Platform",
  description: "Medical quiz platform for critical thinking training",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify fonts load**

Start the frontend (`npm run dev` in `frontend/`), open http://localhost:3000 and inspect the `<body>` element in DevTools. You should see `--font-inter` and `--font-lora` CSS variables on the root. Headings should render in a serif font, body text in Inter.

- [ ] **Step 5: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/app/globals.css frontend/src/app/layout.tsx
git commit -m "feat(ui): add navy color tokens, Inter+Lora fonts, update shadcn primary token"
```

---

## Task 2: Shared UI Components — Button, Input, LanguageSwitcher

**Files:**
- Modify: `frontend/src/components/ui/button.tsx`
- Modify: `frontend/src/components/ui/input.tsx`
- Modify: `frontend/src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Update button.tsx variants to use navy palette**

Replace the entire content of `frontend/src/components/ui/button.tsx`:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-navy-700 text-white shadow-sm hover:bg-navy-900",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-stone-300 bg-white shadow-sm hover:bg-stone-50 text-stone-700",
        secondary:
          "bg-white border border-stone-300 text-stone-700 shadow-sm hover:bg-stone-50",
        ghost:
          "text-stone-600 hover:text-navy-700 hover:bg-stone-100",
        link:
          "text-navy-500 underline-offset-4 hover:underline",
        success:
          "bg-green-600 text-white shadow-sm hover:bg-green-700",
        warning:
          "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Update input.tsx with navy focus ring and stone border**

Replace the entire content of `frontend/src/components/ui/input.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

- [ ] **Step 3: Rewrite LanguageSwitcher.tsx — replace inline CSSProperties with Tailwind**

Replace the entire content of `frontend/src/components/LanguageSwitcher.tsx`:

```tsx
"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  style?: CSSProperties;
  className?: string;
}

export function LanguageSwitcher({ style, className }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={cn("inline-flex items-center rounded-lg border border-stone-200 bg-white overflow-hidden shadow-sm", className)}
      style={style}
    >
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold transition-colors border-r border-stone-200",
          lang === "en"
            ? "bg-navy-700 text-white"
            : "text-stone-600 hover:bg-stone-50"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold transition-colors",
          lang === "fr"
            ? "bg-navy-700 text-white"
            : "text-stone-600 hover:bg-stone-50"
        )}
      >
        FR
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Visit http://localhost:3000. The language switcher in the top-right should now have a subtle bordered pill style with navy active state. Any existing `<Button>` components (e.g. on the debrief or generer pages) should render in navy instead of black.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/button.tsx frontend/src/components/ui/input.tsx frontend/src/components/LanguageSwitcher.tsx
git commit -m "feat(ui): update button/input/language-switcher to navy design system"
```

---

## Task 3: Landing Page (`/`)

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Replace entire page.tsx with split-screen Tailwind layout**

Replace the entire content of `frontend/src/app/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const RoleSelection = () => {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy brand strip */}
      <div className="hidden md:flex md:w-[38%] bg-navy-900 flex-col items-center justify-center px-10 py-12 text-white">
        <Image
          src="/logo_LEMANS_UNIVERSITE-WEB.svg"
          alt="Le Mans Université"
          width={180}
          height={48}
          className="mb-8 opacity-90"
        />
        <h1 className="font-lora text-4xl font-bold tracking-tight mb-3">TrAP</h1>
        <p className="text-navy-100 text-sm text-center leading-relaxed max-w-xs">
          TroubleMaker Agent Platform — train critical thinking in medical education
        </p>
      </div>

      {/* Right panel — role selection */}
      <div className="flex-1 bg-stone-100 flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageSwitcher className="absolute top-5 right-5" />

        {/* Mobile logo */}
        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image
            src="/logo_LEMANS_UNIVERSITE-WEB.svg"
            alt="Le Mans Université"
            width={160}
            height={43}
            className="mb-4"
          />
          <h1 className="font-lora text-3xl font-bold text-navy-900">TrAP</h1>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <h2 className="font-lora text-xl font-semibold text-navy-900 mb-1 text-center">
            {t('landing.title')}
          </h2>
          <p className="text-sm text-stone-500 text-center mb-8">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/etudiant/login')}
              className="w-full bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-3 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              {t('landing.student')}
            </button>
            <button
              onClick={() => router.push('/encadrant/login')}
              className="w-full bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg px-4 py-3 font-medium text-sm transition-colors"
            >
              {t('landing.supervisor')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
```

- [ ] **Step 2: Verify in browser**

Visit http://localhost:3000. On desktop you should see a two-column layout: navy left panel with logo and "TrAP" title, stone-100 right panel with a centered white card containing two role buttons. On mobile (resize browser) the left panel should be hidden and a logo should appear above the card.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat(ui): modernize landing page — split-screen navy/stone layout"
```

---

## Task 4: Encadrant Login Page

**Files:**
- Modify: `frontend/src/app/encadrant/login/page.tsx`

- [ ] **Step 1: Replace entire page with split-screen Tailwind layout**

Replace the entire content of `frontend/src/app/encadrant/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const EncadrantLogin = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError(t('common.fillAllFields')); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/encadrant/login`, { email, password }, { withCredentials: true });
      if (response.status === 200 && response.data) {
        router.push('/encadrant/liste_activite');
      } else {
        setError(t('common.serverInvalidResponse'));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || t('encadrantLogin.wrongCredentials'));
      } else {
        setError(t('common.serverUnreachable'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-[38%] bg-navy-900 flex-col items-center justify-center px-10 py-12 text-white">
        <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={180} height={48} className="mb-8 opacity-90" />
        <h1 className="font-lora text-4xl font-bold tracking-tight mb-3">TrAP</h1>
        <p className="text-navy-100 text-sm text-center leading-relaxed max-w-xs">
          TroubleMaker Agent Platform
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-stone-100 flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageSwitcher className="absolute top-5 right-5" />

        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={160} height={43} className="mb-4" />
          <h1 className="font-lora text-3xl font-bold text-navy-900">TrAP</h1>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <h2 className="font-lora text-xl font-semibold text-navy-900 mb-6 text-center">
            {t('encadrantLogin.title')}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1">
                {t('encadrantLogin.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-600 mb-1">
                {t('encadrantLogin.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 mt-1"
            >
              {loading ? t('encadrantLogin.signingIn') : t('encadrantLogin.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EncadrantLogin;
```

- [ ] **Step 2: Verify**

Visit http://localhost:3000/encadrant/login. Should match the landing page split-screen layout. Form should be fully functional — login with valid credentials should redirect to `/encadrant/liste_activite`. Invalid credentials should show an error banner inside the card.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/encadrant/login/page.tsx
git commit -m "feat(ui): modernize encadrant login — split-screen layout, Tailwind forms"
```

---

## Task 5: Étudiant Login Page

**Files:**
- Modify: `frontend/src/app/etudiant/login/page.tsx`

- [ ] **Step 1: Replace entire page with split-screen Tailwind layout**

Replace the entire content of `frontend/src/app/etudiant/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const EtudiantLogin = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email || !code) { setError(t('common.fillAllFields')); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/activite`, { email, code_activite: code }, { withCredentials: true });
      if (response.status === 200 && response.data) {
        router.push(`/etudiant/activite?code=${encodeURIComponent(code)}`);
      } else {
        setError(t('common.serverInvalidResponse'));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || t('etudiantLogin.unknownError'));
      } else {
        setError(t('common.serverUnreachable'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-[38%] bg-navy-900 flex-col items-center justify-center px-10 py-12 text-white">
        <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={180} height={48} className="mb-8 opacity-90" />
        <h1 className="font-lora text-4xl font-bold tracking-tight mb-3">TrAP</h1>
        <p className="text-navy-100 text-sm text-center leading-relaxed max-w-xs">
          TroubleMaker Agent Platform
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-stone-100 flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageSwitcher className="absolute top-5 right-5" />

        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={160} height={43} className="mb-4" />
          <h1 className="font-lora text-3xl font-bold text-navy-900">TrAP</h1>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <h2 className="font-lora text-xl font-semibold text-navy-900 mb-6 text-center">
            {t('etudiantLogin.title')}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1">
                {t('etudiantLogin.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-stone-600 mb-1">
                {t('etudiantLogin.activityCode')}
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50 tracking-widest uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 mt-1"
            >
              {loading ? t('etudiantLogin.joining') : t('etudiantLogin.join')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EtudiantLogin;
```

- [ ] **Step 2: Verify**

Visit http://localhost:3000/etudiant/login. Same split-screen as encadrant login. Activity code input should auto-uppercase as you type.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/etudiant/login/page.tsx
git commit -m "feat(ui): modernize etudiant login — split-screen layout, Tailwind forms"
```

---

## Task 6: Encadrant — Activity List (`/encadrant/liste_activite`)

**Files:**
- Modify: `frontend/src/app/encadrant/liste_activite/page.tsx`

- [ ] **Step 1: Read the full current file**

Read `frontend/src/app/encadrant/liste_activite/page.tsx` completely before editing.

- [ ] **Step 2: Replace the return JSX with the new layout**

The file has a large `return (...)` block starting around line 151. Keep all state/logic/hooks/handlers unchanged. Replace only the `return (...)` block (from `if (loading)` guards through the final `export default App`) with:

```tsx
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500 text-sm">{t('listeActivite.loading')}</p>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-red-600 text-sm">{t('listeActivite.errorLabel')} {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Top navbar */}
      <nav className="bg-navy-900 text-white h-14 px-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <span className="font-lora font-bold text-xl tracking-tight">TrAP</span>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{userEmail}</span>
            <span className="text-xs text-navy-100">{t('listeActivite.supervisor')}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-navy-100 hover:text-white hover:bg-navy-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
            title={t('listeActivite.logout')}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('listeActivite.loggingOut')}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-lora text-2xl font-bold text-navy-900">{t('listeActivite.title')}</h1>
          {lastRefresh && (
            <p className="text-xs text-stone-400 mt-1">
              {t('listeActivite.lastRefresh')} {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

        {/* Search + actions bar */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder={t('listeActivite.search')}
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 max-w-sm rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors shadow-sm"
          />
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-stone-300 text-stone-600 hover:text-navy-700 hover:bg-stone-50 shadow-sm transition-colors disabled:opacity-50"
            title={t('listeActivite.refresh')}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push('/encadrant/creer_activite')}
            className="flex items-center gap-1.5 bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            title={t('listeActivite.newActivity')}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('listeActivite.newActivity')}</span>
          </button>
        </div>

        {/* Error inline */}
        {error && (
          <p className="text-red-600 text-sm mb-4">{t('listeActivite.errorLabel')} {error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-sm">{searchQuery ? t('listeActivite.noResults') : t('listeActivite.noActivities')}</p>
          </div>
        )}

        {/* Activity card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.code_activite}
              className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm flex flex-col"
            >
              {/* Card header */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-lora font-semibold text-navy-900 text-base leading-snug truncate">
                    {activity.titre}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {t('listeActivite.code')}: <span className="font-mono font-medium text-stone-600">{activity.code_activite}</span>
                    {activity.destine_a && (
                      <span className="ml-2 text-stone-400">· {activity.destine_a.nom}</span>
                    )}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border flex-shrink-0 ${
                  activity.is_published
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {activity.is_published ? t('common.published') : t('common.draft')}
                </span>
              </div>

              {/* Card meta */}
              <div className="px-5 py-2 flex items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold text-[10px]">
                    {activity.type_affirmation_requise === 2 ? 'V/F' : '4C'}
                  </span>
                  {activity.type_affirmation_requise === 2 ? 'Vrai/Faux' : '4 choix'}
                </span>
                <span>{activity.nbr_affirmations_associe ?? activity.affirmations_associes?.length ?? 0} {t('listeActivite.statements')}</span>
                <span>{activity.etudiants_autorises?.length ?? 0} {t('listeActivite.students')}</span>
              </div>

              {/* Description */}
              {activity.description && (
                <div className="px-5 py-2 flex-1">
                  <p className={`text-sm text-stone-600 leading-relaxed ${expandedDescriptions[index] ? '' : 'line-clamp-2'}`}>
                    {activity.description}
                  </p>
                  {activity.description.length > 120 && (
                    <button
                      onClick={() => toggleDescription(index)}
                      className="text-xs text-navy-500 hover:text-navy-700 mt-1 transition-colors"
                    >
                      {expandedDescriptions[index] ? t('common.showLess') : t('common.showMore')}
                    </button>
                  )}
                </div>
              )}

              {/* Card footer — actions */}
              <div className="px-5 py-3 mt-auto border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => router.push(`/encadrant/debrief?activity_code=${activity.code_activite}`)}
                  className="p-2 rounded-lg text-stone-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  title={t('listeActivite.debrief')}
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => router.push(`/encadrant/parametres_activite?code=${activity.code_activite}`)}
                  className="p-2 rounded-lg text-stone-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  title={t('listeActivite.settings')}
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 3: Verify**

Log in as encadrant and visit http://localhost:3000/encadrant/liste_activite. You should see:
- Navy top navbar with TrAP wordmark, user info, logout
- Card grid (1/2/3 columns at sm/md/xl breakpoints)
- Each card shows title in Lora serif, status badge (green/amber pill), meta row, description, footer with icon buttons
- Search and action buttons in the top toolbar

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/encadrant/liste_activite/page.tsx
git commit -m "feat(ui): modernize liste_activite — navbar, card grid, status badges"
```

---

## Task 7: Encadrant — Create Activity (`/encadrant/creer_activite`)

**Files:**
- Modify: `frontend/src/app/encadrant/creer_activite/page.tsx`

- [ ] **Step 1: Replace page background, header, section cards, labels, buttons**

The file is large (~1330 lines). The following are targeted replacements — **do not touch any logic, state, handlers, or drag-and-drop code**.

**Replace 1 — Page wrapper (line ~773):**
```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">

// NEW
<div className="min-h-screen bg-stone-100">
```

**Replace 2 — Page header section:**
```tsx
// OLD
<header className="bg-white shadow-md p-4 mb-6 flex justify-between items-center">
  {/* Bouton retour au menu principal */}
  <button
    onClick={() => router.push('/encadrant/liste_activite')}
    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center space-x-2"
  >
    <span>←</span>
    <span>{t('creerActivite.mainMenu')}</span>
  </button>

  <h1 className="text-4xl font-bold text-gray-800">{t('creerActivite.title')}</h1>

  {/* Form auto-save indicator */}
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    <span className="text-sm text-gray-600">{t('creerActivite.autoSave')}</span>
  </div>
</header>

// NEW
<header className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
  <button
    onClick={() => router.push('/encadrant/liste_activite')}
    className="flex items-center gap-1.5 text-stone-600 hover:text-navy-700 hover:bg-stone-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
  >
    <span>←</span>
    <span>{t('creerActivite.mainMenu')}</span>
  </button>
  <h1 className="font-lora text-xl font-bold text-navy-900">{t('creerActivite.title')}</h1>
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
    <span className="text-xs text-stone-500">{t('creerActivite.autoSave')}</span>
  </div>
</header>
```

**Replace 3 — Content wrapper div (right after header closing tag):**
```tsx
// OLD
<div className="space-y-6">

// NEW
<div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
```

**Replace 4 — Activity details section card:**
```tsx
// OLD
<div className="bg-white shadow-md p-4 md:p-6 rounded-lg">
  <header className="mb-6">
    <h2 className="text-2xl font-bold text-gray-800 flex justify-center">{t('activityForm.title')}</h2>
  </header>

// NEW
<div className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-6">
  <h2 className="font-lora text-lg font-semibold text-navy-900 mb-6">{t('activityForm.title')}</h2>
```

**Replace 5 — All form labels (replace_all: false — apply one by one for each label in the 3-column grid):**
```tsx
// OLD pattern
className="block text-gray-700 font-semibold mb-2 text-lg"

// NEW pattern  
className="block text-sm font-medium text-stone-600 mb-1"
```

**Replace 6 — Affirmation panels (two dashed-border divs):**
```tsx
// OLD
className="bg-white shadow-md p-4 md:p-6 rounded-lg min-h-[400px] border-dashed border-2 border-gray-300"

// NEW
className="bg-stone-50 rounded-xl border-2 border-dashed border-stone-200 shadow-sm p-6 min-h-[400px]"
```

**Replace 7 — Affirmation panel heading (selected):**
```tsx
// OLD
<h2 className="text-3xl font-bold mb-6 flex justify-center">Affirmations sélectionnées ({selectedAffirmations.length})</h2>

// NEW
<h2 className="font-lora text-lg font-semibold text-navy-900 mb-4">Affirmations sélectionnées ({selectedAffirmations.length})</h2>
```

**Replace 8 — Bottom action buttons:**
```tsx
// OLD
<div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 mt-8">
  <button type="button" className="px-6 py-3 text-lg bg-gray-500 text-white rounded-md hover:bg-gray-600 w-full md:w-auto" ...>
    Vider le formulaire
  </button>
  <button type="button" className="px-6 py-3 text-lg bg-red-500 text-white rounded-md hover:bg-red-600 w-full md:w-auto" ...>
    Annuler
  </button>
  <button type="button" className="px-6 py-3 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full md:w-auto disabled:opacity-50" ...>
    {isSubmitting ? t('common.saving') : t('creerActivite.submit')}
  </button>
</div>

// NEW
<div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4 flex justify-end gap-3 -mx-6 mt-8">
  <button type="button" className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors" ...>
    Vider le formulaire
  </button>
  <button type="button" className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors" ...>
    Annuler
  </button>
  <button type="button" className="bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50" ...>
    {isSubmitting ? t('common.saving') : t('creerActivite.submit')}
  </button>
</div>
```

- [ ] **Step 2: Update affirmation list item cards**

For each `<li>` in the affirmation lists, replace the background tint classes:
```tsx
// OLD — false affirmation
className={`p-4 rounded shadow-sm text-xl flex flex-col gap-3 ${affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}

// NEW
className={`bg-white rounded-lg border border-stone-200 p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 ${affirmation.is_correct_vf ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-red-400'}`}
```

- [ ] **Step 3: Verify**

Visit http://localhost:3000/encadrant/creer_activite. Should show sticky white header with back + title, stone-100 background, rounded section cards, compact labels, sticky bottom action bar. Drag-and-drop still works for affirmations.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/encadrant/creer_activite/page.tsx
git commit -m "feat(ui): modernize creer_activite — page shell, section cards, sticky action bar"
```

---

## Task 8: Encadrant — Activity Settings (`/encadrant/parametres_activite`)

**Files:**
- Modify: `frontend/src/app/encadrant/parametres_activite/page.tsx`

- [ ] **Step 1: Apply same structural changes as creer_activite**

The file has the same structure. Apply the identical replacements:

**Replace 1 — Page wrapper:**
```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">

// NEW
<div className="min-h-screen bg-stone-100">
```

**Replace 2 — Page header:**
```tsx
// OLD
<header className="bg-white shadow-md p-4 mb-6 flex justify-center">
  <h1 className="text-4xl font-bold text-gray-800">
    {activityCodeParam ? t('parametresActivite.title') : t('creerActivite.title')}
  </h1>
</header>

// NEW
<header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
  <button
    onClick={() => router.push('/encadrant/liste_activite')}
    className="flex items-center gap-1.5 text-stone-600 hover:text-navy-700 hover:bg-stone-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
  >
    <span>←</span>
    <span>Mes activités</span>
  </button>
  <h1 className="font-lora text-xl font-bold text-navy-900">
    {activityCodeParam ? t('parametresActivite.title') : t('creerActivite.title')}
  </h1>
  <div className="w-24" />
</header>
```

**Replace 3 — Content wrapper:**
```tsx
// OLD
<div className="space-y-6">

// NEW
<div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
```

**Replace 4 — Activity details card:**
```tsx
// OLD
<div className="bg-white shadow-md p-4 md:p-6 rounded-lg">
  <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('activityForm.title')}</h2>

// NEW
<div className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-6">
  <h2 className="font-lora text-lg font-semibold text-navy-900 mb-6">{t('activityForm.title')}</h2>
```

**Replace 5 — All form labels:**
```tsx
// OLD pattern (replace_all in this file only)
className="block text-gray-700 font-semibold mb-2 text-lg"

// NEW
className="block text-sm font-medium text-stone-600 mb-1"
```

**Replace 6 — Affirmation panel wrappers:**
```tsx
// OLD
className="bg-white shadow-md p-4 md:p-6 rounded-lg min-h-[300px]"

// NEW
className="bg-stone-50 rounded-xl border-2 border-dashed border-stone-200 shadow-sm p-6 min-h-[300px]"
```

**Replace 7 — Bottom action buttons:**
```tsx
// OLD
<div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-4 pt-6">
  <button ... className="px-6 py-3 text-lg bg-red-500 text-white rounded-md hover:bg-red-600 ...">Supprimer</button>
  <button ... className={`px-6 py-3 text-lg text-white rounded-md ... ${isPublished ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
    {isPublished ? "Retirer la publication" : "Lancer l'activité"}
  </button>
  <button ... className="px-6 py-3 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600 ...">
    {activityCodeParam ? t('parametresActivite.submit') : t('creerActivite.submit')}
  </button>
</div>

// NEW
<div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4 flex justify-end gap-3 -mx-6">
  <button ... className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">Supprimer</button>
  <button ... className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${isPublished ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}>
    {isPublished ? "Retirer la publication" : "Lancer l'activité"}
  </button>
  <button ... className="bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">
    {activityCodeParam ? t('parametresActivite.submit') : t('creerActivite.submit')}
  </button>
</div>
```

**Replace 8 — Affirmation list items (same pattern as creer_activite Task 7 Step 2)**

- [ ] **Step 2: Verify**

Visit a parametres page e.g. `/encadrant/parametres_activite?code=SOMECODE`. Should match creer_activite styling. Launch/Unpublish button should be green (unpublished) or amber (published).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/encadrant/parametres_activite/page.tsx
git commit -m "feat(ui): modernize parametres_activite — consistent page shell with creer_activite"
```

---

## Task 9: Encadrant — Debrief Page (`/encadrant/debrief`)

**Files:**
- Modify: `frontend/src/app/encadrant/debrief/page.tsx`

- [ ] **Step 1: Read the full debrief page**

Read `frontend/src/app/encadrant/debrief/page.tsx` to find exact line numbers for the return JSX.

- [ ] **Step 2: Update the page wrapper and header**

```tsx
// OLD — loading state wrapper
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
  <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
    <div className="flex justify-center items-center h-64">
      <div className="text-xl text-gray-600">{t('debrief.loading')}</div>
    </div>

// NEW
<div className="min-h-screen bg-stone-100">
  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="flex justify-center items-center h-64">
      <div className="text-sm text-stone-500">{t('debrief.loading')}</div>
    </div>
```

Apply this same wrapper replacement to all three early-return states (loading, error, no activity).

- [ ] **Step 3: Update main return JSX wrapper + header**

```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
  <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">{t('debrief.title')}</h1>
        <h2 className="text-xl text-gray-600 mt-2">{activity.titre}</h2>
        <p className="text-sm text-gray-500 mt-1">Code: {activity.code_activite}</p>
      </div>
    </div>

// NEW
<div className="min-h-screen bg-stone-100">
  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="mb-8">
      <h1 className="font-lora text-2xl font-bold text-navy-900">{t('debrief.title')}</h1>
      <p className="text-base text-stone-600 mt-1">{activity.titre}</p>
      <p className="text-xs text-stone-400 mt-0.5 font-mono">Code: {activity.code_activite}</p>
    </div>
```

- [ ] **Step 4: Update table wrapper**

```tsx
// OLD
<div className="rounded-md border">

// NEW
<div className="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
```

- [ ] **Step 5: Update table header**

In the `TableHeader` rows, add to the `TableRow`:
```tsx
// OLD
<TableRow key={headerGroup.id}>

// NEW
<TableRow key={headerGroup.id} className="bg-navy-900 hover:bg-navy-900">
```

And update `TableHead`:
```tsx
// OLD
<TableHead key={header.id}>

// NEW
<TableHead key={header.id} className="text-white text-sm font-medium">
```

- [ ] **Step 6: Update table body rows**

```tsx
// OLD
<TableRow>

// NEW
<TableRow className="hover:bg-navy-50 transition-colors">
```

- [ ] **Step 7: Update expanded response section**

```tsx
// OLD
<TableCell colSpan={columns.length} className="bg-gray-50">
  <div className="p-4 space-y-6">

// NEW
<TableCell colSpan={columns.length} className="bg-navy-50 border-t border-navy-200 p-0">
  <div className="p-5 space-y-6">
```

- [ ] **Step 8: Update statement text in expanded rows**

```tsx
// OLD
<span className="text-gray-600 text-xl">{response.affirmation.affirmation}</span>

// NEW
<span className="font-lora text-base text-stone-700">{response.affirmation.affirmation}</span>
```

- [ ] **Step 9: Update debrief textarea and send button**

```tsx
// OLD
<textarea
  ...
  className="w-full mt-2 p-3 border border-gray-300 rounded-md text-lg"
  rows={3}
/>
<Button onClick={...} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">

// NEW
<textarea
  ...
  className="w-full mt-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors resize-none"
  rows={3}
/>
<Button onClick={...} variant="default" size="sm" className="mt-2">
```

- [ ] **Step 10: Verify**

Visit `/encadrant/debrief?activity_code=SOMECODE`. Should show stone-100 background, no white card wrapper, Lora title, navy table header row, navy-50 expanded rows.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app/encadrant/debrief/page.tsx
git commit -m "feat(ui): modernize debrief page — navy table header, stone surfaces"
```

---

## Task 10: Encadrant — Generate Affirmations (`/encadrant/generer`)

**Files:**
- Modify: `frontend/src/app/encadrant/generer/page.tsx`

- [ ] **Step 1: Read the generer page**

Read the full file to find the return JSX.

- [ ] **Step 2: Replace page wrapper and header**

The generer page uses shadcn `Card` and `Button` components throughout. Apply:

```tsx
// OLD — top-level wrapper (find the outermost div in return)
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">

// NEW
<div className="min-h-screen bg-stone-100 p-6">
```

- [ ] **Step 3: Update page title**

```tsx
// OLD — any h1/h2 with large text classes
className="text-2xl font-bold ..." or className="text-3xl font-bold ..."

// NEW — all page-level headings
className="font-lora text-2xl font-bold text-navy-900"
```

- [ ] **Step 4: Back button**

```tsx
// OLD
<Button variant="outline" onClick={() => router.back()}>
  <ArrowLeft ... /> {t('...')}
</Button>

// NEW
<Button variant="outline" onClick={() => router.back()}>
  <ArrowLeft ... /> {t('...')}
</Button>
```
(Button already updated via Task 2 — `outline` variant now uses stone-300 border.)

- [ ] **Step 5: Verify**

Visit `/encadrant/generer`. Background should be stone-100. All shadcn Button components automatically inherit updated variants.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/encadrant/generer/page.tsx
git commit -m "feat(ui): modernize generer page — stone-100 background, Lora headings"
```

---

## Task 11: Encadrant — Affirmation List (`/encadrant/liste_affirmations`)

**Files:**
- Modify: `frontend/src/app/encadrant/liste_affirmations/page.tsx`

- [ ] **Step 1: Replace page wrapper**

```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
  <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('listeAffirmations.title')}</h1>
      </div>

// NEW
<div className="min-h-screen bg-stone-100">
  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="mb-8 flex justify-between items-center">
      <h1 className="font-lora text-2xl font-bold text-navy-900">{t('listeAffirmations.title')}</h1>
```

- [ ] **Step 2: Update affirmation list items**

Find the list item rendering and apply the affirmation card pattern:

```tsx
// OLD — list item wrapper (approximate)
className="bg-white p-4 rounded-lg shadow flex items-center justify-between"

// NEW
className="bg-white rounded-lg border border-stone-200 border-l-4 border-l-stone-300 p-3 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
```

- [ ] **Step 3: Verify**

Visit `/encadrant/liste_affirmations`. Stone background, Lora heading, bordered list items.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/encadrant/liste_affirmations/page.tsx
git commit -m "feat(ui): modernize liste_affirmations — page shell, card items"
```

---

## Task 12: Étudiant — Activity Overview (`/etudiant/activite`)

**Files:**
- Modify: `frontend/src/app/etudiant/activite/page.tsx`

- [ ] **Step 1: Read the full activite/page.tsx**

Read the complete file to see all JSX in the return block.

- [ ] **Step 2: Replace all return states with updated styles**

The file has several return states (loading, error, main). Replace:

```tsx
// OLD — loading/error states wrapper
style={{ ... }} (inline CSSProperties)

// NEW — all early return divs
<div className="min-h-screen bg-stone-100 flex items-center justify-center">
  <p className="text-sm text-stone-500">{...}</p>
</div>
```

- [ ] **Step 3: Replace main return JSX**

Find the main `return (...)` and replace the outer wrappers:

```tsx
// OLD — any outer container with gradient
className="..." with gradient or large bg-white wrapper

// NEW
<div className="min-h-screen bg-stone-100">
  <div className="max-w-2xl mx-auto px-6 py-12">
```

- [ ] **Step 4: Update activity title and description card**

```tsx
// OLD — activity title
className="text-3xl font-bold ..." or similar

// NEW
className="font-lora text-2xl font-bold text-navy-900 mb-2"

// OLD — description card wrapper
className="bg-white rounded-xl shadow p-6" or similar

// NEW
className="bg-white rounded-xl shadow-md p-6 mb-6"
```

- [ ] **Step 5: Update start button**

```tsx
// OLD
className="bg-blue-600 hover:bg-blue-700 text-white ..."

// NEW
className="w-full sm:w-auto bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-6 py-3 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-navy-500"
```

- [ ] **Step 6: Verify**

Visit `/etudiant/activite?code=SOMEVALIDCODE`. Stone background, Lora activity title, white elevated card, navy start button.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/etudiant/activite/page.tsx
git commit -m "feat(ui): modernize etudiant activite overview — stone background, navy CTA"
```

---

## Task 13: Étudiant — Participation (`/etudiant/activite/participer`)

**Files:**
- Modify: `frontend/src/app/etudiant/activite/participer/page.tsx`

- [ ] **Step 1: Replace page background and statement card**

```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 text-xl">
  <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">

// NEW
<div className="min-h-screen bg-stone-100 p-4">
  <div className="max-w-2xl mx-auto">
```

- [ ] **Step 2: Update statement card**

```tsx
// OLD — statement background div
<div className="bg-gray-50 p-6 rounded-lg">
  <p className="text-xl font-medium text-gray-800 mb-6 text-justify leading-relaxed">

// NEW
<div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-4">
  <p className="font-lora text-lg text-stone-900 mb-6 leading-relaxed">
```

- [ ] **Step 3: Replace radio option tiles**

The RadioGroup renders label+RadioGroupItem pairs. Replace the wrapping div for each option:

```tsx
// OLD
<div
  key={optionValue}
  className="text-xl font-medium flex items-center justify-center sm:justify-start space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
>

// NEW
<div
  key={optionValue}
  className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50"
>
```

Also update the "I don't know" option div:

```tsx
// OLD
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200">

// NEW
<div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50">
```

- [ ] **Step 4: Update the Label inside radio tiles**

```tsx
// OLD
className="whitespace-nowrap text-lg font-medium cursor-pointer"

// NEW
className="whitespace-nowrap text-sm font-medium cursor-pointer text-stone-700"
```

- [ ] **Step 5: Update textarea**

```tsx
// OLD
style={{ fontSize: '25px' }}
className="mt-6 w-full min-h-[120px] p-3 border border-gray-300 rounded-md"

// NEW (remove the style prop entirely)
className="mt-4 w-full min-h-[100px] rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors resize-none"
```

- [ ] **Step 6: Update progress bar**

```tsx
// OLD
<div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2 max-w-md mx-auto">
  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: ... }}>

// NEW
<div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 max-w-md mx-auto">
  <div className="bg-navy-700 h-1.5 rounded-full transition-all duration-300" style={{ width: ... }}>
```

- [ ] **Step 7: Update navigation buttons**

The Prev/Next/Complete buttons already use shadcn `<Button>`. They automatically pick up updated variants from Task 2. Ensure:
- Prev uses `variant="outline"` (already does)
- Next uses default variant (already does — now navy)
- Complete Activity uses default variant

- [ ] **Step 8: Update statement counter text**

```tsx
// OLD
<span className="text-lg font-medium text-gray-500">

// NEW
<span className="text-xs font-medium text-stone-500">
```

- [ ] **Step 9: Verify**

Participate in an activity. Should show stone background, white statement card with Lora text, bordered radio tiles that highlight navy on hover/select, slim navy progress bar, navy "Complete Activity" button.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/app/etudiant/activite/participer/page.tsx
git commit -m "feat(ui): modernize participer — statement card, radio tiles, navy progress bar"
```

---

## Task 14: Étudiant — Confirmation Page (`/etudiant/activite/participer/confirmer`)

**Files:**
- Modify: `frontend/src/app/etudiant/activite/participer/confirmer/page.tsx`

- [ ] **Step 1: Read the full confirmer page**

Read the complete file.

- [ ] **Step 2: Replace page wrapper**

```tsx
// OLD — find outermost wrapper in loading/main return
<div className="min-h-screen ...">

// NEW — for all return states
<div className="min-h-screen bg-stone-100 ...">
```

- [ ] **Step 3: Update main content wrapper**

```tsx
// OLD
<div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">

// NEW
<div className="max-w-2xl mx-auto">
```

- [ ] **Step 4: Update confirmation heading**

```tsx
// OLD — any h1/h2 title
className="text-2xl font-bold ..." or similar

// NEW
className="font-lora text-xl font-semibold text-navy-900 mb-6 text-center"
```

- [ ] **Step 5: Update response summary cards**

Each response summary item:
```tsx
// OLD
className="bg-gray-50 p-4 rounded-lg ..." or "bg-white border ..."

// NEW
className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-4 mb-3"
```

- [ ] **Step 6: Update navigation buttons**

Buttons already use shadcn `<Button>` — they inherit updated styles. Ensure Prev/Next use `variant="outline"` and `variant="default"` respectively.

- [ ] **Step 7: Verify**

After completing activity questions, the confirmer page should show stone background, clean response summary cards, Lora heading.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/etudiant/activite/participer/confirmer/page.tsx
git commit -m "feat(ui): modernize confirmer page — stone surfaces, Lora heading"
```

---

## Task 15: Étudiant — Feedback Page (`/etudiant/activite/feedback`)

**Files:**
- Modify: `frontend/src/app/etudiant/activite/feedback/page.tsx`

- [ ] **Step 1: Read the full feedback page**

Read `frontend/src/app/etudiant/activite/feedback/page.tsx` completely.

- [ ] **Step 2: Replace page wrapper and header**

```tsx
// OLD — find outer div in main return
<div className="min-h-screen ...">
  <div className="max-w-... mx-auto bg-white ...">
    <h1 className="text-3xl font-bold ...">

// NEW
<div className="min-h-screen bg-stone-100">
  <div className="max-w-2xl mx-auto px-6 py-8">
    <h1 className="font-lora text-2xl font-bold text-navy-900 mb-2">
```

- [ ] **Step 3: Update subtitle / response count line**

```tsx
// OLD
className="text-gray-500 ..." or similar

// NEW
className="text-sm text-stone-500 mb-8"
```

- [ ] **Step 4: Update per-statement outer card**

```tsx
// OLD — each statement wrapper
className="bg-gray-50 rounded-xl border border-gray-200 p-5" or similar

// NEW
className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-5 mb-4"
```

- [ ] **Step 5: Update statement number + status badge**

```tsx
// OLD — "Feedback received" badge
className="... text-green-..." or inline style

// NEW
className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-navy-100 text-navy-800 border border-navy-200"

// OLD — "Pending" badge
className="... text-gray-..." or similar

// NEW
className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
```

- [ ] **Step 6: Update statement text**

```tsx
// OLD
className="text-gray-800 font-medium text-lg ..." or similar

// NEW
className="font-lora text-base text-stone-900 font-medium mt-2 mb-3"
```

- [ ] **Step 7: Update student answer block**

```tsx
// OLD
className="bg-white border border-gray-200 rounded-lg p-3 ..." or similar

// NEW
className="bg-white rounded-lg border border-stone-200 p-3 mb-3"
```

- [ ] **Step 8: Update supervisor feedback block**

```tsx
// OLD — feedback received block
className="bg-blue-50 ..." or similar

// NEW
className="border-l-4 border-navy-500 bg-navy-50 p-3 rounded-r-lg"

// The label text:
className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1"
// The feedback text:
className="text-sm text-stone-700"
```

- [ ] **Step 9: Update pending feedback block**

```tsx
// OLD
className="bg-yellow-50 text-yellow-700 ..." or "text-gray-500 italic"

// NEW
className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded-r-lg text-sm text-amber-700 italic"
```

- [ ] **Step 10: Verify**

Visit `/etudiant/activite/feedback?code=SOMEVALIDCODE` after completing an activity that has at least one debrief. Should show:
- Stone background, Lora page title
- Per-statement cards with navy left border for feedback received, amber for pending
- Supervisor feedback in navy-tinted block

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app/etudiant/activite/feedback/page.tsx
git commit -m "feat(ui): modernize feedback page — navy/amber feedback blocks, Lora title"
```

---

## Task 16: Final Polish — not-found page + build check

**Files:**
- Modify: `frontend/src/app/not-found.tsx`

- [ ] **Step 1: Update not-found page**

Read `frontend/src/app/not-found.tsx` then replace its background/text styles:

```tsx
// Replace outer wrapper background with bg-stone-100
// Replace heading with font-lora text-navy-900
// Replace primary button with bg-navy-700 hover:bg-navy-900
```

- [ ] **Step 2: Run build to check for type errors**

```powershell
cd C:\prs\TrAP--TroubleMaker-Agent-Platform\frontend
npm run build
```

Expected: build completes with 0 errors. If there are TypeScript errors, they will be related to variant types — fix by ensuring `variant="success"` and `variant="warning"` are used only where those variants were added in Task 2.

- [ ] **Step 3: Fix any build errors**

If `variant="success"` or `variant="warning"` is not recognized, the error will be:
```
Type '"success"' is not assignable to type '"default" | "destructive" | ...'
```
Fix: Add the missing variants to the `buttonVariants` cva definition in `button.tsx` (they were added in Task 2 — verify the file was saved correctly).

- [ ] **Step 4: Run dev server and do a full visual walkthrough**

```powershell
cd C:\prs\TrAP--TroubleMaker-Agent-Platform\frontend
npm run dev
```

Walk through each page in order:
1. http://localhost:3000 — landing split-screen
2. /encadrant/login — supervisor login
3. /etudiant/login — student login  
4. /encadrant/liste_activite — activity cards grid
5. /encadrant/creer_activite — create form
6. /encadrant/parametres_activite?code=X — settings
7. /encadrant/debrief?activity_code=X — debrief table
8. /encadrant/generer?activity_code=X — generate
9. /encadrant/liste_affirmations — affirmation list
10. /etudiant/activite?code=X — activity overview
11. /etudiant/activite/participer?code=X — participation
12. /etudiant/activite/participer/confirmer?code=X — confirmation
13. /etudiant/activite/feedback?code=X — feedback

Check: consistent stone-100 backgrounds, navy primary color, Lora headings, no blue gradients, no inline styles remaining on core interactive elements.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/not-found.tsx
git commit -m "feat(ui): modernize not-found page + build verified clean"
```

---

## Summary

| Task | File(s) | Scope |
|---|---|---|
| 1 | tailwind.config.ts, globals.css, layout.tsx | Navy tokens, fonts |
| 2 | button.tsx, input.tsx, LanguageSwitcher.tsx | Shared components |
| 3 | app/page.tsx | Landing split-screen |
| 4 | encadrant/login/page.tsx | Supervisor login |
| 5 | etudiant/login/page.tsx | Student login |
| 6 | encadrant/liste_activite/page.tsx | Card grid + navbar |
| 7 | encadrant/creer_activite/page.tsx | Page shell + forms |
| 8 | encadrant/parametres_activite/page.tsx | Page shell + forms |
| 9 | encadrant/debrief/page.tsx | Table + expanded rows |
| 10 | encadrant/generer/page.tsx | Page shell |
| 11 | encadrant/liste_affirmations/page.tsx | Page shell + list |
| 12 | etudiant/activite/page.tsx | Activity overview |
| 13 | etudiant/activite/participer/page.tsx | Statement card + radio tiles |
| 14 | etudiant/activite/participer/confirmer/page.tsx | Summary cards |
| 15 | etudiant/activite/feedback/page.tsx | Feedback blocks |
| 16 | not-found.tsx + build check | Polish + validation |

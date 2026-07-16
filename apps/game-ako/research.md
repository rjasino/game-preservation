# Next.js 16 Project Scaffold Research

> Researched: July 2026
> Sources: nextjs.org (v16.2.10), tailwindcss.com (v4.3), vitest.dev (v4.1.10), mongoosejs.com (v9.7.4)

---

## 1. TailwindCSS 4 Setup for Next.js 16

### Packages

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

| Package              | Role                          |
| -------------------- | ----------------------------- |
| `tailwindcss`        | Core engine (v4.x)            |
| `@tailwindcss/postcss` | PostCSS plugin             |
| `postcss`            | Peer dependency               |

### PostCSS Config (`postcss.config.mjs`)

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### CSS Entry File (`app/globals.css`)

```css
@import 'tailwindcss';
```

Import it in the root layout:

```tsx
// app/layout.tsx
import './globals.css'
```

### CSS-driven Configuration (no `tailwind.config.js`)

Tailwind CSS v4 is **CSS-driven**. There is no `tailwind.config.js` or `tailwind.config.ts`. All customization happens via CSS:

- **Theme customization**: Use `@theme` blocks in CSS
- **Custom values**: `--color-*`, `--font-*` etc. as CSS custom properties
- **Dark mode**: `@media (prefers-color-scheme: dark)` or `@custom-variant dark (&:where(.dark, .dark *))`
- **Plugins**: Imported via `@plugin` in CSS

---

## 2. ESLint 9 Flat Config for Next.js + TypeScript

### Packages

```bash
npm install -D eslint eslint-config-next
```

### `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

### Config Variants

| Import                                     | Includes                                       |
| ------------------------------------------ | ---------------------------------------------- |
| `eslint-config-next`                       | Base: React, React Hooks, Next.js rules        |
| `eslint-config-next/core-web-vitals`       | Base + Core Web Vitals rules as errors         |
| `eslint-config-next/typescript`            | TypeScript rules (based on `@typescript-eslint/recommended`) |

### With Prettier (optional)

```bash
npm install -D eslint-config-prettier
```

```js
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([...]),
])
```

### Scripts (`package.json`)

```json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

Note: Starting with Next.js 16, `next build` no longer runs the linter. Use NPM scripts instead.

---

## 3. Vitest 4 + Next.js Setup

### Packages

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

| Package                  | Version (approx.) | Purpose                              |
| ------------------------ | ----------------- | ------------------------------------ |
| `vitest`                 | ^4.1              | Test runner                          |
| `@vitejs/plugin-react`   | ^4.x              | React Fast Refresh / JSX transform   |
| `jsdom`                  | ^26.x             | DOM environment emulation            |
| `@testing-library/react` | ^16.x             | React component testing utilities    |
| `@testing-library/dom`   | ^10.x             | DOM testing utilities                |
| `vite-tsconfig-paths`    | ^5.x              | Resolve tsconfig paths (`@/*`)       |

### `vitest.config.mts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

### Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Environment Considerations

- **`jsdom`**: Required for component rendering tests simulating a browser DOM
- **Async Server Components**: Not supported by Vitest; use E2E tests (Playwright) for those
- **Vitest 4 requires**: Vite >= v6.0.0, Node >= v20.0.0
- Test files: `*.test.{ts,tsx}` or `*.spec.{ts,tsx}`, can live in `__tests__/` or colocated

---

## 4. Mongoose Connection Pattern for Next.js

### Packages

```bash
npm install mongoose
```

### Connection Module (`lib/mongodb.ts`)

```ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

export default async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local')
  }
  await mongoose.connect(MONGODB_URI)
  return mongoose
}
```

### Global Caching

**Not required.** Mongoose handles connection management internally — `mongoose.connect()` is a no-op if already connected. You can safely call `dbConnect()` in every route/server component without creating multiple connections.

### Model Definition Pattern

```ts
// models/User.ts
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', UserSchema)
```

The `mongoose.models.X || mongoose.model('X', schema)` pattern prevents model recompilation errors during HMR.

### `next.config.ts` additions (if errors occur)

```ts
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['mongoose'],
  },
  webpack: (config) => {
    config.experiments = { topLevelAwait: true }
    return config
  },
}
```

### Connection String

Store in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/mydb
```

For MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>
```

### Important

- Mongoose does **not** support Next.js Edge Runtime (no `net` API)
- Always specify `export const runtime = 'nodejs'` if using in app router
- Use `.lean()` in Server Components for plain objects
- Use `JSON.parse(JSON.stringify(docs))` in Pages Router `getServerSideProps`

---

## 5. `create-next-app` Command

### Quick Start (accept all defaults)

```bash
npx create-next-app@latest my-app --yes
```

The `--yes` flag selects defaults: **TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, `@/*` import alias**.

### Interactive Mode

```bash
npx create-next-app@latest
```

Prompts allow customizing TypeScript, ESLint/Biome, React Compiler, Tailwind, `src/` directory, App/Pages Router, import alias, and AGENTS.md.

### With Explicit Flags

```bash
npx create-next-app@latest my-app \
  --typescript \
  --eslint \
  --app \
  --tailwind \
  --src-dir \
  --import-alias "@/*"
```

### Default Result

| Feature        | Default            |
| -------------- | ------------------ |
| TypeScript     | Yes                |
| ESLint         | Yes (flat config)  |
| Tailwind CSS   | Yes (v4, CSS-driven) |
| Router         | App Router         |
| Bundler        | Turbopack          |
| Import Alias   | `@/*`              |
| AGENTS.md      | Yes                |

Node >= 20.9 required. TypeScript >= 5.1.0.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Technologies Used

This project is built with modern web technologies to ensure optimal performance and developer experience:

### Core Framework & Runtime

- **[Next.js 15.4.3](https://nextjs.org)** - React-based full-stack framework with App Router
- **[React 19.1.0](https://react.dev)** - Modern React with latest features
- **[TypeScript 5](https://www.typescriptlang.org)** - Type-safe JavaScript development
- **[Turbopack](https://turbo.build/pack)** - Fast development builds

### Styling & UI Components

- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com)** - Beautifully designed component library
- **[Radix UI](https://www.radix-ui.com)** - Low-level UI primitives
- **[Lucide React](https://lucide.dev)** - Beautiful & consistent icon library

### Testing & Quality Assurance

- **[Vitest](https://vitest.dev)** - Fast unit testing framework
- **[Testing Library](https://testing-library.com)** - React component testing utilities
- **[ESLint](https://eslint.org)** - Code linting with Next.js configuration
- **[Prettier](https://prettier.io)** - Code formatting with Tailwind CSS plugin

## Recommended Folder Structure

This project follows a production-ready folder structure optimized for scalability and maintainability:

```
src/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Route groups for organization
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── api/                      # API routes
│   │   └── users/
│   │       └── route.ts
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error UI
│   └── not-found.tsx             # 404 page
│
├── components/                   # Reusable components
│   ├── ui/                       # Basic UI components (Shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   ├── forms/                    # Form-specific components
│   │   ├── LoginForm.tsx
│   │   └── ContactForm.tsx
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   └── features/                 # Feature-specific components
│       ├── auth/
│       ├── dashboard/
│       └── user-profile/
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── useToggler.ts
│
├── lib/                          # Utility libraries and configurations
│   ├── utils.ts                  # Utility functions
│   ├── validations.ts            # Zod schemas or validation logic
│   ├── constants.ts              # App constants
│   └── auth.ts                   # Authentication configuration
│
├── services/                     # External service integrations
│   ├── api.ts                    # API client configuration
│   ├── auth.ts                   # Authentication service
│   └── storage.ts                # File storage service
│
├── stores/                       # State management
│   ├── authStore.ts              # Authentication state
│   ├── userStore.ts              # User data state
│   └── index.ts                  # Store exports
│
├── types/                        # TypeScript type definitions
│   ├── auth.ts                   # Authentication types
│   ├── user.ts                   # User-related types
│   └── api.ts                    # API response types
│
├── styles/                       # Additional styles
│   ├── components.css            # Component-specific styles
│   └── utils.css                 # Utility classes
│
└── tests/                        # Test files
    ├── __mocks__/                # Mock files
    ├── components/               # Component tests
    ├── hooks/                    # Hook tests
    ├── utils/                    # Utility tests
    └── setup.ts                  # Test setup
```

### Folder Organization Principles

#### **Feature-Based Architecture**

- Group related files by feature rather than file type
- Each feature folder contains its own components, hooks, and types
- Promotes code locality and easier refactoring

#### **Separation of Concerns**

- **`/components`** - Pure UI components with minimal business logic
- **`/hooks`** - Reusable stateful logic
- **`/services`** - External API calls and integrations
- **`/stores`** - Global state management
- **`/lib`** - Pure utility functions and configurations

#### **Naming Conventions**

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

#### **Import Aliases**

Use the configured path aliases for cleaner imports:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

// ❌ Avoid
import { Button } from '../../../components/ui/button';
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

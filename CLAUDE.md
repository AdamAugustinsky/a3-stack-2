# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# A3 Stack Svelte - Project Documentation

## Project Overview

This is a modern full-stack web application built with the **A3 Stack**:

- **SvelteKit 5** - Full-stack framework with experimental features
- **Better Auth** - Modern authentication library
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Primary database
- **shadcn/ui (Svelte)** - UI component library
- **TailwindCSS v4** - Utility-first CSS framework

## Key Technologies & Features

### Core Stack

- **SvelteKit 2.27+** with experimental remote functions and async compiler
- **Svelte 5** with runes and modern reactive patterns
- **TypeScript** with strict configuration
- **Vite 7** for fast builds and development
- **Bun** as package manager (bun.lock present)

### Authentication System

- **Better Auth 1.3+** with Drizzle adapter
- Email/password authentication
- Session management with PostgreSQL storage
- Type-safe auth client for frontend integration

### Database & ORM

- **PostgreSQL** with Docker Compose setup
- **Drizzle ORM** with migrations and introspection
- Schema includes: users, sessions, accounts, verification tables
- Type-safe database queries and operations

### UI & Styling

- **shadcn/ui for Svelte** - Complete component library
- **TailwindCSS v4** with Vite plugin integration
- **Lucide icons** for consistent iconography
- Mobile-responsive design patterns

### Development Tools

- **ESLint** with TypeScript and Svelte plugins
- **Prettier** with Svelte and TailwindCSS plugins
- **TypeScript** with strict checking enabled
- **Drizzle Kit** for database operations

## Project Structure

```
src/
├── lib/
│   ├── components/ui/        # shadcn/ui components (extensive library)
│   ├── server/
│   │   ├── auth.ts          # Better Auth configuration
│   │   └── db/
│   │       ├── index.ts     # Database connection
│   │       └── schema.ts    # Drizzle schema definitions
│   ├── schemas/
│   │   └── auth.ts          # Valibot validation schemas
│   └── utils.ts             # Utility functions
├── routes/
│   ├── auth.remote.ts       # Remote functions for auth
│   ├── signin/
│   │   └── +page.svelte     # Sign in page
│   └── signup/
│       └── +page.svelte     # Sign up page
└── hooks.server.ts          # Server-side hooks
```

## Remote Functions Implementation

This project uses **SvelteKit Remote Functions** (experimental feature in 2.27+) as the primary way of interaction with the server, providing type-safe server-client communication. Remote functions allow you to call server-side code from anywhere in your app while maintaining type safety.

### Configuration

Remote functions are enabled in `svelte.config.js`:

```javascript
kit: {
  experimental: {
    remoteFunctions: true
  }
},
compilerOptions: {
  experimental: {
    async: true
  }
}
```

### Types of Remote Functions

#### 1. Form Functions

Used for handling form submissions with progressive enhancement. Always receive raw FormData.

```typescript
import { form } from '$app/server';
import { error, redirect } from '@sveltejs/kit';

export const createPost = form(async (data) => {
 const title = data.get('title');
 const content = data.get('content');

 // Manual validation required
 if (typeof title !== 'string' || typeof content !== 'string') {
  error(400, 'Title and content are required');
 }

 // Database operation
 await db.sql`
    INSERT INTO post (slug, title, content)
    VALUES (${slug}, ${title}, ${content})
  `;

 redirect(303, `/blog/${slug}`);
});
```

Usage in component:

```svelte
<form
 {...createPost.enhance(async ({ submit }) => {
  // Handle loading/errors
 })}
>
 <input name="title" />
 <textarea name="content"></textarea>
</form>
```

#### 2. Query Functions

For reading dynamic data from the server. Can accept typed arguments with automatic validation.

```typescript
import { query } from '$app/server';
import { type } from 'arktype';
import { error } from '@sveltejs/kit';

// Simple query without arguments
export const getPosts = query(async () => {
 const posts = await db.sql`
    SELECT title, slug, published_at
    FROM post
    ORDER BY published_at DESC
  `;
 return posts;
});

// With Valibot validation
import * as v from 'valibot';

const getPostSchema = v.object({
 slug: v.pipe(v.string(), v.minLength(1))
});

export const getPost = query(getPostSchema, async ({ slug }) => {
 const post = await db.getPost(slug);
 if (!post) error(404, 'Post not found');
 return post;
});

// More complex validation with Valibot
const searchPostsSchema = v.object({
 query: v.pipe(v.string(), v.minLength(1)),
 limit: v.pipe(v.number(), v.minValue(1), v.maxValue(100)),
 offset: v.pipe(v.number(), v.minValue(0)),
 category: v.optional(v.string())
});

export const searchPosts = query(searchPostsSchema, async ({ query, limit, offset, category }) => {
 // Input is automatically validated and typed
 return await db.searchPosts({ query, limit, offset, category });
});
```

Usage in component:

```svelte
<script>
 import { getPosts, getPost, searchPosts } from './data.remote';

 // With arguments
 const posts = await searchPosts({
  query: 'svelte',
  limit: 10,
  offset: 0
 });
</script>

{#await getPosts()}
 <p>Loading...</p>
{:then posts}
 {#each posts as post}
  <article>{post.title}</article>
 {/each}
{:catch error}
 <p>Error: {error.message}</p>
{/await}
```

#### 3. Command Functions

For write operations that can be called from anywhere. Supports Valibot validation.
Commands are the equivalents of POSTS to an API, we should only use it when forms are not the right solution for the problem, but forms should be our preferred solution.

```typescript
import { command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';

// Simple command with Valibot validation
const likeSchema = v.object({
 postId: v.pipe(v.string(), v.minLength(1))
});

export const incrementLikes = command(likeSchema, async ({ postId }) => {
 const result = await db.sql`
      UPDATE post
      SET likes = likes + 1
      WHERE id = ${postId}
      RETURNING likes
    `;

 if (!result.length) {
  error(404, 'Post not found');
 }

 // Optionally refresh related queries
 getPosts.refresh();

 return { likes: result[0].likes };
});

// More complex example with nested validation
const updateProfileSchema = v.object({
 userId: v.pipe(v.string(), v.minLength(1)),
 profile: v.object({
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.minValue(13), v.maxValue(120)))
 })
});

export const updateProfile = command(updateProfileSchema, async ({ userId, profile }) => {
 // Input is automatically validated and typed
 const user = await auth.getUser(userId);
 if (!user) error(404, 'User not found');

 await db.updateUser(userId, profile);

 // Refresh user queries
 getUser.refresh({ userId });
});
```

Usage in component:

```svelte
<script>
 import { incrementLikes, updateProfile } from './data.remote';

 async function handleLike(postId: string) {
  try {
   const result = await incrementLikes({ postId });
   console.log('New like count:', result.likes);
  } catch (error) {
   console.error('Failed to like post:', error);
  }
 }

 async function saveProfile() {
  try {
   await updateProfile({
    userId: currentUser.id,
    profile: {
     name: userName,
     email: userEmail,
     bio: userBio,
     age: userAge
    }
   });
  } catch (error) {
   // Validation errors are automatically handled
   console.error('Profile update failed:', error);
  }
 }
</script>

<button onclick={() => handleLike(post.id)}>
 Like ({post.likes})
</button>
```

#### 4. Prerender Functions

For generating static data at build time.

```typescript
import { prerender } from '$app/server';

export const getStaticPosts = prerender(
 async () => {
  const posts = await db.sql`
    SELECT title, slug
    FROM post
    WHERE published = true
  `;
  return posts;
 },
 {
  // Specify which pages to prerender
  inputs: () => [{ slug: 'first-post' }, { slug: 'second-post' }]
 }
);
```

### Current Implementation: Auth Remote Functions

This project currently uses form functions for authentication (`src/routes/auth.remote.ts`):

- `signin(data: FormData)` - Email/password sign in
- `signup(data: FormData)` - User registration
- Manual FormData validation (no automatic schema validation)
- Proper error handling with HTTP status codes
- Uses `error()` and `redirect()` from SvelteKit

### Key Differences from Traditional Actions

1. **Import Location**: Remote functions import from `$app/server`, not `@sveltejs/kit`
2. **Validation**: Form functions receive raw FormData, not validated inputs
3. **Error Handling**: Use `error()` function instead of returning fail objects
4. **Redirects**: Use `redirect()` function instead of returning redirect objects
5. **Type Safety**: Full TypeScript support across client-server boundary

### Enhanced Form Pattern (Current Usage)

```svelte
<script>
 import { signin } from '../auth.remote';
 import { isHttpError } from '@sveltejs/kit';

 let errorValue = $state<string | undefined>();
 let loading = $state(false);
</script>

<form
 {...signin.enhance(async ({ submit }) => {
  errorValue = undefined;
  loading = true;

  try {
   await submit();
   // Success - redirects handled automatically
  } catch (error) {
   if (isHttpError(error)) {
    errorValue = error.body.message;
   } else {
    errorValue = 'An unexpected error occurred';
   }
  } finally {
   loading = false;
  }
 })}
>
 <!-- form fields with disabled={loading} -->
</form>
```

### Validation with Valibot

This project uses Valibot for runtime validation. Query and command functions support automatic validation:

```typescript
import * as v from 'valibot';

// Basic types
const userIdSchema = v.pipe(v.string(), v.minLength(1));
const emailSchema = v.pipe(v.string(), v.email());
const ageSchema = v.pipe(v.number(), v.minValue(13), v.maxValue(120));

// Complex object validation
const userSchema = v.object({
 name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
 email: v.pipe(v.string(), v.email()),
 password: v.pipe(v.string(), v.minLength(8)),
 age: v.optional(v.pipe(v.number(), v.minValue(13), v.maxValue(120))),
 tags: v.pipe(v.array(v.string()), v.maxLength(10)) // Array with max 10 items
});

// Union types
const statusSchema = v.union([
 v.literal('active'),
 v.literal('inactive'),
 v.literal('pending')
]);

// Nested objects
const postSchema = v.object({
 title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
 content: v.pipe(v.string(), v.minLength(1)),
 author: v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.string()
 }),
 tags: v.array(v.string()),
 published: v.boolean(),
 publishedAt: v.optional(v.date())
});
```

**Important**: Form functions do NOT support automatic validation - you must validate FormData manually:

```typescript
export const createPost = form(async (data) => {
 // Manual validation required for form functions
 const title = data.get('title');
 if (typeof title !== 'string' || !title) {
  error(400, 'Title is required');
 }
});
```

### Best Practices

1. **Validation**:
   - Use Valibot schemas for query/command functions
   - Manually validate FormData in form functions
   - Define reusable schemas in separate files
2. **Error Messages**: Use descriptive error messages with appropriate HTTP status codes
3. **Loading States**: Implement loading states for better UX
4. **Type Safety**:
   - Use `isHttpError` for proper error typing
   - Valibot provides automatic TypeScript types via `v.InferOutput`
5. **Organization**:
   - Group related remote functions in single files (e.g., `auth.remote.ts`)
   - Keep validation schemas close to their usage

## Database Setup & Management

### Local Development

1. **Start PostgreSQL**: `npm run db:start` (Docker Compose)
2. **Push schema**: `npm run db:push`
3. **Generate migrations**: `npm run db:generate`
4. **Run migrations**: `npm run db:migrate`
5. **Database studio**: `npm run db:studio`

### Environment Variables

Required in `.env`:

```
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

### Schema Overview

- **user**: Core user data with email verification
- **session**: Session management with expiration
- **account**: OAuth and password account data
- **verification**: Email verification tokens

## Development Commands

### Primary Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run check` - Type checking
- `npm run lint` - ESLint and Prettier checks
- `npm run format` - Format code with Prettier

### Database Commands

- `npm run db:start` - Start PostgreSQL container
- `npm run db:push` - Push schema changes
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

## Authentication Flow

### Better Auth Integration

- Server-side configuration in `src/lib/server/auth.ts`
- Frontend client in `src/lib/auth-client.ts`
- Session management with PostgreSQL adapter
- Email/password provider enabled

### Auth Pages

- **Sign In**: `/signin` - Uses remote function for authentication
- **Sign Up**: `/signup` - User registration with validation
- **Home**: `/` - Displays user session state

### Security Features

- Type-safe session handling
- Proper error handling and user feedback
- Loading states for better UX
- Form validation with Valibot schemas

## Component Library

### shadcn/ui Components Available

Extensive collection including:

- **Forms**: Button, Input, Label, Checkbox, Select, Textarea
- **Layout**: Card, Sheet, Dialog, Drawer, Sidebar
- **Navigation**: Breadcrumb, Navigation Menu, Pagination
- **Data Display**: Table, Data Table, Badge, Avatar
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Overlays**: Popover, Tooltip, Context Menu, Dropdown Menu
- **Advanced**: Calendar, Date Picker, Charts, Carousel

### Component Usage

```svelte
import {Button} from '$lib/components/ui/button'; import {(Card, CardContent, CardHeader)} from '$lib/components/ui/card';
```

## TypeScript Configuration

### Strict Settings

- Full TypeScript strict mode enabled
- ESModule interop and consistent casing
- Bundler module resolution
- Source maps for debugging

### Path Aliases

- `@/*` → `./src/lib/*` (configured in svelte.config.js)
- `$lib/*` → `./src/lib/*` (SvelteKit default)

## Code Quality & Standards

### ESLint Configuration

- TypeScript and Svelte rules
- Prettier integration
- Browser and Node globals
- Custom rule: `no-undef` disabled for TypeScript

### Prettier Configuration

- Svelte-aware formatting
- TailwindCSS class sorting
- Consistent code style across project

## Key Implementation Notes

### Remote Functions vs Form Actions

- **Remote Functions**: Type-safe client-server communication, manual validation
- **Form Actions**: Traditional server actions with automatic validation
- This project uses remote functions for modern approach

### Svelte 5 Patterns

- `$state()` runes for reactive state
- `$derived()` for computed values
- Modern component composition
- Enhanced type safety

### Error Handling Strategy

- HTTP status codes for different error types
- User-friendly error messages
- Loading states for async operations
- Proper TypeScript error typing with `isHttpError`

## Production Considerations

### Build Configuration

- **Adapter**: Node.js adapter for server deployment
- **Vite Optimization**: TailwindCSS and SvelteKit plugins
- **TypeScript**: Strict checking enabled
- **Source Maps**: Available for debugging

### Environment Setup

- Database URL configuration required
- Better Auth needs proper base URL
- Docker setup for local PostgreSQL

## Getting Started

1. **Install dependencies**: `bun install`
2. **Setup environment**: Copy `.env.example` to `.env`
3. **Start database**: `npm run db:start`
4. **Push schema**: `npm run db:push`
5. **Start development**: `npm run dev`

The application will be available at `http://localhost:5173` with full authentication functionality.

## Architecture Decisions

### Why Remote Functions?

- Type-safe server-client communication
- Simplified data flow compared to form actions
- Better integration with modern Svelte patterns
- Experimental feature showcasing SvelteKit's future

### Why Better Auth?

- Modern authentication library with great TypeScript support
- Better session management than traditional solutions
- Excellent Drizzle ORM integration
- Built for modern frameworks like SvelteKit

### Why This UI Stack?

- **shadcn/ui**: Industry standard component library
- **TailwindCSS v4**: Latest utilities with better performance
- **Lucide Icons**: Consistent and modern iconography
- **Mobile-first**: Responsive design from the ground up

This project demonstrates modern full-stack development patterns with SvelteKit, showcasing experimental features and best practices for authentication, database management, and user interface development.


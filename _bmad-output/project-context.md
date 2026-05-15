---
project_name: 'piggi-pm'
user_name: 'Jack'
date: '2026-02-23T21:36:00.000Z'
sections_completed: ['technology_stack', 'architecture', 'database', 'caching', 'authentication', 'state_management', 'cron_jobs', 'notifications', 'anti_patterns']
status: 'complete'
rule_count: 150
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Backend Services (NestJS)
- **NestJS**: `^10.0.0`
- **TypeORM**: `^0.3.17`
- **Mongoose**: `^8.0.1` - `^8.4.1`
- **MySQL2**: `^3.6.4` - `^3.6.5`
- **Redis**: `^4.1.2` (cache-manager-redis-yet)
- **Elasticsearch**: `10.0.1` - `^10.0.2`
- **gRPC**: `^1.9.13` - `^1.13.4` (@grpc/grpc-js)
- **RabbitMQ**: `^0.10.8` (amqplib)
- **Sentry**: `^8.51.0` - `^8.55.0`
- **TypeScript**: `^5.1.3` - `^5.3.2`

### Backend Service (Go)
- **Go**: `1.23.1`
- **Echo Framework**: `v4.12.0`
- **GORM**: `v1.25.12`
- **Redis**: `v9.7.0` (go-redis)
- **Firebase**: `v4.18.0`

### Frontend CMS (Nuxt)
- **Nuxt**: `^3.4.3` (SSR disabled)
- **Vuetify**: `3.2.1`
- **Pinia**: `^2.0.36`
- **TailwindCSS**: `^6.6.7`
- **Socket.io-client**: `^4.8.1`
- **Yarn**: `1.22.22` (locked)

### Mobile App (React Native)
- **React Native**: `0.77.0`
- **React**: `^18.3.1`
- **Redux Toolkit**: `^2.2.7`
- **React Navigation**: `^6.x`
- **NativeWind**: `^2.0.11`
- **TypeScript**: `5.0.4`
- **Node**: `>=18` (required)

### Shared Packages
- **@piggi-group/piggi-portal-database**: `1.8.2` - `1.9.0-rc.3` (version sync critical)
- **@piggi-group/piggi-public-grpc**: `1.0.58` - `1.1.3`

### Version Constraints
- **Database Package Sync**: Different services use different versions of `@piggi-group/piggi-portal-database` - sync required on breaking changes
- **TypeScript Target**: NestJS services use `ES2021`, React Native uses `@react-native/typescript-config`
- **React Native 0.77**: Latest version - verify third-party library compatibility

## Critical Implementation Rules

### Mono-repo & Architecture

**Git Submodules:**
- This is a mono-repo managing 10 microservices via git submodules
- Initialize: `make git-submodules-init` or `git submodule init && git submodule update`
- Each submodule is an independent repository with its own git history
- NEVER commit submodule changes to parent repo - commit in submodule first, then update reference

**Database Architecture:**
- **Dual Database Pattern**: Many services use both MySQL (TypeORM) + MongoDB (Mongoose)
  - MySQL: Transactional data (users, deals, tasks, rankings)
  - MongoDB: Queue/logging data (flash sale queues, product live queues)
- **Shared Database Package**: All entities/models from `@piggi-group/piggi-portal-database`
  - DO NOT define entities in service repos
  - Import from shared package: `import { User, Deal } from '@piggi-group/piggi-portal-database'`

**Service Communication:**
- **gRPC Microservices**: 3 main services communicate via gRPC (Worker Product, Notification, Publisher)
- **RabbitMQ**: Message queue for async processing (chat messages, topic subscriptions)
- **Redis**: Shared cache layer across services
- NEVER call HTTP endpoints directly between services - use gRPC or message queue

**Path Aliases:**
- NestJS services: `@/common/*`, `@/config/*`, `@/modules/*`
- React Native: `components/*`, `services/*`, `store/*`, `helpers/*`
- Nuxt: Auto-imports enabled (no explicit paths needed)

**Hexagonal Architecture (Go Service):**
- Strict 3-layer separation: Controller → Service → Repository
- All interfaces defined in `src/abstract/`
- Dependency injection via `repository.Container`
- NEVER skip layers or call repository directly from controller

**Service-Specific Global Prefixes:**
- `worker-product-consulting`: `/worker` prefix
- `api-portal`: No global prefix (direct routes)
- `api-portal-golang`: `/api/*` and `/api/v2/*` for versioning

**Critical Rules:**
- When updating `@piggi-group/piggi-portal-database`, test ALL services using it
- Proto changes in `@piggi-group/piggi-public-grpc` require rebuild of all consuming services
- Each service has own `.env` file - do not share environment variables

### Database & Transaction Patterns

**QueryRunner Pattern (TypeORM - for Atomic Operations):**
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
    // Perform operations
    await queryRunner.commitTransaction();
} catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
} finally {
    await queryRunner.release();
}
```
- Use for: Flash sale distribution, task matching, ranking updates, gift transactions
- NEVER use plain repository methods for operations requiring atomicity

**Cursor-based Pagination (Preferred for Large Datasets):**
```typescript
let cursor = 0;
const batchSize = 1000;
while (true) {
    const items = await query.where('id > :cursor', { cursor })
        .take(batchSize).getMany();
    if (!items.length) break;
    cursor = items[items.length - 1].id;
}
```
- Prevents missing records during batch processing
- Use instead of offset-based pagination for large datasets

**Race Condition Prevention:**
```typescript
// CORRECT: Database-level locking with status check
await repository.update(
    { id, status: 'PENDING' },  // WHERE includes current status
    { status: 'MATCHING', locked: true }
);

// WRONG: Check then update (race condition prone)
const task = await repository.findOne({ id });
if (task.status === 'PENDING') {
    await repository.update({ id }, { status: 'MATCHING' });
}
```

**Lock Management:**
- Use `locked` field (boolean or timestamp)
- Set to `true`/`NOW()` when processing, `null` when done
- ALWAYS check lock status before processing

**Status Change Logging:**
```typescript
statusChangeLog: () => `IF(statusChangeLog IS NULL OR statusChangeLog = '', '${log}', CONCAT(statusChangeLog, ',${log}'))`
```
- Format: `"STATUS by server (timestamp)"`
- Used for audit trails in task matching, rankings, flash sales

**GORM Patterns (Go Service):**
- Use `.Limit(1).Find()` instead of `.Take()`
- NEVER use `.Take()` - it throws `gorm.ErrRecordNotFound` when no result
- Prefer explicit error checking

**Critical Database Rules:**
- All entities from `@piggi-group/piggi-portal-database` - never define locally
- Use QueryRunner for multi-step operations requiring rollback
- Cursor-based pagination prevents missing records in batch processing
- Update with status in WHERE clause to prevent race conditions
- Let TypeORM/GORM manage connection pooling

### Caching Strategy & Redis Patterns

**RedisCacheService API (NestJS):**
```typescript
get(key)                    // Retrieve cached value
set(key, value, ttl)        // Set with TTL (milliseconds)
del(key)                    // Delete single key
getKeys(pattern)            // Get keys matching pattern
delKeys(pattern, query?)    // Delete keys matching pattern
```

**Cache Key Naming Patterns:**
- `CACHE_PUBLISHER_ACCESS_TOKEN`
- `CACHE_LOYALTY_PRODUCT`
- `CACHE_DEAL`
- `CACHE_PRODUCT_LIVE_${shopId}_${itemId}`
- Use consistent prefixes with wildcards for batch operations

**Caching Strategy by API Type:**
- **Public APIs**: Cache via Cloudflare (edge caching), set `Cache-Control` headers
- **Auth APIs (immediate reflection)**: Redis with invalidation logic on writes
- **Auth APIs (duration OK)**: Client-side caching with `Cache-Control` headers

**Cache Invalidation Patterns:**
```typescript
// Write-through: Invalidate immediately on update
async updateDeal(id, data) {
    await repository.update(id, data);
    await cache.del(`CACHE_DEAL_${id}`);
}

// Lazy: Invalidate on next read miss
async getDeal(id) {
    let deal = await cache.get(`CACHE_DEAL_${id}`);
    if (!deal) {
        deal = await repository.findOne(id);
        await cache.set(`CACHE_DEAL_${id}`, deal, TTL);
    }
    return deal;
}
```

**TTL Guidelines:**
- **60s - 5min**: User sessions, real-time counters
- **5min - 1hr**: Deal listings, product info
- **1hr - 24hr**: Static configs, categories
- **No TTL**: Access tokens (manual invalidation only)

**Critical Caching Rules:**
- ALWAYS invalidate cache when data changes
- Set TTL unless explicitly requiring manual invalidation
- No circular dependencies in cached data
- Always have database fallback on cache miss
- Use pattern-based keys for batch invalidation

**WebSocket Caching:**
- Socket.io uses Redis adapter (`@socket.io/redis-adapter`) for multi-instance event sharing
- No manual caching needed - adapter handles it

### Authentication & Authorization

**Authentication Methods:**
- **JWT**: Configurable expiry, Bearer token format required
- **OAuth**: Google Sign-In, Apple Sign-In (mobile app)
- **OTP**: SMS-based for phone verification
- **Token Storage**:
  - CMS: Cookie-based (`accessToken`)
  - Mobile: Redux Persist + React Native Keychain

**CASL Permission System (CMS):**
```typescript
// Custom directive
v-can="'VOUCHER_VIEW'"
v-can="{ action: 'read', subject: 'Voucher' }"

// Programmatic check
usePermissionUrl().checkPermission('YOUR_PERMISSION')
```
- Permission constants in `src/constants/permissionName.js`
- Route mapping in `ROUTERS_PERMISSION` object

**NestJS Guards & Decorators:**
```typescript
@Permission('VOUCHER_VIEW')          // Permission check
@FeaturesDecorator('feature_key')    // Feature flag check
@User()                               // Extract user from context
```
- Feature flags controlled by `ENABLE_FEATURE_BLOCK_GUARD`

**Token Injection Patterns:**
```typescript
// Mobile (RTK Query): Auto-inject from Redux state
prepareHeaders: (headers, { getState }) => {
    const token = selectAuth(getState()).token;
    if (token) headers.set('authorization', `Bearer ${token}`);
}

// CMS (usePubFetch): Auto-inject from cookies
// Handles 401/403 with redirect to login
```

**Global Middleware:**
- **CMS**: `admin.global.js` - runs on every route, validates auth & permissions
- **Worker**: API key middleware validates `WORKER_PRODUCT_API_KEY`

**Critical Auth Rules:**
- ALWAYS use `Bearer {token}` format for JWT in headers
- Check permissions BEFORE rendering UI or calling APIs
- Handle 401 responses globally with redirect to login
- Use `@FeaturesDecorator` for feature access control, not hardcoded checks
- NEVER pass tokens in URL query params - use headers only
- All protected routes must have permission validation in middleware/guards

### State Management & API Patterns

**CMS Portal (Nuxt + Pinia):**

**API Layer Pattern:**
```typescript
// Composable factory in src/api/*.js
export const useVoucherAPI = () => {
  const getVouchers = (params) => usePubFetch('/voucher', { params });
  return { getVouchers, createVoucher };
};

// Aggregated via src/plugins/api.js (50+ modules)
const { $api } = useNuxtApp();
$api.vouchers.getVouchers();
```

**usePubFetch Wrapper:**
- Wraps `useFetch` with auth token injection
- Base URL from `runtimeConfig.public.apiHost`
- Auto-handles 401/403 with redirect
- NEVER use raw `useFetch` - always use `usePubFetch`

**Pinia Store Pattern:**
```typescript
// 60+ stores in src/stores/ (auto-imported)
defineStore('storeName', {
    state: () => ({ ... }),
    actions: { ... },
    getters: { ... }
});

// ALWAYS add HMR support
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useStoreName, import.meta.hot));
}
```

**Data Flow:** Page → Pinia Store → $api composable → usePubFetch → Backend

**Mobile App (React Native + Redux Toolkit):**

**RTK Query Pattern:**
```typescript
// All services in src/services/*.service.ts
export const dealApi = createApi({
    reducerPath: 'dealApi',
    baseQuery: baseQueryWithAuth,  // Auto-injects token
    endpoints: (builder) => ({ ... })
});

// Add to store middleware
configureStore({
    reducer: { [dealApi.reducerPath]: dealApi.reducer },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(dealApi.middleware)
});
```

**Redux Persist:**
```typescript
// Explicit whitelist - NEVER persist everything
persistConfig: {
    whitelist: ['auth', 'app', 'popupIcon', 'device',
                'loyaltyWallet', 'game', 'banner', 'cache', 'setting']
}
```

**Remote Settings (Feature Flags):**
```typescript
import { selectSetting } from 'store/selectors/setting.selector';

const { settingPortal, settingBgg } = useSelector(selectSetting);
const isEnabled = settingPortal?.['FEATURE_KEY']?.value === 'true';

// Auto-refresh on app resume
dispatch(fetchSettingPortal());
```

**Critical State Management Rules:**
- CMS: ALWAYS use `$api` aggregated object, never direct fetch
- CMS: Use `usePubFetch` wrapper, never raw `useFetch`
- Mobile: All API calls via RTK Query, never axios directly
- Mobile: Explicitly whitelist Redux Persist slices
- Use `settingPortal`/`settingBgg` for feature flags, NOT hardcoded booleans
- Pinia stores auto-imported, Redux slices must be manually added to store
- ALWAYS add `acceptHMRUpdate` to Pinia stores
- Get auth token from Redux/Pinia state, never from localStorage directly

### Cron Jobs & Scheduled Tasks

**Cron Job System (NestJS):**
```typescript
// Centralized in src/common/cron/cron.service.ts
@CronWithSentry({
    cronTime: TIME_CRON_JOB_X,
    waitForCompletion: true,  // Prevents overlapping
    enabled: CRON_JOB_X_ENABLED
})
async jobMethodName() {
    // Job logic
}
```

**Environment-based Configuration:**
```bash
# Individual enable flags (default: false)
CRON_JOB_FLASH_SALE_PROCESS=false
CRON_JOB_USER_RANKING_UPDATE=false

# Cron expressions
TIME_CRON_JOB_FLASH_SALE="*/30 * * * * *"  # Every 30s
TIME_CRON_JOB_RANKING="0 0 * * 0"          # Weekly

# Timezone
TIMEZONE_CRON="Asia/Ho_Chi_Minh"
```

**Cron Job Frequency Categories:**
- **High-frequency (seconds)**: Flash sales, livestream crawling
- **Hourly**: Feedback cleanup, product crawling, task matching
- **Daily**: Ranking updates, referral checks, gift quantity
- **Weekly/Quarterly**: Rank evaluation, points reset

**Adding New Cron Jobs (REQUIRED STEPS):**
1. Add env variables in `src/common/environment.ts`:
```typescript
export const CRON_JOB_MY_TASK_ENABLED = getBoolean('CRON_JOB_MY_TASK_ENABLED', false);
export const TIME_CRON_JOB_MY_TASK = getString('TIME_CRON_JOB_MY_TASK', '0 0 * * *');
```
2. Add to `.env.example` with default `false`
3. Create method in `CronService` with `@CronWithSentry` decorator
4. Inject required services via constructor

**Critical Cron Job Rules:**
- All jobs MUST default to `false` in development
- ALWAYS set `waitForCompletion: true` to prevent overlapping
- Each job has individual enable flag - never use global flag
- Use `TIMEZONE_CRON` for schedule, `TIMEZONE` for business logic
- Use cursor-based pagination for large datasets
- Design jobs to be idempotent (safe to run multiple times)
- Check and set `locked` field before processing records
- `@CronWithSentry` auto-captures errors - don't duplicate tracking

**Common Cron Expressions:**
```bash
"*/30 * * * * *"    # Every 30 seconds
"0 */1 * * *"       # Every hour
"0 0 * * *"         # Daily at midnight
"0 0 * * 0"         # Weekly on Sunday
"0 0 1 */3 *"       # Quarterly
```

### Notification & Messaging Patterns

**Notification Flow:**
- **Publishers**: cms-portal (tagged users), api-portal (order workers), worker-product-consulting (events)
- **Delivery**: api-notification service handles APNS, FCM, Telegram, Zalo

**gRPC Communication:**
```typescript
// Observable helper converts gRPC to Promise
import { observableToPromise } from '@/helpers/observable.helper';

const result = await observableToPromise(
    this.grpcClient.sendNotify(payload)
);
```

**Notification Payload Structure:**
```typescript
{
    title: string,              // Vietnamese text required
    description: string,        // Vietnamese text required
    userIds: string[],          // Recipient IDs
    type: NOTIFICATION_TYPE,    // e.g., NOTIFICATION_TYPE.IMPORTANT
    data: {
        navigation: NavigationAppEnum,  // Deep link enum
        imageUrl?: string
    }
}
```

**Retry Mechanism:**
```typescript
// Configurable retry with exponential backoff
RETRY_SEND_NOTIFICATION=3              // Max retries
DELAY_RETRY_SEND_NOTIFICATION=10000    // 10s delay

async retrySendNotification(payload, retry = 0) {
    try {
        await this.grpcClient.sendNotify(payload);
    } catch (error) {
        retry++;
        if (retry <= RETRY_SEND_NOTIFICATION) {
            await delay(DELAY_RETRY_SEND_NOTIFICATION);
            return this.retrySendNotification(payload, retry);
        }
    }
}
```

**Real-time Chat (Socket.io):**
- Token-based WebSocket authentication
- Redis adapter (`@socket.io/redis-adapter`) for multi-instance support
- RabbitMQ consumers process chat messages asynchronously

**Message Queue (RabbitMQ):**
```typescript
// Queues: chat.messages, topic.subscriptions
// Uses amqp-connection-manager for auto-reconnection

Message structure:
{
    pattern: 'message_type',
    data: { ... }
}
```

**Deep Link Navigation:**
```typescript
// Use NavigationAppEnum for internal routes
noti://home
noti://loyalty
noti://deal/{id}
```

**Critical Notification Rules:**
- ALWAYS use gRPC client for notifications, never direct HTTP
- Use `observableToPromise` to convert gRPC Observables
- Implement configurable retry with exponential backoff
- All `title` and `description` must be in Vietnamese
- Use `NavigationAppEnum` for `data.navigation`, not hardcoded strings
- Use RabbitMQ for async chat processing, not direct writes
- Socket.io MUST use Redis adapter for multi-instance deployments
- WebSocket connections must authenticate with JWT token
- Design notification logic to be idempotent (safe to retry)

**gRPC Services:**
```typescript
// Configured in src/config/grpc.config.ts
GRPC_URL_WORKER_PRODUCT_CONNECTION
GRPC_URL_PUBLISHER_CONNECTION
GRPC_URL_NOTIFICATION_CONNECTION

// Proto files from @piggi-group/piggi-public-grpc
```

### Critical Don't-Miss Rules & Anti-Patterns

**Database Anti-Patterns:**
```typescript
// ❌ WRONG: Check then update (race condition)
const task = await repository.findOne({ id });
if (task.status === 'PENDING') {
    await repository.update({ id }, { status: 'MATCHING' });
}

// ✅ CORRECT: Atomic update with status check
await repository.update({ id, status: 'PENDING' }, { status: 'MATCHING' });

// ❌ WRONG: Offset pagination for batch processing
const users = await query.skip(offset).take(batchSize);

// ✅ CORRECT: Cursor-based pagination
const users = await query.where('id > :cursor', { cursor }).take(batchSize);

// ❌ WRONG (Go): Using .Take()
db.Take(&user)  // Throws error when not found

// ✅ CORRECT (Go): Using .Limit(1).Find()
db.Limit(1).Find(&user)  // Returns empty, no error
```

**Architecture Anti-Patterns:**
```typescript
// ❌ WRONG: Define entities in service repo
@Entity() export class User { ... }

// ✅ CORRECT: Import from shared package
import { User } from '@piggi-group/piggi-portal-database';

// ❌ WRONG: Direct HTTP between services
await axios.post('http://other-service/api/endpoint');

// ✅ CORRECT: Use gRPC
await observableToPromise(this.grpcClient.callMethod(payload));

// ❌ WRONG (Go): Skip layers
controller -> repository  // Missing service layer

// ✅ CORRECT (Go): Hexagonal architecture
controller -> service -> repository
```

**State Management Anti-Patterns:**
```typescript
// ❌ WRONG (CMS): Direct fetch
const data = await fetch('/api/vouchers');

// ✅ CORRECT (CMS): Use $api
const data = await $api.vouchers.getVouchers();

// ❌ WRONG (Mobile): Direct axios
const data = await axios.get('/api/deals');

// ✅ CORRECT (Mobile): Use RTK Query
const { data } = useGetDealsQuery();

// ❌ WRONG: Hardcoded feature flags
if (true) { enableFeature(); }

// ✅ CORRECT: Use remote settings
if (settingPortal?.['FEATURE_KEY']?.value === 'true') { ... }
```

**Edge Cases to Handle:**

**Submodule Updates:**
```bash
# ❌ WRONG: Commit submodule changes in parent
git add api-portal/ && git commit

# ✅ CORRECT: Commit in submodule first
cd api-portal/ && git commit && git push
cd .. && git add api-portal  # Update reference only
```

**Lock Management:**
```typescript
// ❌ WRONG: Process without checking lock
const task = await repository.findOne({ id });
await processTask(task);

// ✅ CORRECT: Check and set lock atomically
const result = await repository.update(
    { id, locked: null },
    { locked: new Date() }
);
if (result.affected === 0) return;  // Already locked
```

**Status Transitions:**
```typescript
// ❌ WRONG: Arbitrary status changes
task.status = 'COMPLETED';

// ✅ CORRECT: Follow status flow (never skip states)
PENDING → MATCHING → ACCEPTED → IN_PROGRESS → COMPLETED/FAILED/SKIPPED
```

**Security Gotchas:**
- Never commit `.env` files - use `.env.example` only
- API keys via environment variables, not hardcoded
- Never pass JWT in URL query params - use headers only
- Don't log passwords, tokens, or PII
- Use parameterized queries (TypeORM/GORM auto-handles)

**Performance Gotchas:**
- N+1 queries: Use eager loading or joins
- Cursor fields should be indexed
- Always paginate, never fetch all records
- Always set cache TTL unless manual invalidation required
- Use async queue for non-critical notifications

**TypeScript Gotchas:**
- `strictNullChecks: false` in NestJS - be careful with null/undefined
- Use path aliases (`@/common/*`), not relative paths
- Avoid `any` - use types from shared packages
- Decorators require `experimentalDecorators: true`

**React Native Gotchas:**
- Use path aliases (`components/*`), configured in tsconfig + babel
- Redux Persist: Whitelist slices explicitly
- CodePush can be disabled via `disableCodePush` flag
- Requires Node `>=18`

**Go Service Gotchas:**
- API paths must use kebab-case (`/api/my-endpoint`)
- NEVER use `.Take()` - use `.Limit(1).Find()`
- NEVER skip layers - always go Controller → Service → Repository
- Add new repos to `repository.Container` struct

**Cron Job Gotchas:**
- Default MUST be `false` in development
- ALWAYS set `waitForCompletion: true`
- Each job needs individual enable flag
- Use `TIMEZONE_CRON` for schedule, `TIMEZONE` for business logic
- Design jobs to be idempotent (safe to run multiple times)

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-23

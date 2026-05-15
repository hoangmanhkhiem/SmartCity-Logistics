---
title: 'Redesign Notification Sending Flow with Target-based API and Cached Device Lists'
slug: 'redesign-notification-sending-flow'
created: '2026-04-13'
status: 'in-progress'
baseline_commit: '6b8e555aec3ff07777d3bcde9fa8f43a4563a597'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['NestJS', 'TypeORM', 'In-Memory Cache', 'REST API', 'MySQL', 'Path Aliases']
files_to_modify: [
  'api-notification/src/modules/mobile/mobile.controller.ts',
  'api-notification/src/modules/mobile/mobile.service.ts',
  'api-notification/src/modules/mobile/dto/*.ts',
  'api-cms/src/modules/deal/deal.service.ts',
  'api-notification/src/common/environment.ts'
]
code_patterns: [
  'Repository Pattern with DI',
  'QueryBuilder for complex queries',
  'EXISTS subqueries for performance',
  'TTL-based caching with incremental updates',
  'Batch processing',
  'Path aliases (@common/*, @modules/*)'
]
test_patterns: ['Jest with ts-jest', 'Mock repositories in tests', 'E2E tests in test/ directory']
---

# Tech-Spec: Redesign Notification Sending Flow with Target-based API and Cached Device Lists

**Created:** 2026-04-13

## Overview

### Problem Statement

Current notification flow quá chậm vì phải trải qua 3 bước tốn thời gian:

1. **Populate user list**: Sender service phải query và populate danh sách userIDs (ví dụ: khi tạo deal mới, cms-api phải query tất cả users trong deal_category)
2. **Find active devices**: api-notification nhận userIDs list, phải query devices table để lấy active notification devices
3. **Send notifications**: portal-golang notification-consumer consume messages và deliver (bước này đã được optimize)

Bottleneck nằm ở bước 1 và 2, đặc biệt khi gửi notification cho large user segments (all users, popular categories).

### Solution

Redesign notification flow với approach mới:

**Target-based API Pattern:**
- Sender service không cần populate userID list nữa
- Chỉ cần specify target type và target value
- api-notification v2 sẽ handle việc resolve target → device tokens

**Cached Device List với Incremental Update:**
- Maintain in-memory cache cho device lists theo từng target type
- Cache structure: `Map<targetValue, { deviceIds, apnsTokens, fcmTokens, lastUpdated }>`
- First call: query full dataset và cache
- Subsequent calls: chỉ query devices updated sau `lastUpdated`, merge vào cache
- Performance boost: giảm query time từ seconds → milliseconds cho subsequent calls

**Pre-warming Strategy (Configurable via ENV):**
- Khi service khởi động, pre-load cache dựa vào environment variables:
  - `PRE_LOAD_CACHE_ALL_DEVICES=true/false` - Load all users devices vào cache
  - `PRE_LOAD_DEAL_CATEGORY="1,2,3"` - Comma-separated list of category IDs to pre-load. Nếu empty → skip pre-load
- Avoid slow first-send problem cho popular targets
- Flexibility: Dev/staging có thể disable pre-load để faster startup

### Scope

**In Scope:**
- ✅ Tạo REST API v2 endpoint `/v2/send-notification` trong `api-notification`
- ✅ Implement `AllUsersDeviceService` với in-memory cache cho target `all_users`
- ✅ Implement `DealCategoryDeviceService`:
  - In-memory cache dạng `Map<categoryId, deviceListData>`
  - Incremental update based on `deal_category_users.updatedAt`
- ✅ Implement `UserTagDeviceService` (NO cache, query trực tiếp mỗi lần)
- ✅ Implement `SpecificUsersDeviceService` (giống v1, query trực tiếp từ userIds)
- ✅ Service startup: Configurable pre-warm cache via ENV
  - `PRE_LOAD_CACHE_ALL_DEVICES` (boolean) - Pre-load all users devices
  - `PRE_LOAD_DEAL_CATEGORY` (comma-separated IDs) - Pre-load specific categories, empty = skip
- ✅ Query devices phải join với `users.configs.pushNotification` để filter based on notification importance
- ✅ Support target types: `all_users`, `user_tag:{tagId}`, `deal_category:{categoryId}`, `specific`
- ✅ Maintain backward compatibility: existing gRPC `sendNotify` method vẫn hoạt động
- ✅ **Update `api-cms/deal.service.ts` để sử dụng v2 API khi tạo deal**

**Out of Scope:**
- ❌ Migrate tất cả existing services sang v2 (chỉ migrate deal creation flow, các service khác migrate sau)
- ❌ Redis caching (phase 1 dùng in-memory, có thể migrate Redis later nếu cần scale horizontal)
- ❌ Cache cho `user_tag` target (query trực tiếp do tag membership thay đổi frequently)
- ❌ Performance optimization cho v1 flow (focus vào v2)
- ❌ Changes to notification delivery logic (FCM/APNS sending logic giữ nguyên)

## Context for Development

### Codebase Patterns

**Current Notification Flow (v1) - Deal Creation Example:**

*api-cms/src/modules/deal/deal.service.ts:*
- `create()` method (line 305):
  - Saves deal to database
  - Line 367-377: Notification logic:
    - If `dto.isSendToAllUsers === true` → calls `sendNotificationToAllUsersDeal()`
    - Else → calls `sendNotificationsToUsersDeal()`

- `sendNotificationsToUsersDeal()` (line 485-515):
  ```typescript
  // Step 1: Query deal_category_users + INNER JOIN users
  const dealCategoryUsers = await this.dealCategoryUserRepository
    .createQueryBuilder('dealCategoryUser')
    .innerJoin('dealCategoryUser.user', 'user')
    .where('dealCategoryUser.dealCategoryId IN (:...dealCategoryIds)', { dealCategoryIds })
    // EXISTS subquery to ensure user has device tokens
    .andWhere('EXISTS (SELECT 1 FROM devices WHERE device.userId = user.id AND (fcmToken IS NOT NULL OR apnsToken IS NOT NULL))')
    .select(['dealCategoryUser.userId', 'user.id'])
    .orderBy('user.activeScores', 'DESC')
    .getMany();
  
  // Step 2: Extract userIds
  const userIds = dealCategoryUsers.map(dcu => dcu.userId);
  
  // Step 3: Call notification service with userIds
  await this.notificationService.retrySendNotification({
    title, description, userIds, type, data
  });
  ```

*api-notification/src/modules/mobile/mobile.service.ts:*
- Existing REST endpoint: `POST /mobile/send-notify` (controller line 47-50)
- `sendNotify()` method (line 344-371):
  ```typescript
  // Route 1: topic === 'all_users' → sendNotificationToAllUsers()
  if (dto.topic === 'all_users') {
    await this.sendNotificationToAllUsers(dto, isPush);
  }
  // Route 2: specific userIds → sendNotificationToSpecificUsers()
  else {
    await this.sendNotificationToSpecificUsers(dto, isPush);
  }
  ```

- `_getDevices()` (line 686-720):
  ```typescript
  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .innerJoin('user.devices', 'device')
    .select([
      'user.id as userId',
      'device.deviceId', 'device.fcmToken', 'device.apnsToken',
      'device.os', 'device.userIds',
      'user.configs as configs'  // ← Contains pushNotification flag
    ])
    .where('user.id IN (:...userIds)', { userIds })
    .andWhere('(device.fcmToken IS NOT NULL OR device.apnsToken IS NOT NULL)');
  ```

- **Existing Cache Implementation** for `all_users`:
  - Method: `_getDevicesAndSaveCache()` (line 526+)
  - Cache structure: 
    ```typescript
    {
      fcmTokens: string[],  // Format: "userId|deviceId|token"
      apnsTokens: string[],
      lastUpdate: Date
    }
    ```
  - TTL: `CACHE_TTL_MS` (configurable)
  - Strategy: Full refresh when stale, incremental update when fresh (line 594-620)
  - Incremental update query: `WHERE device.updatedAt > :lastUpdate`

**Database Schema (from @piggi-group/piggi-portal-database):**

*DealCategoryUserEntity:*
```typescript
@Entity('deal_category_users')
class DealCategoryUserEntity extends BaseEntity {  // ← has updatedAt
  dealCategoryId: number;
  userId: number;
  status: 'read' | 'unread';
  @ManyToOne() dealCategory: DealCategoryEntity;
  @ManyToOne() user: UserEntity;
}
```

*DeviceEntity:*
```typescript
@Entity('devices')
class DeviceEntity extends BaseEntity {  // ← has updatedAt
  deviceId: string;  // unique
  fcmToken: string;   // nullable
  apnsToken: string;  // nullable
  os: string;
  appVersion: string;
  userIds: number[];  // simple-array (comma-separated)
  @ManyToOne() user: UserEntity;  // userId foreign key
}
```

*BaseEntity:*
```typescript
class BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;  // ← Auto-updated by TypeORM
  deletedAt: Date;  // Soft delete support
}
```

**UserEntity.configs Structure:**
```typescript
{
  pushNotification: boolean,  // User's notification preference
  // ... other configs
}
```

**Query Patterns:**
- **EXISTS subqueries** instead of JOINs to check device existence → prevents duplicates, better performance
- **QueryBuilder** for complex queries with dynamic conditions
- **Batch processing**: `SEND_NOTIFICATIONS_BATCH_SIZE`, `BATCH_SIZE_ANDROID`, `BATCH_SIZE_IOS`
- **Path aliases**: `@common/*`, `@config/*`, `@modules/*`

**Service Architecture Pattern:**
- Repository pattern with dependency injection (`@Inject('USER_REPOSITORY')`)
- Each target type → dedicated service class
- Services use in-memory Map for caching
- Architecture: 1 service instance per type, cache multiple target values in Map
  - Example: `DealCategoryDeviceService` instance caches: `Map<categoryId, { fcmTokens, apnsTokens, lastUpdate }>`

**Important Logic - pushNotification Filtering:**
- When querying devices, MUST join `users` table to check `users.configs.pushNotification`
- Notification importance determines behavior:
  - Important notification: Send even if `pushNotification = false`
  - Normal notification: Only send if `pushNotification = true`
- **Current v1 does NOT implement this filtering** (opportunity for v2)

**Tech Stack:**
- NestJS with TypeORM
- MySQL database with BaseEntity pattern (auto-managed createdAt/updatedAt)
- In-memory caching (Map structures)
- REST API for v2 (gRPC remains for v1 backward compatibility)
- Elasticsearch for notification history storage

### Files to Reference

| File | Purpose | Key Findings |
| ---- | ------- | ------------ |
| `api-notification/src/modules/mobile/mobile.service.ts` | **Core service to extend** | - Line 344-371: `sendNotify()` entry point<br>- Line 526+: Existing `_getDevicesAndSaveCache()` with TTL-based cache<br>- Line 686-720: `_getDevices()` query pattern to reuse<br>- Already has in-memory cache for all_users with incremental updates |
| `api-notification/src/modules/mobile/mobile.controller.ts` | **Where to add v2 endpoint** | - Line 47-50: Existing `/mobile/send-notify` POST endpoint<br>- Line 22-33: gRPC `SendNotify` method (keep for backward compat)<br>- Add new v2 REST endpoint here: `/v2/send-notification` |
| `api-notification/src/modules/mobile/dto/send-deal-category-notification.dto.ts` | **DTO pattern reference** | - Uses `@ApiProperty` for Swagger docs<br>- Uses `class-validator` decorators<br>- Create similar DTO for v2 API with `targetType` and `targetValue` fields |
| `api-cms/src/modules/deal/deal.service.ts` | **First migration target** | - Line 305: `create()` method<br>- Line 368-376: Current notification logic to replace<br>- Line 485-515: `sendNotificationsToUsersDeal()` - populate userIds logic to remove<br>- **Migration**: Replace with v2 API call passing `targetType: 'deal_category', targetValue: categoryId` |
| `piggi-portal-database/src/entities/deal-category-user/deal-category-user.entity.ts` | **Target table for category cache** | - Extends BaseEntity → has `updatedAt` field (auto-managed)<br>- Unique constraint: (dealCategoryId, userId)<br>- Use for incremental cache updates via `updatedAt > lastUpdate` |
| `piggi-portal-database/src/entities/device/device.entity.ts` | **Device schema** | - Has fcmToken, apnsToken (nullable)<br>- Has userIds (simple-array) for multi-user devices<br>- Has appVersion for NotiLite filtering<br>- ManyToOne with UserEntity (userId FK) |
| `piggi-portal-database/src/entities/base.entity.ts` | **Auto-timestamp pattern** | - All entities extend this<br>- Provides: id, createdAt, **updatedAt** (auto-managed), deletedAt<br>- TypeORM automatically updates `updatedAt` on any change → reliable for incremental queries |
| `api-notification/src/common/environment.ts` | **Where to add ENV variables** | - Add `PRE_LOAD_CACHE_ALL_DEVICES: boolean`<br>- Add `PRE_LOAD_DEAL_CATEGORY: string` (comma-separated IDs)<br>- Follow existing pattern with `env-var` library |

### Technical Decisions

**Decision 1: REST API vs gRPC for v2**
- **Choice:** REST API
- **Reason:** Easier to debug, better DX for internal services, can add gRPC wrapper later if needed
- **Trade-off:** Slightly higher latency than gRPC, acceptable for async notification flow

**Decision 2: In-Memory Cache vs Redis**
- **Choice:** In-Memory (Map structures)
- **Reason:** Simpler implementation, sufficient for single-instance deployment, faster access than Redis
- **Trade-off:** Cannot scale horizontally (future: migrate to Redis if needed)

**Decision 3: Cache cho User Tags - NO**
- **Choice:** Query trực tiếp, không cache
- **Reason:** User tag membership thay đổi frequently, cache invalidation phức tạp
- **Trade-off:** Slower for user_tag target, acceptable vì ít dùng hơn categories

**Decision 4: Service Architecture - Single Instance với Map**
- **Choice:** Mỗi target type có 1 service instance, cache multiple values trong Map
- **Example:** `DealCategoryDeviceService` cache `Map<categoryId, deviceData>`
- **Reason:** Memory efficient, easier lifecycle management
- **Trade-off:** Shared state trong service, cần careful với concurrency

**Decision 5: Configurable Pre-warming Strategy**
- **Choice:** Environment-based configuration
  - `PRE_LOAD_CACHE_ALL_DEVICES=true/false` - Toggle all_users cache pre-load
  - `PRE_LOAD_DEAL_CATEGORY="1,2,3"` - Comma-separated category IDs to pre-load (empty = skip)
- **Reason:** 
  - Production: Pre-load để avoid slow first-send cho popular targets
  - Dev/Staging: Có thể disable để faster startup, easier debugging
  - Flexibility cho ops team tune theo usage patterns
- **Trade-off:** Thêm complexity trong config, nhưng worth it cho operational flexibility

**Decision 6: Incremental Update Trigger**
- **Choice:** Based on `deal_category_users.updatedAt` and `devices.updatedAt`
- **Reason:** 
  - Both tables extend BaseEntity → TypeORM auto-manages `updatedAt` on ANY change
  - Reliable timestamp-based incremental query: `WHERE updatedAt > :lastUpdate`
  - Existing all_users cache already uses this pattern successfully (line 598 in mobile.service.ts)
- **Trade-off:** N/A - BaseEntity pattern is already proven and reliable

**Decision 7: Reuse Existing Cache Pattern**
- **Choice:** Extend existing `_getDevicesAndSaveCache()` pattern from all_users implementation
- **Reason:**
  - Pattern already proven and working in production for all_users target
  - Cache structure: `{ fcmTokens: string[], apnsTokens: string[], lastUpdate: Date }`
  - Token format: `"userId|deviceId|token"` - compact, contains all metadata
  - Incremental update query already implemented (line 594-620)
- **Implementation:** Create new service classes following same pattern, different target query

**Decision 8: REST API Structure for v2**
- **Choice:** New endpoint `/v2/send-notification` with DTO-based request
- **Reason:**
  - Existing `/mobile/send-notify` is v1, avoid breaking changes
  - DTO validation với `class-validator` decorators
  - Swagger documentation với `@ApiProperty`
- **Request DTO:**
  ```typescript
  {
    targetType: 'all_users' | 'deal_category' | 'user_tag' | 'specific',
    targetValue?: string,  // categoryId, tagId, or null for all_users
    userIds?: number[],    // For specific target type only
    title: string,
    description: string,
    type: string[],
    data: { navigation, imageUrl, options }
  }
  ```

## Implementation Plan

### Tasks

**Phase 1: Infrastructure Setup**

- [ ] Task 1: Add environment variables for pre-warming configuration
  - File: `api-notification/src/common/environment.ts`
  - Action: Add two new environment variables using `env-var` library pattern:
    ```typescript
    export const PRE_LOAD_CACHE_ALL_DEVICES = getBoolean('PRE_LOAD_CACHE_ALL_DEVICES', true);
    export const PRE_LOAD_DEAL_CATEGORY = getString('PRE_LOAD_DEAL_CATEGORY', '');
    ```
  - File: `api-notification/.env.example`
  - Action: Add example values:
    ```bash
    PRE_LOAD_CACHE_ALL_DEVICES=true
    PRE_LOAD_DEAL_CATEGORY=1,2,3  # Comma-separated category IDs
    ```
  - Notes: Follow existing pattern in environment.ts (import `getBoolean`, `getString` from `env-var`)

- [ ] Task 2: Create v2 API request DTO
  - File: `api-notification/src/modules/mobile/dto/send-notification-v2.dto.ts` (NEW)
  - Action: Create DTO class with validation decorators:
    ```typescript
    export class SendNotificationV2Dto {
      @ApiProperty({ enum: ['all_users', 'deal_category', 'user_tag', 'specific'] })
      @IsEnum(['all_users', 'deal_category', 'user_tag', 'specific'])
      targetType: string;
      
      @ApiProperty({ required: false })
      @IsOptional()
      @IsString()
      targetValue?: string;  // categoryId, tagId
      
      @ApiProperty({ required: false })
      @IsOptional()
      @IsArray()
      userIds?: number[];  // For 'specific' target only
      
      @ApiProperty()
      @IsNotEmpty()
      @IsString()
      title: string;
      
      @ApiProperty()
      @IsNotEmpty()
      @IsString()
      description: string;
      
      @ApiProperty()
      @IsArray()
      type: string[];
      
      @ApiProperty()
      data: {
        navigation: string;
        imageUrl?: string;
        source?: any;
        options?: string;
      };
      
      @ApiProperty({ required: false })
      @IsOptional()
      isPushAlert?: number;  // NOTIFICATION_PUSH_ALERT enum
    }
    ```
  - Notes: Use `class-validator` decorators (`@IsEnum`, `@IsOptional`, `@IsNotEmpty`, `@IsArray`)

**Phase 2: Device Service Classes**

- [ ] Task 3: Create base device service interface
  - File: `api-notification/src/modules/mobile/services/device-service.interface.ts` (NEW)
  - Action: Define interface for all device services:
    ```typescript
    export interface IDeviceService {
      getDeviceTokens(
        excludeNotiLite?: boolean,
        importanceLevel?: 'important' | 'normal'
      ): Promise<{
        androidDeviceTokens: DeviceTokenMetadata[];
        iosDeviceTokens: DeviceTokenMetadata[];
        userIds: number[];
      }>;
      
      refreshCache?(): Promise<void>;  // Optional for cached services
    }
    
    export interface DeviceTokenMetadata {
      token: string;
      userId: number;
      deviceId: string;
    }
    ```
  - Notes: Interface để ensure consistent API across all device services

- [ ] Task 4: Implement AllUsersDeviceService
  - File: `api-notification/src/modules/mobile/services/all-users-device.service.ts` (NEW)
  - Action: 
    1. Extract existing `_getDevicesAndSaveCache()` logic from mobile.service.ts (line 526-620)
    2. Create standalone service class implementing `IDeviceService`
    3. Maintain same cache structure: `{ fcmTokens: string[], apnsTokens: string[], lastUpdate: Date }`
    4. Implement incremental update: `WHERE device.updatedAt > :lastUpdate`
    5. Add `refreshCache()` method for manual refresh
    6. Inject `UserRepository` via constructor DI
  - Notes: 
    - Reuse existing pattern, just refactor into separate class
    - Keep TTL constant `CACHE_TTL_MS`
    - Query pattern: `userRepository.createQueryBuilder('user').innerJoin('user.devices', 'device')`

- [ ] Task 5: Implement DealCategoryDeviceService
  - File: `api-notification/src/modules/mobile/services/deal-category-device.service.ts` (NEW)
  - Action:
    1. Create service with `Map<categoryId, CacheData>` structure
    2. `CacheData = { fcmTokens: string[], apnsTokens: string[], lastUpdate: Date }`
    3. Implement `getDeviceTokens(categoryId: number)` method:
       - Check if `categoryId` exists in cache and not stale
       - If fresh: incremental update query
       - If stale/missing: full refresh query
    4. Query pattern:
       ```typescript
       this.dealCategoryUserRepository
         .createQueryBuilder('dcu')
         .innerJoin('dcu.user', 'user')
         .innerJoin('user.devices', 'device')
         .where('dcu.dealCategoryId = :categoryId', { categoryId })
         .andWhere('(device.fcmToken IS NOT NULL OR device.apnsToken IS NOT NULL)')
         .select(['device.*', 'user.id', 'user.configs'])
       ```
    5. Incremental update: `WHERE dcu.updatedAt > :lastUpdate OR device.updatedAt > :lastUpdate`
    6. Filter by `user.configs.pushNotification` based on `importanceLevel` parameter
  - Notes:
    - Inject `DealCategoryUserRepository`, `UserRepository` via DI
    - Follow same pattern as AllUsersDeviceService but with Map cache
    - Handle category not found gracefully (return empty arrays)

- [ ] Task 6: Implement UserTagDeviceService
  - File: `api-notification/src/modules/mobile/services/user-tag-device.service.ts` (NEW)
  - Action:
    1. Create service WITHOUT caching (query directly each time)
    2. Implement `getDeviceTokens(tagId: number)` method
    3. Query pattern:
       ```typescript
       this.userRepository
         .createQueryBuilder('user')
         .innerJoin('user.userTags', 'ut')
         .innerJoin('user.devices', 'device')
         .where('ut.tagId = :tagId', { tagId })
         .andWhere('(device.fcmToken IS NOT NULL OR device.apnsToken IS NOT NULL)')
         .select(['device.*', 'user.id', 'user.configs'])
       ```
    4. Filter by `user.configs.pushNotification` based on `importanceLevel`
  - Notes:
    - No cache due to frequent tag membership changes
    - Inject `UserRepository` via DI
    - Verify `UserEntity` has `userTags` relationship (or query via `user_tags` table)

- [ ] Task 7: Implement SpecificUsersDeviceService
  - File: `api-notification/src/modules/mobile/services/specific-users-device.service.ts` (NEW)
  - Action:
    1. Create service that wraps existing `_getDevices()` logic (line 686-720)
    2. Implement `getDeviceTokens(userIds: number[])` method
    3. Reuse exact same query pattern from existing `_getDevices()`
    4. No caching needed (specific userIds change per request)
  - Notes:
    - This is essentially a wrapper around existing logic
    - Maintains backward compatibility with v1 behavior

**Phase 3: Controller & Service Integration**

- [ ] Task 8: Add v2 REST endpoint in MobileController
  - File: `api-notification/src/modules/mobile/mobile.controller.ts`
  - Action:
    1. Add new POST endpoint:
       ```typescript
       @Post('v2/send-notification')
       @ApiOperation({ summary: 'Send notification v2 with target-based API' })
       async sendNotificationV2(@Body() dto: SendNotificationV2Dto) {
         return this.mobileService.sendNotifyV2(dto);
       }
       ```
    2. Import `SendNotificationV2Dto` from dto file
  - Notes: Place after existing `/send-notify` endpoint (line 47-50)

- [ ] Task 9: Implement sendNotifyV2() method in MobileService
  - File: `api-notification/src/modules/mobile/mobile.service.ts`
  - Action:
    1. Inject all 4 device services via constructor DI
    2. Add new method:
       ```typescript
       async sendNotifyV2(dto: SendNotificationV2Dto) {
         const { targetType, targetValue, userIds } = dto;
         let deviceData;
         
         // Route to appropriate service
         switch (targetType) {
           case 'all_users':
             deviceData = await this.allUsersDeviceService.getDeviceTokens();
             break;
           case 'deal_category':
             deviceData = await this.dealCategoryDeviceService.getDeviceTokens(Number(targetValue));
             break;
           case 'user_tag':
             deviceData = await this.userTagDeviceService.getDeviceTokens(Number(targetValue));
             break;
           case 'specific':
             deviceData = await this.specificUsersDeviceService.getDeviceTokens(userIds);
             break;
           default:
             throw new BadRequestException('Invalid targetType');
         }
         
         // Continue with existing notification sending logic
         // Reuse _insertNotificationHistory(), _pushNotification() methods
       }
       ```
    3. Add service injection in constructor
  - Notes: Reuse existing helper methods for history and push notification

- [ ] Task 10: Add pre-warming logic on service startup
  - File: `api-notification/src/modules/mobile/mobile.service.ts`
  - Action:
    1. Add `OnModuleInit` implementation:
       ```typescript
       async onModuleInit() {
         await this.preWarmCaches();
       }
       
       private async preWarmCaches() {
         const tasks = [];
         
         // Pre-warm all_users if enabled
         if (PRE_LOAD_CACHE_ALL_DEVICES) {
           this.logger.log('[PreWarm] Loading all_users devices cache...');
           tasks.push(this.allUsersDeviceService.refreshCache());
         }
         
         // Pre-warm categories if specified
         if (PRE_LOAD_DEAL_CATEGORY) {
           const categoryIds = PRE_LOAD_DEAL_CATEGORY.split(',').map(id => Number(id.trim()));
           for (const categoryId of categoryIds) {
             this.logger.log(`[PreWarm] Loading category ${categoryId} devices cache...`);
             tasks.push(this.dealCategoryDeviceService.getDeviceTokens(categoryId));
           }
         }
         
         await Promise.all(tasks);
         this.logger.log('[PreWarm] Cache pre-warming complete');
       }
       ```
  - Notes: Import `OnModuleInit` from `@nestjs/common`, import ENV variables

- [ ] Task 11: Update FeatureModule to register new services
  - File: `api-notification/src/modules/feature.module.ts`
  - Action:
    1. Import all 4 new device service classes
    2. Add to `providers` array:
       ```typescript
       providers: [
         // ... existing providers
         AllUsersDeviceService,
         DealCategoryDeviceService,
         UserTagDeviceService,
         SpecificUsersDeviceService,
       ]
       ```
  - Notes: Services need to be provided to enable DI

**Phase 4: Migrate api-cms Deal Service**

- [ ] Task 12: Update deal creation to use v2 API
  - File: `api-cms/src/modules/deal/deal.service.ts`
  - Action:
    1. Line 368-376: Replace current notification logic
    2. Old code:
       ```typescript
       if (dto.isSendToAllUsers) {
         this.notificationService.sendNotificationToAllUsersDeal(...)
       } else {
         this.sendNotificationsToUsersDeal(...)
       }
       ```
    3. New code:
       ```typescript
       if (dto.isSendToAllUsers) {
         // Send to all users via v2 API
         await this.httpClient.post(`${API_NOTIFICATION_URL}/mobile/v2/send-notification`, {
           targetType: 'all_users',
           title: dto.titleNotification,
           description: dto.contentNotification,
           type: [NOTIFICATION_TYPE.DEAL],
           data: {
             navigation: NavigationAppEnum.DEAL_DETAIL,
             source: { direct: deal.id },
             imageUrl: deal.images?.[0]
           }
         });
       } else {
         // Send to specific category via v2 API
         const targetCategory = dealCategories.length === 2 
           ? (hotCategory || otherCategory)
           : dealCategories[0];
         
         await this.httpClient.post(`${API_NOTIFICATION_URL}/mobile/v2/send-notification`, {
           targetType: 'deal_category',
           targetValue: String(targetCategory.id),
           title: dto.titleNotification,
           description: dto.contentNotification,
           type: [NOTIFICATION_TYPE.DEAL],
           data: {
             navigation: NavigationAppEnum.DEAL_DETAIL,
             source: { direct: deal.id },
             imageUrl: deal.images?.[0]
           }
         });
       }
       ```
    4. Remove unused method `sendNotificationsToUsersDeal()` (line 485-515)
  - File: `api-cms/src/common/environment.ts`
  - Action: Add `API_NOTIFICATION_URL` environment variable if not exists
  - Notes:
    - Verify `HttpClient` is available (already imported at line 30)
    - Verify `API_NOTIFICATION_URL` environment variable exists
    - LOC reduction: ~35 lines → ~25 lines

**Phase 5: Testing**

- [ ] Task 13: Write unit tests for device services
  - File: `api-notification/src/modules/mobile/services/__tests__/all-users-device.service.spec.ts` (NEW)
  - Action: Test AllUsersDeviceService:
    - Mock `UserRepository`
    - Test cache hit (fresh data)
    - Test cache miss (stale data → full refresh)
    - Test incremental update
  - File: Similar for other 3 services
  - Notes: Follow existing test patterns in api-notification

- [ ] Task 14: Write integration tests for v2 endpoint
  - File: `api-notification/test/mobile-v2.e2e-spec.ts` (NEW)
  - Action: E2E tests:
    - Test `/v2/send-notification` with each targetType
    - Verify devices are queried correctly
    - Verify notification history is saved
    - Verify FCM/APNS are called (mock)
  - Notes: Use existing E2E test setup from `test/` directory

- [ ] Task 15: Manual testing checklist
  - Action: Create manual test plan:
    1. Start api-notification with pre-warming enabled
    2. Verify logs show cache pre-warming
    3. Call v2 API with `targetType: 'all_users'` → verify fast response (cache hit)
    4. Call v2 API with `targetType: 'deal_category'` → verify devices retrieved
    5. Create deal in api-cms → verify notification sent via v2
    6. Check notification history in database
    7. Verify mobile devices receive push notifications
  - Notes: Document in separate test plan file

### Acceptance Criteria

**Functional Requirements:**

- [ ] AC1: Given api-notification service starts with `PRE_LOAD_CACHE_ALL_DEVICES=true`, when service initializes, then all_users devices cache is pre-loaded and logs confirm "Cache pre-warming complete"

- [ ] AC2: Given api-notification service starts with `PRE_LOAD_DEAL_CATEGORY="1,2"`, when service initializes, then category 1 and 2 device caches are pre-loaded

- [ ] AC3: Given a valid v2 API request with `targetType: 'all_users'`, when POST `/v2/send-notification`, then:
  - Response status is 200
  - Devices are retrieved from cache (not database query)
  - Notification history is saved for all users
  - FCM/APNS push notifications are sent

- [ ] AC4: Given a valid v2 API request with `targetType: 'deal_category'` and `targetValue: '5'`, when POST `/v2/send-notification`, then:
  - Response status is 200
  - Devices are retrieved for users in category 5 only
  - First call queries database and caches result
  - Second call uses cache with incremental update
  - Notification history is saved for category users only

- [ ] AC5: Given a valid v2 API request with `targetType: 'user_tag'` and `targetValue: '10'`, when POST `/v2/send-notification`, then:
  - Response status is 200
  - Devices are queried directly (no cache)
  - Notification history is saved for tagged users only

- [ ] AC6: Given a valid v2 API request with `targetType: 'specific'` and `userIds: [1, 2, 3]`, when POST `/v2/send-notification`, then:
  - Response status is 200
  - Devices are retrieved for users 1, 2, 3 only
  - Behavior matches existing v1 logic (backward compatible)

- [ ] AC7: Given a deal is created in api-cms with `isSendToAllUsers: false` and `dealCategoryIds: [5]`, when deal.create() executes, then:
  - v2 API is called with `targetType: 'deal_category', targetValue: '5'`
  - Old `sendNotificationsToUsersDeal()` method is NOT called
  - Notification is sent to all users in category 5

- [ ] AC8: Given a notification with `type: NOTIFICATION_TYPE.IMPORTANT` and user has `configs.pushNotification: false`, when notification is sent, then user still receives the notification (importance overrides preference)

- [ ] AC9: Given a notification with normal importance and user has `configs.pushNotification: false`, when notification is sent, then user does NOT receive the notification

**Performance Requirements:**

- [ ] AC10: Given all_users cache is warm, when v2 API called with `targetType: 'all_users'`, then response time is < 500ms (cache hit performance)

- [ ] AC11: Given category cache is warm and < 5 minutes old, when v2 API called with same category, then incremental update query is used (not full refresh)

**Error Handling:**

- [ ] AC12: Given v2 API request with invalid `targetType: 'invalid'`, when POST `/v2/send-notification`, then response status is 400 with error message "Invalid targetType"

- [ ] AC13: Given v2 API request with `targetType: 'deal_category'` but missing `targetValue`, when POST `/v2/send-notification`, then response status is 400 with validation error

- [ ] AC14: Given v2 API request with `targetType: 'specific'` but empty `userIds` array, when POST `/v2/send-notification`, then response status is 400 with validation error

**Backward Compatibility:**

- [ ] AC15: Given existing v1 gRPC `SendNotify` endpoint, when v2 is deployed, then v1 endpoint still works without any changes (backward compatible)

- [ ] AC16: Given existing `/mobile/send-notify` REST endpoint, when v2 is deployed, then v1 REST endpoint still works (backward compatible)

## Additional Context

### Dependencies

**External Packages (Already Installed):**
- `@piggi-group/piggi-portal-database` v1.8.2+ - Database entities (DealCategoryUserEntity, DeviceEntity, UserEntity)
- `typeorm` ^0.3.17 - ORM and query builder
- `class-validator` - DTO validation decorators
- `class-transformer` - DTO transformation
- `@nestjs/common` - NestJS core (Injectable, OnModuleInit, BadRequestException)
- `@nestjs/swagger` - API documentation (@ApiProperty, @ApiOperation)
- `env-var` - Environment variable validation

**Internal Dependencies:**
- Existing `MobileService._getDevices()` pattern (line 686-720) - Reuse for SpecificUsersDeviceService
- Existing `MobileService._getDevicesAndSaveCache()` pattern (line 526-620) - Extract for AllUsersDeviceService
- Existing batch processing constants: `BATCH_SIZE_ANDROID`, `BATCH_SIZE_IOS`, `SEND_NOTIFICATIONS_BATCH_SIZE`
- Existing helper methods: `_insertNotificationHistory()`, `_pushNotification()`, `_enqueueNotificationBatch()`

**Environment Variables (New):**
- `PRE_LOAD_CACHE_ALL_DEVICES` - Boolean, default true in production
- `PRE_LOAD_DEAL_CATEGORY` - Comma-separated category IDs, default empty
- `API_NOTIFICATION_URL` - Base URL for api-notification service (may already exist in api-cms)

**Database Requirements:**
- No schema changes needed (all tables already exist)
- Verify indexes exist: `devices.userId`, `deal_category_users(dealCategoryId, userId)`
- `updatedAt` fields auto-managed by TypeORM BaseEntity

**Service Dependencies:**
- api-cms depends on api-notification being deployed first (v2 endpoint must exist)
- Deploy order: api-notification v2 → api-cms migration

### Testing Strategy

**Unit Tests (Jest + ts-jest):**

1. **Device Services Tests** (`src/modules/mobile/services/__tests__/*.spec.ts`):
   - Mock repositories using Jest mocks
   - Test each service independently:
     ```typescript
     describe('AllUsersDeviceService', () => {
       let service: AllUsersDeviceService;
       let userRepository: MockType<Repository<UserEntity>>;
       
       beforeEach(() => {
         userRepository = createMockRepository();
         service = new AllUsersDeviceService(userRepository);
       });
       
       it('should use cache when data is fresh', async () => {
         // Setup: pre-populate cache
         // Action: call getDeviceTokens()
         // Assert: repository NOT called, cache used
       });
       
       it('should refresh cache when data is stale', async () => {
         // Setup: set cache lastUpdate to > TTL
         // Action: call getDeviceTokens()
         // Assert: repository called with full query
       });
       
       it('should perform incremental update when cache is warm', async () => {
         // Setup: cache exists and fresh
         // Action: call getDeviceTokens()
         // Assert: repository called with WHERE updatedAt > lastUpdate
       });
     });
     ```
   - Similar tests for DealCategoryDeviceService (with Map cache)
   - UserTagDeviceService (no cache, direct query)
   - SpecificUsersDeviceService (wrapper around existing logic)

2. **MobileService.sendNotifyV2() Tests**:
   - Mock all 4 device services
   - Test routing logic for each targetType
   - Test validation errors (invalid targetType, missing required fields)
   - Test integration with existing helper methods

3. **DTO Validation Tests**:
   - Test `SendNotificationV2Dto` with `class-validator`
   - Valid requests pass validation
   - Invalid requests fail with proper error messages

**Integration Tests (E2E):**

File: `test/mobile-v2.e2e-spec.ts`

```typescript
describe('Mobile V2 API (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  describe('POST /mobile/v2/send-notification', () => {
    it('should send notification to all users', () => {
      return request(app.getHttpServer())
        .post('/mobile/v2/send-notification')
        .send({
          targetType: 'all_users',
          title: 'Test',
          description: 'Test description',
          type: ['DEAL'],
          data: { navigation: 'noti://home' }
        })
        .expect(200);
    });
    
    it('should send notification to specific category', () => {
      // Similar test with targetType: 'deal_category'
    });
    
    it('should reject invalid targetType', () => {
      return request(app.getHttpServer())
        .post('/mobile/v2/send-notification')
        .send({ targetType: 'invalid', ... })
        .expect(400);
    });
  });
});
```

**Manual Testing Checklist:**

1. **Pre-warming Test:**
   - Start api-notification with `PRE_LOAD_CACHE_ALL_DEVICES=true`
   - Check logs: "Cache pre-warming complete" appears
   - Verify memory usage (cache should be loaded)

2. **V2 API Functional Test:**
   - Call `/v2/send-notification` with each targetType
   - Verify response 200 with expected format
   - Check database: notification_histories table has new records
   - Check mobile device: push notification received

3. **Cache Performance Test:**
   - Call all_users target twice in succession
   - Measure response time: first call > second call (cache hit)
   - Check logs: second call shows "cache hit" message

4. **api-cms Migration Test:**
   - Create new deal in CMS with category selection
   - Verify notification sent (check logs)
   - Verify users in selected category receive notification
   - Verify users NOT in category do NOT receive notification

5. **Backward Compatibility Test:**
   - Call existing v1 gRPC `SendNotify` method
   - Call existing v1 REST `/mobile/send-notify` endpoint
   - Verify both still work without errors

**Performance Benchmarks:**

- all_users cache hit: < 500ms response time
- deal_category first call: < 2s (query + cache)
- deal_category subsequent calls: < 500ms (incremental update)
- user_tag (no cache): < 1s (acceptable for infrequent use)

### Notes

**From Design Document (`docs/re-design-sending-notification-flow.md`):**
- TODO: Verify all related repos checkout to develop branch before implementing
- TODO: Consider using design patterns to make it maintainable and extendable

**Environment Variables to Add:**
- `PRE_LOAD_CACHE_ALL_DEVICES` - Boolean, default: `true` for production, `false` for dev
- `PRE_LOAD_DEAL_CATEGORY` - String (comma-separated IDs), default: empty string

**Investigation Findings (Step 2 - Answered):**

✅ **`deal_category_users.updatedAt` reliability:**
- Verified: Extends `BaseEntity` → TypeORM auto-manages `updatedAt` on ALL operations (including soft deletes via `deletedAt`)
- Pattern already proven in production: `devices.updatedAt` used for incremental all_users cache (line 598)
- **Conclusion:** Safe to use for incremental updates

✅ **Batch size configuration:**
- Current constants (from mobile.service.ts):
  - `SEND_NOTIFICATIONS_BATCH_SIZE` - userIds batch processing
  - `BATCH_SIZE_ANDROID` (default: 500)
  - `BATCH_SIZE_IOS` (default: 1000)
- **Decision:** v2 will reuse same batch size constants for consistency

✅ **`users.configs.pushNotification` structure:**
- Verified in query (line 703): `user.configs as configs`
- Used in token filtering logic (not yet implemented in v1, but structure exists)
- **Conclusion:** Field exists, can be used for importance-based filtering in v2

✅ **Database indexes:**
- Need to verify in database migration files or actual schema
- Common indexes likely exist: `devices.userId`, `devices(fcmToken, apnsToken)`, `deal_category_users(dealCategoryId, userId)`
- **Action for implementation:** Check query performance, add indexes if needed

✅ **Table structures confirmed:**
- `deal_category_users`: ✅ Has userId, dealCategoryId, status, updatedAt
- `devices`: ✅ Has userId (FK), fcmToken, apnsToken, updatedAt, userIds (simple-array)
- Both extend `BaseEntity` with auto-managed timestamps

**Key Insights from Investigation:**

1. **Existing cache pattern is highly reusable:**
   - All_users cache implementation (line 526-620) is production-proven
   - Can be extracted into base class or reused pattern for category/tag caches
   - Incremental update logic already handles `updatedAt > lastUpdate` correctly

2. **Current v1 does NOT filter by `pushNotification`:**
   - `_getDevices()` selects `user.configs` but doesn't use it for filtering
   - Opportunity for v2 to implement this properly based on notification importance

3. **api-cms migration is straightforward:**
   - Current code (line 485-515) does complex query to get userIds
   - Replace with single v2 API call: `{ targetType: 'deal_category', targetValue: categoryId }`
   - **Estimated LOC reduction:** ~30 lines → 5 lines

4. **REST endpoint already exists:**
   - `/mobile/send-notify` (line 47-50) shows pattern
   - v2 endpoint will be similar, just different DTO validation

**High-Risk Items (Pre-Mortem Analysis):**

1. **Memory Usage with Cache:**
   - **Risk:** In-memory cache for all_users could consume significant memory (10K+ users × 2 tokens each)
   - **Mitigation:** 
     - Monitor production memory usage
     - Set reasonable TTL
     - Add memory usage logging
     - Future: migrate to Redis if needed
   - **Acceptance:** Phase 1 single-instance, acceptable trade-off for speed

2. **First-Send Performance for New Categories:**
   - **Risk:** First notification to unpopular category will be slow (no cache)
   - **Mitigation:**
     - Clear logging (cache miss vs hit)
     - Pre-warming for popular categories
     - Consider background warming cron (future)
   - **Acceptance:** Async notification, users won't notice

3. **Cache Invalidation Edge Cases:**
   - **Risk:** User disables notifications → still receives 1 more until cache refresh
   - **Mitigation:**
     - TTL-based expiration ensures eventual consistency
     - Incremental updates capture device.updatedAt changes
     - Document as "eventual consistency within TTL window"
   - **Acceptance:** Acceptable for notification system

4. **Deployment Order Dependency:**
   - **Risk:** api-cms deployed before api-notification v2 → HTTP calls fail
   - **Mitigation:**
     - Document deployment order: api-notification FIRST
     - Add graceful fallback? Or feature flag?
   - **Decision needed:** Confirm deployment strategy

5. **User.configs.pushNotification NULL handling:**
   - **Risk:** If configs is NULL or missing pushNotification key
   - **Mitigation:** Null-safe: `user.configs?.pushNotification ?? true`
   - **Action:** Add defensive coding

**Known Limitations:**

1. **In-Memory Cache:** Cannot scale horizontally, lost on restart
2. **No Cache for user_tag:** Direct query each time (by design)
3. **Eventual Consistency:** Cache updates not real-time
4. **No GraphQL Support:** REST-only

**Future Considerations:**

1. **Redis Migration:** When horizontal scaling needed (2-3 days)
2. **Advanced Targeting:** Combined filters, user segments (5-7 days)
3. **Real-time Cache Invalidation:** DB triggers + pub/sub (3-5 days)
4. **Analytics Dashboard:** Cache metrics, performance tracking (3-4 days)
5. **Batch Scheduling:** Future delivery scheduling (2-3 days)

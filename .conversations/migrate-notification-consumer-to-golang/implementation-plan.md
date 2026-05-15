# Migration Plan: Notification Consumer Worker to Go

## Overview
Migrate the notification consumer (push notification sender worker) from `api-notification/src/worker/worker.service.ts` to `api-portal-golang`.

## Current TypeScript Implementation Summary
The worker:
1. Connects to RabbitMQ and consumes messages from a queue
2. Each message contains:
   - `tokens.android[]` - Array of `{token, deviceId, userId}`
   - `tokens.ios[]` - Array of `{token, deviceId, userId}`
   - `title`, `description`, `type[]`, `data` (navigation, source, imageUrl)
3. Sends push notifications via FCM (Android) and APNS (iOS)
4. Handles retry with exponential backoff (default: 2 retries, 60s base delay)
5. Removes invalid tokens from database (fcmToken/apnsToken set to null)
6. Graceful shutdown handling

## Message Payload Structure

### Input Message (from RabbitMQ)
```json
{
  "tokens": {
    "android": [{ "token": "xxx", "deviceId": "yyy", "userId": 123 }],
    "ios": [{ "token": "xxx", "deviceId": "yyy", "userId": 123 }]
  },
  "title": "Notification Title",
  "description": "Notification body text",
  "type": ["PROMOTION", "IMPORTANT"],
  "data": {
    "navigation": "/screen/path",
    "imageUrl": "https://example.com/image.png",
    "source": {
      "key": "source_key",
      "direct": "direct_value"
    }
  }
}
```

### FCM Payload (Android)
```json
{
  "notification": {
    "title": "...",
    "body": "...",
    "imageUrl": "..."
  },
  "data": {
    "navigation": "...",
    "source": "source.key value",
    "direct": "source.direct value",
    "type": "IMPORTANT or first type"
  },
  "android": {
    "notification": { "sound": "default_noti" }
  }
}
```

### APNS Payload (iOS)
```json
{
  "aps": {
    "alert": { "title": "...", "body": "..." },
    "sound": "default_noti.aiff"
  },
  "navigation": "...",
  "source": "source.key value",
  "direct": "source.direct value",
  "type": "IMPORTANT or first type",
  "imageUrl": "..."
}
```

**Important**: `type` field logic - if `type[]` array contains `"IMPORTANT"`, use `"IMPORTANT"`, otherwise use `type[0]`.

## Implementation Plan

### 1. Add Configuration (`config/config.go`)
Add new config sections:
- **RabbitMQ**: URL, queue name, prefetch count, enable flag
- **FCM**: Firebase service account JSON (from env var), batch size, sound
- **APNS**: Key ID, Team ID, Bundle ID, P8 key (from env var), production flag, batch size, sound, connection pool size, request timeout

> **Note**: Unlike the TS version which loads credentials from files, Go version loads FCM service account JSON and APNS P8 key directly from environment variables for better containerization.

### 2. Create Push Notification Helpers (`pkg/push/`)

#### `pkg/push/types.go`
- `DeviceTokenMetadata` struct
- `NotificationPayload` struct
- `PushResult` struct (tokens to remove, retry, errors)

#### `pkg/push/fcm.go`
- Initialize Firebase Admin SDK using `firebase.google.com/go/v4`
- Parse service account JSON from `FCM_SERVICE_ACCOUNT_JSON` env var (not file path)
- `SendToMultipleDevices()` - batch send with configurable chunk size (default 500)
- Use `SendEachForMulticast` API method for batch sending
- Message structure must include:
  - `notification`: title, body, imageUrl
  - `data`: navigation, source, direct, type (all as strings)
  - `android.notification.sound`: sound file name
- Handle error codes:
  - `messaging/registration-token-not-registered` → remove token
  - `messaging/invalid-registration-token` → remove token
  - Other errors → add to retry list
- Return: `removeTokens []DeviceTokenMetadata`, `retryTokens []DeviceTokenMetadata`, error counts

#### `pkg/push/apns.go`
- Use `github.com/sideshow/apns2` library
- Parse P8 private key from `APNS_PRIVATE_KEY` env var (not file path)
- Create token-based authentication using Key ID + Team ID + P8 key
- `SendNotifications()` - batch send with configurable chunk size (default 1000)
- Support connection pooling (use multiple clients based on `APNS_POOL_SIZE`)
- Configure request timeout via `APNS_REQUEST_TIMEOUT` (default 10000ms)
- Notification structure:
  - `aps.alert`: title, body
  - `aps.sound`: sound file name (e.g., "default_noti.aiff")
  - Custom payload fields: navigation, source, direct, type, imageUrl
- Handle error reasons:
  - `Unregistered` → remove token
  - `DeviceTokenNotForTopic` → remove token
  - `BadDeviceToken` → remove token
  - Other errors → add to retry list
- Return: `removeTokens []DeviceTokenMetadata`, `retryTokens []DeviceTokenMetadata`, error counts

### 3. Create RabbitMQ Consumer (`pkg/rabbitmq/consumer.go`)
- Use `github.com/rabbitmq/amqp091-go`
- Connection with auto-reconnect on failure
- Channel setup:
  - Assert queue with `durable: true` (must match producer settings)
  - Set prefetch count via `Qos(prefetchCount, 0, false)`
  - Use manual acknowledgment mode (`autoAck: false`)
- Message handling:
  - On success: `msg.Ack(false)` - acknowledge single message
  - On failure: `msg.Nack(false, true)` - negative ack, don't batch, **requeue=true**
- Graceful shutdown:
  - Listen for SIGINT/SIGTERM
  - Stop consuming new messages
  - Wait for in-flight messages to complete
  - Close channel then connection

### 4. Update Device Repository (`src/adapter/repository/device.go`)
Add methods:
- `ClearFcmTokensByTokens(ctx, tokens []string) error`
- `ClearApnsTokensByTokens(ctx, tokens []string) error`

Update abstract interface in `src/abstract/device.go`.

### 5. Create Worker Service (`src/worker/notification_worker.go`)
- Main worker logic
- Message parsing from JSON
- **Type field handling**:
  ```go
  // If type array contains "IMPORTANT", use "IMPORTANT", otherwise use first element
  notificationType := types[0]
  for _, t := range types {
      if t == "IMPORTANT" {
          notificationType = "IMPORTANT"
          break
      }
  }
  ```
- Call FCM and APNS helpers **in parallel** using goroutines + WaitGroup
- Handle retry with exponential backoff: `delay * 2^retryCount`
  - Only retry tokens that failed with retryable errors
  - Max retries configurable (default: 2)
  - Base delay configurable (default: 60000ms)
- Remove invalid tokens via repository after each attempt
- Logging:
  - Log message received with token counts
  - Log completion time
  - Log retry attempts with token counts
  - Log final failure after max retries

### 6. Create Worker Command (`cmd/notification_worker.go`)
- Cobra command similar to `crawl-shopee-clicks`
- Initialize DB, RabbitMQ consumer, worker service
- Start consuming messages
- Handle graceful shutdown

### 7. Register Command (`main.go`)
Add the new worker command to the root command.

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `pkg/push/types.go` | Common types for push notifications |
| `pkg/push/fcm.go` | Firebase Cloud Messaging helper |
| `pkg/push/apns.go` | Apple Push Notification Service helper |
| `pkg/rabbitmq/consumer.go` | RabbitMQ consumer wrapper |
| `src/worker/notification_worker.go` | Worker service logic |
| `cmd/notification_worker.go` | Cobra command for worker |

### Modified Files
| File | Changes |
|------|---------|
| `config/config.go` | Add RabbitMQ, FCM, APNS config |
| `src/abstract/device.go` | Add token clearing methods |
| `src/adapter/repository/device.go` | Implement token clearing |
| `main.go` | Register worker command |
| `go.mod` | Add dependencies |

## Dependencies to Add
```
github.com/rabbitmq/amqp091-go  // RabbitMQ client
firebase.google.com/go/v4       // Firebase Admin SDK
github.com/sideshow/apns2       // APNS client
```

## Configuration Environment Variables
```bash
# RabbitMQ
RMQ_URL=amqp://localhost:5672           # RabbitMQ connection URL
RMQ_QUEUE=notifications_queue            # Queue name to consume from
RMQ_QUEUE_PREFETCH=2                     # Prefetch count per consumer
ENABLE_WORKER=true                       # Enable/disable worker

# FCM - Load JSON content directly from env var (not file path)
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
FCM_BATCH_SIZE=500                       # Max tokens per FCM batch (default: 500)
SOUND_NOTIFICATION=default_noti          # Android notification sound

# APNS - Load P8 key content directly from env var (not file path)
APNS_KEY_ID=xxx                          # Apple Key ID
APNS_TEAM_ID=xxx                         # Apple Team ID
APNS_BUNDLE_ID=com.piggi.app             # iOS app bundle ID
APNS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGT....\n-----END PRIVATE KEY-----
APNS_ENV=true                            # true=production, false=sandbox
APNS_BATCH_SIZE=1000                     # Max tokens per APNS batch (default: 1000)
SOUND_IOS_NOTIFICATION=default_noti.aiff # iOS notification sound
APNS_CONNECTION_POOL_SIZE=5              # Number of APNS connections (default: 5)
APNS_REQUEST_TIMEOUT=10000               # APNS request timeout in ms (default: 10000)

# Retry Configuration
RETRY_PUSH_NOTIFICATION=2                # Max retry attempts (default: 2)
DELAY_RETRY_PUSH_NOTIFICATION=60000      # Base delay in ms for exponential backoff (default: 60000)
```

> **Note**: Environment variable names match the original TypeScript implementation for easier migration.

## Usage
```bash
# Run the notification worker
go run main.go notification-worker
```

## Verification Plan
1. Build and run: `go build && ./bgg-backend notification-worker`
2. Verify RabbitMQ connection logs
3. Send test message to queue and verify:
   - FCM/APNS calls are made
   - Invalid tokens are removed from DB
   - Retry logic works with exponential backoff
4. Test graceful shutdown with SIGINT

## Key Differences from TypeScript Version

| Aspect | TypeScript | Go |
|--------|------------|-----|
| FCM credentials | File: `serviceAccountKey.json` | Env var: `FCM_SERVICE_ACCOUNT_JSON` |
| APNS credentials | File: `privateAPNsAuthKey.p8` | Env var: `APNS_PRIVATE_KEY` |
| FCM batch size | Hardcoded 500 | Configurable via `FCM_BATCH_SIZE` |
| APNS batch size | Hardcoded 1000 | Configurable via `APNS_BATCH_SIZE` |
| APNS library | `@parse/node-apn` | `github.com/sideshow/apns2` |
| RabbitMQ library | `amqplib` | `github.com/rabbitmq/amqp091-go` |

## Implementation Checklist

- [ ] Add config struct fields in `config/config.go`
- [ ] Create `pkg/push/types.go` with shared types
- [ ] Create `pkg/push/fcm.go` with Firebase integration
- [ ] Create `pkg/push/apns.go` with APNS integration
- [ ] Create `pkg/rabbitmq/consumer.go` with RabbitMQ consumer
- [ ] Add device repository methods for token clearing
- [ ] Create `src/worker/notification_worker.go` with worker logic
- [ ] Create `cmd/notification_worker.go` with Cobra command
- [ ] Register command in `main.go`
- [ ] Add dependencies to `go.mod`

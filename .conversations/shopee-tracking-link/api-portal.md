# Shopee Tracking Links - api-portal

## Tổng quan
`api-portal` là backend chính xử lý việc tạo tracking link Shopee. Đây là nơi chứa logic chính để generate dynamic link và shortlink.

## Các file liên quan

### 1. Link Service (Main Hub)
**File:** `src/modules/link/link.service.ts`

**Line 272-318:** `generateTrackingLinkByPlatform()` - Method chính để tạo tracking link
```typescript
async generateTrackingLinkByPlatform(
    link: string,
    userId: number,
    options?: { attachSub5?: string; dynamicLink?: boolean },
): Promise<string>
```

**Line 320-349:** `_generateShopeeTrackingLink()` - Tạo tracking link cho Shopee
- Sử dụng Shopee Open API nếu `ENABLE_SHOPEE_OPEN_API` = true
- Gọi `ShopeeOpenApiHelper.generateShortLinkByOpenApi()`
- Fallback về `requestGenerateLink()` nếu Open API fail

**Line 153-217:** `requestGenerateLink()` - Tạo link qua publisher service
```typescript
const payload = {
    referralSecret: Random Shopee affiliate ID từ settings,
    originUrl: cleaned product link,
    isTrackingLink: boolean,
    offerKey: 'shopee' | 'lazada' | 'tiktok',
    sub1, sub2, sub3, sub5: tracking parameters
};
// POST đến: ${PUBLISHER_URL}api/external/link/generate
```

---

### 2. Shopee Open API Helper
**File:** `src/common/helpers/shopee-open-api.helper.ts`

**Line 182-248:** `generateShortLink()` - Tạo short link với user tracking
```typescript
static async generateShortLink(originUrl: string, userId: number, retryCount: number = 0): Promise<string>
```
- Tạo sub IDs: `['', '', GENERATE_SUB_ID3_SHORT_LINK(userId), '', 'LOYALTY']`
- Gọi GraphQL mutation: `generateShortLink`
- Return: `response?.data?.generateShortLink?.shortLink`

**Line 293-310:** `generateShortLinkByOpenApi()` - Tạo short link không có user tracking
```typescript
static async generateShortLinkByOpenApi(cleanedLink: string): Promise<any>
```

---

### 3. Shopee Helper
**File:** `src/common/helpers/shopee.helper.ts`

**Line 6-45:** `prepareLinkProduct()` - Xử lý và normalize link
- Handle shortlinks: `s.shopee.vn`, `shp.ee`, `shope.ee`, `vn.shp.ee`
- Extract itemId và shopId từ URL
- Normalize thành: `https://shopee.vn/product-i.${shopId}.${itemId}`

**Line 47-94:** `doubleCheckLink()` - Follow redirect để lấy final URL

---

### 4. Shopee Controller
**File:** `src/modules/shopee/shopee.controller.ts`

**Line 44-58:** API endpoint tạo short link
```typescript
@Post('generate-short-link')
async generateShortLink(
    @Body('originUrl') originUrl: string,
    @GetCurrentUser('id') userId: number,
): Promise<{ originUrl: string; shortLink: string }>
```

---

### 5. Environment Configuration
**File:** `src/common/environment.ts`

**Line 454:** Default tracking link template
```typescript
'https://s.shopee.vn/an_redir?utm_medium=affiliates&affiliate_id=17350340019&sub_id=---contact---&origin_link=https%3A%2F%2Fshopee.vn%2Fflash_sale'
```

**Line 101-102:** Shopee API config
```typescript
const SHOPEE_API_URL = env.get('SHOPEE_API_URL').required().asString();
const ENABLE_SHOPEE_OPEN_API = env.get('ENABLE_SHOPEE_OPEN_API').default('false').asBool();
```

---

### 6. Các service sử dụng tracking link

| File | Line | Mô tả |
|------|------|-------|
| `src/modules/comment/deal-comment.service.ts` | 135-136 | Tracking link trong comments |
| `src/modules/chat/services/chat.message.service.ts` | 329, 334 | Tracking link trong chat |
| `src/modules/feature-task-cross/task-point/task-point.service.ts` | 67-70 | Task point với `sub5: 'nvd'` |
| `src/modules/feature-task-cross/task-cross/task-cross.service.ts` | 152-155 | Task cross với `sub5: 'nvc'` |

---

## Pattern đang sử dụng

**Dynamic Link (cần chuyển sang shortlink):**
```
https://s.shopee.vn/an_redir?utm_medium=affiliates&affiliate_id={AFFILIATE_ID}&sub_id={SUB1}-{SUB2}-{SUB3}-{SUB4}-{SUB5}&origin_link={ENCODED_URL}
```

## Đề xuất thay đổi
1. Cập nhật `_generateShopeeTrackingLink()` để luôn sử dụng Open API tạo shortlink
2. Cập nhật `requestGenerateLink()` để trả về shortlink thay vì dynamic link
3. Cập nhật template trong `environment.ts` sang format shortlink

# Shopee Tracking Links - app-noti

## Tổng quan
`app-noti` là ứng dụng React Native (Nô Tì). App có logic generate tracking link ở client-side và có nhiều hardcoded dynamic links cần được cập nhật.

## Các file liên quan

### 1. Configuration & Constants (CẦN CẬP NHẬT)
**File:** `src/commons/config.example.ts`

**Line 15:** Template dynamic link
```typescript
'https://s.shopee.vn/an_redir?affiliate_id={{referral_id}}&utm_medium=affiliates&sub_id={{sub3}}&origin_link={{url}}'
```

**File:** `src/commons/constants.ts`

**Line 144-148:** Hardcoded dynamic links
```typescript
voucher_wallet_link = 'https://s.shopee.vn/an_redir?affiliate_id=17350340019&utm_medium=affiliates&origin_link=https%3A%2F%2Fshopee.vn%2Fuser%2Fvoucher-wallet'

flash_sale_shopee_link = [
  'https://s.shopee.vn/an_redir?affiliate_id=17350340019&utm_medium=affiliates&origin_link=https%3A%2F%2Fshopee.vn%2Fflash_sale',
  'https://s.shopee.vn/an_redir?affiliate_id=17350340019&utm_medium=affiliates&origin_link=https%3A%2F%2Fshopee.vn%2Fm%2Fkhung-gio-san-sale',
]
```

---

### 2. Affiliate Helper (CORE - CẦN CẬP NHẬT)
**File:** `src/helpers/affiliate.helper.ts`

**Line 73-118:** `genSub3Link()` - Thêm sub3 tracking
```typescript
// Detect Shopee: checkShopeeLink()
// Manipulate sub_id với format: --{sub3}--
// Preserve origin_link parameter
```

**Line 120-172:** `generateLink()` - Main link generation
```typescript
// Check tracking URL patterns
// Handle Shopee platform detection
// Call mapLinkWithPlatform() cho Shopee links
```

**Line 174-196:** `mapLinkWithPlatform()` - **ĐÂY LÀ NƠI TẠO DYNAMIC LINK**
```typescript
// Lấy Shopee affiliate ID từ settings
// Thay thế {{referral_id}}, {{url}}, {{sub3}} placeholders
// Sử dụng template từ DYNAMIC_LINK.shopee
```

**Line 198-231:** `mapLinkWithTrackingUrl()` - Xử lý pre-formatted tracking URLs
```typescript
// Cho Shopee (line 203): Extract origin_link parameter
// Reconstruct link với current referral_id và sub3
```

**Line 288-304:** `cleanLink()` - Clean 47 tracking params
```typescript
// Xóa: affiliate_id, sub_id, utm_* params...
```

---

### 3. Link Validation
**File:** `src/helpers/validateLink.ts`

**Line 2-10:** `checkShopeeLink()` - Detect Shopee domain
```typescript
// Match: shopee.vn, shope.ee, shp.ee
```

**Line 18-26:** `checkLoyaltyLinkShopee()` - Loyalty-specific

**Line 39-43:** `checkShopeefoodLink()` - Exclude ShopeeFood từ affiliate tracking

---

### 4. useGenerateLoyaltyLink Hook
**File:** `src/hooks/useGenerateLoyaltyLink.tsx`

**Line 17-32:** `genShopeeLink()` - Generate loyalty link
```typescript
// Gọi backend generateShopeeShortLink() API (line 18)
// Fallback to local generateLinkHook() nếu API fail
// Skip ShopeeFood links
```

---

### 5. Redirect Screen
**File:** `src/screens/redirect/RedirectScreen.tsx`

**Line 46:** Import `useAffiliateLink` hook

**Line 77-109:** `redirect()` - Redirect với AppsFlyer analytics

**Line 130-256:** `generateLink()` - Generate tracking link khi redirect
```typescript
// Sử dụng generateShopeeShortLink API mutation (line 53)
// Fallback to generateLinkHook (line 185)
// Exclude ShopeeFood (line 181)
```

---

### 6. Loyalty Input Section
**File:** `src/screens/tab-navigation/loyalty/components/LoyaltyInputSection.tsx`

**Line 25:** Import `useAffiliateLink`

UI cho tool generate Shopee link.

---

### 7. Tool Find Voucher
**File:** `src/components/tool/shopee/ToolFindVoucher.tsx`

**Line 8, 53:** Validate Shopee link với `checkShopeeLink()`

---

### 8. Link Service API
**File:** `src/services/link.service.ts`

**Line 33-39:** RTK Query endpoint
```typescript
generateShopeeShortLink: builder.mutation<any, { originUrl: string }>({
    query: (body) => ({
        url: '/shopee/generate-short-link',
        method: 'POST',
        body,
    }),
}),
```

---

## Pattern hiện tại

**Template:**
```
https://s.shopee.vn/an_redir?affiliate_id={{referral_id}}&utm_medium=affiliates&sub_id={{sub3}}&origin_link={{url}}
```

**Hardcoded Affiliate ID:** `17350340019`

**Sub3 Format:** `--{sub3}--`

---

## Đề xuất thay đổi

### 1. Cập nhật constants.ts
Thay các hardcoded dynamic links bằng shortlinks:
```typescript
voucher_wallet_link = 'https://s.shopee.vn/ABC123?sub_id=...'
flash_sale_shopee_link = ['https://s.shopee.vn/XYZ789?sub_id=...']
```

### 2. Cập nhật config.example.ts
Thay template:
```typescript
// Cũ
'https://s.shopee.vn/an_redir?affiliate_id={{referral_id}}&utm_medium=affiliates&sub_id={{sub3}}&origin_link={{url}}'
// Mới
'https://s.shopee.vn/{{shortId}}?sub_id={{sub_params}}'
```

### 3. Cập nhật affiliate.helper.ts
- `mapLinkWithPlatform()`: Gọi API backend để lấy shortlink thay vì build dynamic link
- `mapLinkWithTrackingUrl()`: Xử lý shortlink format mới
- Có thể cần API mới để convert origin URL → shortlink với sub_id

### 4. Sử dụng API backend
Ưu tiên sử dụng `generateShopeeShortLink` API (đã có sẵn) thay vì generate local.

---

## Lưu ý quan trọng
- App có nhiều **hardcoded links** cần cập nhật
- Logic generate link ở **client-side** có thể không đồng bộ với backend
- Nên chuyển sang **luôn gọi API** để đảm bảo consistency

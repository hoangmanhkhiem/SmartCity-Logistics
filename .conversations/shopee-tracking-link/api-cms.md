# Shopee Tracking Links - api-cms

## Tổng quan
`api-cms` là backend cho CMS portal, chịu trách nhiệm tạo tracking link cho các content như voucher, banner, deal...

## Các file liên quan

### 1. Link Service (Core)
**File:** `src/modules/link/link.service.ts`

**Line 39-42:** `generateLink()` - Method chính
```typescript
async generateLink(originUrl: string, isNewReferralAccount?: boolean, sub5?: string)
```

**Line 45-98:** `_generateLinkFromPublisher()` - Tạo link qua gRPC Publisher
```typescript
const payload = {
    referralSecret,      // Từ settings
    isTrackingLink: true,
    originUrl,
    sub1: '',
    sub2: '',
    sub3: '',
    offerKey: 'shopee',  // hoặc 'lazada'
    sub5: sub5 || '',
};
// Gọi gRPC: this.grpcLinkService.generateLink(payload)
```

**Line 100-115:** `_determinePlatform()` - Detect Shopee
- Match: `shopee.vn`, `vn.shp.ee`

---

### 2. Shopee Helper
**File:** `src/common/helpers/shopee.helper.ts`

**Line 7-49:** `prepareLinkProduct()` - Extract shopId/itemId
- Handle shortlinks: `shope.ee`, `shp.ee`
- Normalize sang: `https://shopee.vn/product-i.<shopId>.<itemId>`

**Line 51-94:** `doubleCheckLink()` - Resolve redirect

**Line 96-126:** `getVoucherDetail()` - Lấy thông tin voucher từ Shopee API

---

### 3. Shortlink Helper
**File:** `src/common/helpers/short-link.helper.ts`

**Line 6-26:** `affLinksConvert()` - Tạo shortlink qua publisher API
```typescript
const originUrl = linkProduct !== '' ? linkProduct :
    `https://shopee.vn/search?promotionId=${promotionId}&signature=${signature}`;

// POST: ${process.env.PUB_HOST}/api/u/links/new_one_time
// Return: result?.data?.data?.trackingUrl
```

---

### 4. Voucher Service
**File:** `src/modules/voucher/voucher.service.ts`

**Line 603-605:** Tạo 3 tracking link cho voucher
```typescript
this.linkService.generateLink(params.linkBanner || params.link, true, 'VOUCHER'),
this.linkService.generateLink(listApplyLink, true, 'VOUCHER'),
this.linkService.generateLink('https://shopee.vn/user/voucher-wallet', true, 'VOUCHER')
```

**Line 816:** Direct Shopee voucher URL
```typescript
const link = `https://shopee.vn/voucher/details?evcode=${evcode}&from_source=voucher-wallet&promotionId=${voucher?.voucher_basic_info?.promotionid}&signature=${voucher?.voucher_basic_info?.signature}`;
```

---

### 5. Các service gọi generateLink()

| File | Lines | Mô tả |
|------|-------|-------|
| `hot-deal-product/hot-deal-product.service.ts` | 71, 95 | Hot deal product links |
| `brand-reward-coin/brand-reward-coin.service.ts` | 97, 101, 105, 208, 212, 216 | Brand reward links |
| `banner/banner.service.ts` | 84, 104 | Banner external links |
| `popup-banner/popup-banner.service.ts` | 87, 120 | Popup banner links |
| `banner-deal/banner-deal.service.ts` | 69, 102 | Deal banner links |
| `shopee-live/shopee-live.service.ts` | 331, 406-407 | Shopee live links |
| `supplier/supplier.service.ts` | 76, 103 | Supplier website links |
| `hot-deal-voucher/hot-deal-voucher.service.ts` | 148, 180 | Hot deal voucher affLinks |
| `popup-icon/popup-icon.service.ts` | 72, 95 | Popup icon URLs |
| `supplier-blog/supplier-blog.service.ts` | 82, 105 | Supplier blog external links |
| `following-voucher/following-voucher.service.ts` | 89, 125 | Following voucher links |

---

## Pattern link Shopee

1. **Tracking URL** (qua gRPC Publisher): Trả về `trackingUrl`
2. **Voucher Direct**: `https://shopee.vn/voucher/details?evcode=<base64>&promotionId=<id>&signature=<sig>`
3. **Product**: `https://shopee.vn/product-i.<shopId>.<itemId>`
4. **Voucher Wallet**: `https://shopee.vn/user/voucher-wallet`
5. **Search Promo**: `https://shopee.vn/search?promotionId=<id>&signature=<sig>`

---

## Settings cần cấu hình
- `referral_shopee_id`: Shopee affiliate ID chính
- `referral_shopee_id_2`: Shopee affiliate ID phụ (cho new referral)
- `short_domain`: Domain rút gọn

---

## Đề xuất thay đổi
1. Cập nhật `_generateLinkFromPublisher()` để yêu cầu shortlink từ publisher
2. Đảm bảo gRPC publisher service trả về shortlink format mới

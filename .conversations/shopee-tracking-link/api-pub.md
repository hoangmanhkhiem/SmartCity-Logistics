# Shopee Tracking Links - api-pub

## Tổng quan
`api-pub` là backend cho cms-publisher, đây là nơi **CHÍNH** tạo ra dynamic link Shopee. Đây là service cần thay đổi để chuyển sang shortlink format.

## Các file liên quan

### 1. Aff Link Service (CORE - Cần thay đổi)
**File:** `src/modules/links/providers/aff-link.service.ts`

**Line 118-122:** `Shopee()` - **ĐÂY LÀ NƠI TẠO DYNAMIC LINK**
```typescript
private Shopee(refAccount: ReferralAccountEntity, linkDto: CreateLinkDTO | UpdateLinkDTO): string {
  const baseLink = `https://s.shopee.vn/an_redir?utm_medium=affiliates&affiliate_id=${refAccount.referralCode}`;
  const affLink = this.GenUTMContents(baseLink, linkDto, 'sub_id');
  return `${affLink}&origin_link=${encodeURIComponent(linkDto.originUrl)}`;
}
```

**Line 163-177:** `GenUTMContents()` - Tạo sub_id tracking
```typescript
private GenUTMContents(
  affLink: string,
  linkDto: CreateLinkDTO | UpdateLinkDTO,
  subKey: string = 'utm_content',
): string {
  // Format: sub_id={sub1}-{sub2}-{sub3}-{sub4}-{sub5}-{sub6}-{subAff}
  subString = `${subKey}=${linkDto.sub1 || ''}-${linkDto.sub2 || ''}-...`;
  return `${affLink}${affLink.includes('?') ? '&' : '?'}${subString}`;
}
```

**Line 20-49:** `generateAffiliateLink()` - Orchestration method
```typescript
async generateAffiliateLink(refAccount, linkDto): Promise<string> {
  switch (refAccount.referralKey) {
    case ReferralKeyType.SHOPEE:
      affLink = this.Shopee(refAccount, linkDto);
      break;
    // ...
  }
  return this.affLinkMapper(refAccount, affLink);
}
```

---

### 2. Dynamic Link Config
**File:** `src/config/dynamic-link.config.ts`

**Line 2:** Template Shopee dynamic link
```typescript
export const DYNAMIC_LINK = {
  ['shopee.vn']: 'https://s.shopee.vn/an_redir?utm_medium=affiliates&affiliate_id={{referral_id}}&origin_link={{url}}',
  // ...
};
```

---

### 3. Link Service
**File:** `src/modules/links/providers/link.service.ts`

**Line 67:** Create link flow
```typescript
let trackingUrl = createLinkDto.originUrl;
if (refAccount) {
  trackingUrl = await this.genAffLinkService.generateAffiliateLink(refAccount, createLinkDto);
}
const newLink = await this._createShortLink(createLinkDto, currentUser.id, trackingUrl);
```

**Line 210:** Update link flow
```typescript
if (refAccount) {
  link.trackingUrl = await this.genAffLinkService.generateAffiliateLink(refAccount, updateLinkDto);
}
```

**Line 469-470:** Platform detection
```typescript
case url.includes('shopee.vn'):
  platform = 'shopee';
  break;
```

---

### 4. Link Entity
**File:** `src/modules/links/entities/link.entity.ts`

Các field liên quan:
- `trackingUrl` (line 42-43): Lưu tracking link đã generate
- `sub1` - `sub6`, `subAff` (line 45-64): Các tracking parameters
- `referralAccountId` (line 33-34): Link đến Shopee affiliate account

---

### 5. Controller Endpoints
**File:** `src/modules/links/link.controller.ts`

| Endpoint | Line | Mô tả |
|----------|------|-------|
| `POST /` | 21-30 | Tạo 1 link |
| `POST /bulk-links` | 110-119 | Tạo nhiều links |

---

## Pattern hiện tại (Dynamic Link)

```
https://s.shopee.vn/an_redir?utm_medium=affiliates&affiliate_id={AFFILIATE_ID}&origin_link={ENCODED_URL}&sub_id={SUB1}-{SUB2}-{SUB3}-{SUB4}-{SUB5}-{SUB6}-{SUBAFF}
```

---

## Đề xuất thay đổi

### Option 1: Gọi Shopee Open API để tạo shortlink
Thay đổi method `Shopee()` trong `aff-link.service.ts`:

```typescript
private async Shopee(refAccount: ReferralAccountEntity, linkDto: CreateLinkDTO | UpdateLinkDTO): Promise<string> {
  // Gọi Shopee Open API để tạo shortlink
  const shortLink = await ShopeeOpenApiHelper.generateShortLink(
    linkDto.originUrl,
    [linkDto.sub1, linkDto.sub2, linkDto.sub3, linkDto.sub4, linkDto.sub5]
  );
  return shortLink; // Format: https://s.shopee.vn/5AmFu7JJs8?sub_id=...
}
```

### Option 2: Cập nhật DYNAMIC_LINK config
Nếu Shopee hỗ trợ format shortlink với parameters:

```typescript
export const DYNAMIC_LINK = {
  ['shopee.vn']: 'https://s.shopee.vn/{{shortId}}?sub_id={{sub_params}}',
};
```

---

## Lưu ý quan trọng
- `api-pub` là **nguồn gốc** của việc tạo dynamic link
- Các service khác (api-portal, api-cms) đều gọi về đây thông qua gRPC hoặc HTTP
- Thay đổi ở đây sẽ ảnh hưởng đến **toàn bộ hệ thống**

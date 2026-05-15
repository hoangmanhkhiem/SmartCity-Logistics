# Shopee Tracking Links - cms-portal

## Tổng quan
`cms-portal` là frontend CMS quản lý nội dung app. Không trực tiếp tạo tracking link, chỉ gọi API backend và hiển thị kết quả.

## Các file liên quan

### 1. Voucher API
**File:** `src/api/voucher.js`

**Line 8-9:** API endpoints
```javascript
const createVoucherLink = (link) => usePubFetch('/voucher/create-voucher-by-link', { method: 'POST', body: link });
const createCrawlVoucher = (body) => usePubFetch('/voucher/crawl-voucher', { method: 'POST', body });
```

---

### 2. Voucher Form Link
**File:** `src/components/voucher/form/VoucherFormLink.vue`

**Line 20:** Gọi API tạo voucher link
```javascript
await $api.vouchers.createVoucherLink(dataLink);
```

Form fields:
- `link`: Link gốc
- `linkBanner`: Link banner
- `type`: `manual_entry` | `banner` | `wallet`

---

### 3. Voucher Form
**File:** `src/components/voucher/form/voucherForm.vue`

**Line 70:** Flag để auto-shorten link
```javascript
if (bodyData.affLink) {
    bodyData.isUpdateAffLink = true;
}
```

**Line 178-179:** Input field với label "Tự động rút gọn link"

---

### 4. Voucher Form Discount
**File:** `src/components/voucher/form/VoucherFormDiscount.vue`

**Line 75-76:** Tương tự flag auto-shorten
```javascript
if (bodyData.affLink) {
    bodyData.isUpdateAffLink = true;
}
```

**Line 200:** Input field cho `form.affLink` với label "Link banner"

---

### 5. Voucher Item Display
**File:** `src/components/VoucherItem.vue`

**Line 59:** Hiển thị % sử dụng chỉ cho Shopee
```javascript
const showPercentUsed = computed(() =>
  !hiddenItems.value?.includes('percentageUsed')
  && form.value?.supplier?.slug === 'shopee'
  && form?.value?.detailLink
);
```

**Line 136-142:** Hiển thị link icon với `detailLink`

---

### 6. Voucher Constants
**File:** `src/constants/voucher.js`

**Line 18-23:** Shopee voucher types
```javascript
shopee: [
    { title: 'Mã nhập tay', value: 'manual_entry' },
    { title: 'Mã banner', value: 'banner' },
    { title: 'Mã ví', value: 'wallet' },
],
```

---

### 7. Landing Page Store
**File:** `src/stores/landingPage.js`

**Line 8, 25-26:** Hardcoded Shopee links
```javascript
{
    id: 412,
    link: 'https://shopee.vn/m/fashion-friday-2601',
    offer: 'shopee',
}
```

---

### 8. Hot Deal Voucher
**File:** `src/constants/hotDealVoucher.js` - Line 8
**File:** `src/components/hotDealVoucher/HotDealVoucherForm.vue` - Line 219

Các field `affLink`, `listApplyLink` được sử dụng.

---

## Các loại link

1. **affLink**: Affiliate link, được auto-shorten khi `isUpdateAffLink = true`
2. **detailLink**: Link chi tiết voucher (generated từ backend)
3. **listApplyLink**: Link danh sách sản phẩm áp dụng
4. **linkBanner**: Link banner voucher
5. **Landing Page Links**: Direct Shopee URLs

---

## Đề xuất thay đổi

**Không cần thay đổi gì ở cms-portal** vì:
- Không trực tiếp generate tracking link
- Chỉ gọi API backend và hiển thị kết quả
- Logic tạo link nằm ở `api-cms` và `api-pub`

Tuy nhiên, cần **kiểm tra** các hardcoded link trong:
- `src/stores/landingPage.js`: Có thể có dynamic links cũ

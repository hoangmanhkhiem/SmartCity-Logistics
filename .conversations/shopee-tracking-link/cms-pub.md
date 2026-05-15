# Shopee Tracking Links - cms-pub

## Tổng quan
`cms-pub` là frontend cho CMS publisher, nơi admin tạo và quản lý tracking links. Không trực tiếp tạo dynamic link, nhưng có UI để configure referral accounts và hiển thị tracking URLs.

## Các file liên quan

### 1. Link Form Component
**File:** `src/components/links/LinkForm.vue`

**Line 52-67:** Xử lý response sau khi tạo link
```javascript
linkStore.submitForm(bodyData).then((res) => {
    const shortId = res.data.shortId
    if (domainId.value) {
        const domainItem = domainStore.domains?.find((domain) => domain.id === domainId.value);
        if (form.value?.type === 'hyperlink') {
            links.value = [`[${domainItem?.protocol}://${domainItem?.domain}/${shortId}](${res.data.trackingUrl})`]
            return;
        }
        links.value = [`${domainItem?.protocol}://${domainItem?.domain}/${shortId}`]
        return;
    }
    // ...
})
```

**Line 23-25:** Form với referral account
```javascript
form = ref({
    referralAccountId: referralAccountIds.value,
    name: referralAccountName.value,
    originUrl: '',
    type: 'hyperlink',
});
```

---

### 2. Series Link Creation
**File:** `src/pages/links/series-create.vue`

**Line 99, 104:** Thay thế link bằng tracking URL
```javascript
form.value.contentOutput = form.value.contentOutput?.replace(
    linksOrigin[i].originText,
    `[c link=${seriesLinksData.value?.[i]?.trackingUrl}]`
);
// hoặc
form.value.contentOutput = form.value.contentOutput?.replace(
    linksOrigin[i].originText,
    `[${linksReplace[i]}](${seriesLinksData.value?.[i]?.trackingUrl})`
);
```

**Line 88-92:** Bulk link creation
```javascript
const bodyData = { ...form.value, refAccountIds: convertReferralId, links: val };
const res = await $api.links.createSeriesLink(bodyData)
seriesLinksData.value = res?.data;
```

---

### 3. Link Validation
**File:** `src/utils/validators.js`

**Line 9-20:** Validate Shopee domain
```javascript
export const validateLink = (referralAccount, originUrl) => {
    if (referralAccount?.toLocaleLowerCase().includes('shopee')
     && !(originUrl?.toLocaleLowerCase().includes('shopee')
    || originUrl?.toLocaleLowerCase().includes('shp.ee')
    || originUrl?.toLocaleLowerCase().includes('shope.ee'))) {
        return 'Link gốc phải là domain của Shopee (ex: shopee.vn, https://shp.ee/..., https://shope.ee/... )'
    }
    // ...
    return true;
};
```

---

### 4. Referral Account Constants
**File:** `src/constants/account.js`

**Line 1:** Supported platforms
```javascript
export const ReferralKeyType = [
    { title: 'Shopee', value: 'shopee' },
    { title: 'Lazada', value: 'lazada' },
    { title: 'Accesstrade', value: 'accesstrade' },
    // ...
]
```

---

### 5. Referral Account Form
**File:** `src/components/accounts/referral/ReferralAccountForm.vue`

**Line 111-117:** Dynamic URL field
```vue
<AppTextField
    v-model="form.dynamicUrl"
    label="Dynamic Link"
    :rules="[requiredValidator]"
    required
    clearable
/>
<span>Chú ý: {{url}} sẽ được thay thế bằng link cuối</span>
```

**Line 32:** Submit dynamic URL
```javascript
const bodyData = {
    ...form.value,
    referralCode: parseFloat(form.value.referralCode),
    dynamicUrl: form.value.dynamicUrl.trim()
}
```

---

### 6. Link Store
**File:** `src/stores/link.js`

**Line 21-46:** Submit link operations
```javascript
async submitForm(form) {
    form.referralAccountId = !form.referralAccountId ? null : form.referralAccountId
    delete form.name
    if (!form?.id) {
        return $api.links.postLink(form).then((res) => { ... })
    }
    return $api.links.updateLink(form.id, form).then((res) => { ... })
}
```

---

### 7. Links API
**File:** `src/api/links.js`

**Line 2-8:** API endpoints
```javascript
getLinks: (params) => usePubFetch('/publisher/links', { params }),
postLink: (body) => usePubFetch('/publisher/links', { method: 'POST', body }),
updateLink: (id, body) => usePubFetch(`/publisher/links/${id}`, { method: 'PATCH', body }),
deleteLink: (id) => usePubFetch(`/publisher/links/${id}`, { method: 'DELETE' }),
createSeriesLink: (body) => usePubFetch('/publisher/links/bulk-links', { method: 'POST', body }),
```

---

### 8. Link Cleaning Utility
**File:** `src/utils/cleanLink.js`

**Line 3-16:** Clean tracking params trước khi tạo link mới
```javascript
export const cleanSeriesLink = async (link) => {
    const cleanLink = res.request?.responseURL.replace(
        /((utm_source|sub|utm_content|utm_term|af_siteid|trafficFrom|scm|laz_trackid|mkttid|laz_trackid)[^&]+)&?/g,
        '',
    )
    return cleanLink;
};
```

---

## Workflow tạo link

1. Admin chọn Shopee referral account (với `dynamicUrl` template)
2. Nhập origin URL (validated là Shopee domain)
3. Frontend POST đến `/publisher/links` hoặc `/publisher/links/bulk-links`
4. Backend (`api-pub`) tạo tracking URL theo template
5. Frontend nhận `trackingUrl` và `shortId`
6. Hiển thị: `[domain/shortId](trackingUrl)`

---

## Đề xuất thay đổi

**Không cần thay đổi code cms-pub** vì:
- Không trực tiếp tạo dynamic link pattern
- Chỉ hiển thị `trackingUrl` từ backend response
- Logic tạo link nằm ở `api-pub`

**Cần review:**
- Referral accounts đã tạo có thể đang dùng `dynamicUrl` template cũ
- Admin cần update lại referral account settings với shortlink template mới

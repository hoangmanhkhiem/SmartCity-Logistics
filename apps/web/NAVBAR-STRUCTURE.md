# Cấu trúc Navbar Mới - Urban Logistics

## 🎯 Tổng quan

Navbar đã được tổ chức lại theo **4 nhóm chức năng chính** với cấu trúc phân cấp (accordion groups) để dễ điều hướng và giảm sự rối loạn cho admin.

## 📋 Cấu trúc Routes

### Base Route: `/logistics`

Tất cả các trang admin/logistics đều bắt đầu với `/logistics/`

## 🗂️ Cấu trúc Navbar

### 🎯 Dashboard (Quick Access)
- **Dashboard** → `/logistics/dashboard`
  - Trang tổng quan với các KPI và thống kê chính

---

### ⚙️ Nhóm 1: Quản lý hệ thống
*Icon: Settings (⚙️)*

Quản lý cấu hình hệ thống, người dùng và tích hợp

- **Người dùng & Vai trò** → `/logistics/users`
  - Quản lý nhân viên, phân quyền
  
- **API Keys** → `/logistics/api-keys`
  - Tạo và quản lý API keys cho tích hợp bên ngoài
  
- **Tích hợp** → `/logistics/integrations`
  - Tích hợp với các dịch vụ bên thứ 3
  
- **Cài đặt** → `/logistics/settings`
  - Cấu hình hệ thống chung

---

### 💬 Nhóm 2: Nội dung & Cộng đồng
*Icon: MessageSquare (💬)*

Quản lý nội dung và tương tác với cộng đồng

- **Quản lý Trạm** → `/logistics/stations`
  - CRUD các trạm logistics (Hub, Distribution Center, MFC)
  
- **Bài viết** → `/logistics/articles`
  - Quản lý bài viết, hướng dẫn, tin tức
  
- **Đánh giá** → `/logistics/reviews`
  - Quản lý đánh giá từ người dùng
  
- **Báo lỗi** → `/logistics/reports`
  - Xử lý các báo lỗi từ người dùng

---

### 🚚 Nhóm 3: Vận hành Logistics
*Icon: Truck (🚚)*

Vận hành hàng ngày của hệ thống logistics

- **Cơ sở Logistics** → `/logistics/facilities`
  - Quản lý kho, hub, trạm trung chuyển
  - Import/Export CSV/GeoJSON
  
- **Gợi ý Cơ sở** → `/logistics/facility-suggest`
  - Gợi ý tuyến đường và cơ sở tối ưu
  - Hiển thị hạn chế trên bản đồ
  
- **Đội xe** → `/logistics/vehicles`
  - Quản lý phương tiện vận tải
  - Theo dõi phát thải, nhiên liệu
  
- **Tuyến đường** → `/logistics/routes`
  - Quản lý các tuyến đường
  - Theo dõi khoảng cách và phát thải CO2
  
- **Đơn hàng** → `/logistics/orders`
  - Quản lý đơn hàng
  - Tạo và import đơn hàng
  
- **Báo giá** → `/logistics/quotes`
  - So sánh báo giá từ các carrier
  - Chọn điểm lấy/giao trên bản đồ
  
- **Tối ưu tuyến** → `/logistics/optimize`
  - Chạy thuật toán VRP (Vehicle Routing Problem)
  - Tối ưu hóa chi phí và giảm phát thải
  
- **Điều phối** → `/logistics/dispatch`
  - Phân công đơn hàng cho tài xế
  
- **Giám sát Realtime** → `/logistics/monitor`
  - Theo dõi xe realtime trên bản đồ
  - Telemetry và trạng thái giao hàng

---

### 🛡️ Nhóm 4: Quy định & Báo cáo
*Icon: Shield (🛡️)*

Quản lý quy định và báo cáo cho cơ quan quản lý

- **Vùng & Zone** → `/logistics/zones`
  - Quản lý vùng địa lý (LEZ, quận, khu thương mại)
  
- **Quản lý cấm đường** → `/logistics/restrictions` 🗺️
  - Quản lý cấm đường trên bản đồ Mapbox
  - Thiết lập road segments, time restrictions
  - Chọn loại xe bị cấm, zone-based restrictions
  - Geometry JSON cho đường cấm
  - Mô phỏng theo thời điểm với màu sắc trực quan
  
- **Báo cáo & KPI** → `/logistics/reports-kpi`
  - Dashboard báo cáo hiệu suất
  - KPIs: thời gian giao hàng, tỷ lệ thành công, hài lòng khách hàng
  
- **Dữ liệu nghiên cứu** → `/logistics/research`
  - Dataset cho nghiên cứu
  - Export dữ liệu giao thông, phát thải, hạ tầng

---

## 🎨 Tính năng UI

### Accordion Groups
- Mỗi nhóm có thể mở/đóng độc lập
- Tự động expand khi có page con đang active
- Icon màu sắc phân biệt rõ ràng

### Collapse Mode
- Sidebar có thể thu gọn với nút toggle
- Khi collapse: chỉ hiển thị icon
- Tooltip hiển thị label khi hover

### Active State
- Highlight page đang xem
- Group icon đổi màu xanh khi có child active

---

## 🔧 Cách thêm mới

### Thêm page mới vào group có sẵn

```tsx
// Trong sidebar.tsx
{
    label: 'Tên nhóm',
    icon: <Icon size={20} />,
    items: [
        // ... existing items
        { 
            label: 'Page mới', 
            href: '/logistics/new-page', 
            icon: <NewIcon size={18} /> 
        },
    ],
}
```

### Tạo group mới

```tsx
export const logisticsNavItems: NavConfig[] = [
    // ... existing groups
    {
        label: 'Nhóm mới',
        icon: <GroupIcon size={20} />,
        items: [
            { label: 'Page 1', href: '/logistics/page1', icon: <Icon1 size={18} /> },
            { label: 'Page 2', href: '/logistics/page2', icon: <Icon2 size={18} /> },
        ],
    },
];
```

### Thêm page standalone (không thuộc group)

```tsx
export const logisticsNavItems: NavConfig[] = [
    { label: 'Dashboard', href: '/logistics/dashboard', icon: <LayoutDashboard size={20} /> },
    // Single item - không có 'items' property
    { label: 'Page đơn', href: '/logistics/single', icon: <Icon size={20} /> },
    // Groups...
];
```

---

## 📱 Routes vs Roles

| Role | Base Route | Navbar | Pages |
|------|-----------|--------|-------|
| **admin** | `/logistics/*` | `logisticsNavItems` (4 groups, 22 pages) | Dashboard + 4 nhóm chức năng |
| **carrier_mgr/dispatcher** | `/delivery/*` | `deliveryNavItems` (6 pages) | Dashboard, Drivers, Fleet, Orders, Routes, Tracking |
| **regulator** | `/regulator/*` | `regulatorNavItems` (6 pages) | Dashboard, Zones, Research, Reports, Carriers, Restrictions |
| **consumer** | `/consumer/*` | `consumerNavItems` (4 pages) | Map, Orders, Tracking, Search |

---

## 🚀 Auth Flow

```typescript
// Login → setAuth() → getDashboardPath(role)
getDashboardPath('admin') → '/logistics/dashboard'
```

---

## 📝 Notes

- Tất cả pages đã được tạo với template cơ bản
- Mỗi page có stats cards, search, và DataTable
- Dữ liệu hiện tại là mock data - cần kết nối API thực
- Responsive design với dark mode support
- Sử dụng lucide-react icons

---

**Ngày cập nhật:** 2026-05-16
**Version:** 2.0 - Hierarchical Navigation

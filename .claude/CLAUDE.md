# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Đây là project tổng (mono-repo), quản lý các micro services trong hệ sinh thái Piggi thông qua git submodules.

Piggi là một hệ sinh thái với ứng dụng trung tâm tên là **Nô Tì** (BlogGiamGia) - một ứng dụng deals/vouchers/loyalty
dành cho người dùng Việt Nam.

## Repository Structure

| Submodule             | Description                                           | Tech Stack                                   |
|-----------------------|-------------------------------------------------------|----------------------------------------------|
| **api-portal**        | Backend chính cho App Nô Tì (NestJS version)          | NestJS, TypeORM, MySQL, Redis, Elasticsearch |
| **api-portal-golang** | Backend chính cho App Nô Tì (Go migration)            | Go, Echo, GORM, MySQL, Redis                 |
| **api-cms**           | Backend cho cms-portal                                | NestJS, TypeORM, MySQL, MongoDB              |
| **api-pub**           | Backend cho cms-publisher                             | NestJS, TypeORM, MySQL, MongoDB              |
| **api-notification**  | Notification microservice (FCM, APNS, Telegram, Zalo) | NestJS, RabbitMQ, Firebase, Elasticsearch    |
| **cms-portal**        | CMS quản lý nội dung app (deals, voucher, setting)    | Nuxt 3, Vuetify, Pinia, TailwindCSS          |
| **cms-pub**           | CMS quản lý tracking link, shortlink                  | Nuxt 3, Vuetify, Pinia, TailwindCSS          |
| **app-noti**          | Ứng dụng React Native cho Nô Tì                       | React Native 0.77, Redux Toolkit, NativeWind |
| **app-notification**  | Backend service handle việc gửi thông báo APNS & FCM  | NestJS, TypeORM, MySQL                       |
| **worker-product-consulting** | Worker service xử lý cron jobs và tác vụ định kỳ | NestJS, TypeORM, Mongoose, Redis, gRPC |

## Worker Product Consulting Service Details

**worker-product-consulting** là worker service chạy các tác vụ định kỳ:

**Chức năng chính:**
- Crawl dữ liệu Shopee (livestreams, videos, products)
- Xử lý flash sales và loyalty gifts
- Quản lý user ranking, referrals, rewards
- Task matching (cross-task và point-task)
- Xử lý interactions (deal comments, likes, views)
- Game mechanics (mooncake, noti war, shaking envelopes)
  - Quản lý chat groups

**Kiến trúc:**
- Dual database: MySQL (TypeORM) + MongoDB (Mongoose)
- Redis caching
- gRPC microservices communication
- Sentry monitoring
- Scheduled jobs với `@CronWithSentry` decorator

**Lưu ý quan trọng:**
- Tất cả entities/models từ package `@piggi-group/piggi-portal-database`
- Cron jobs mặc định disabled, cần enable qua env variables
- Global API prefix: `/worker`
- Sử dụng QueryRunner pattern cho atomic operations

## Luồng gửi thông báo
- Publisher:
  - cms-portal: chức năng gửi thông báo tới một tập tagged users trong bảng user_tags hoặc gửi all
  - api-portal: worker tính điểm đơn hàng cho user sau đó gửi thông báo
  - worker-product-consulting: gRPC client gửi thông báo cho các sự kiện định kỳ (ranking updates, task matching, etc.)
## Getting Started

```bash
# Initialize all submodules
make git-submodules-init

# Or manually
git submodule init && git submodule update
```

---
name: investigate
description: This skill is used to investigate an issue that may related to multiple repositories.
---

### 🎯 Role

> You are a senior fullstack engineer who deeply understands react native app, microservice architectures, git workflows, and common production failure patterns.
> Your job is to investigate issues
---

### 📦 Project Context

This repository contains multiple sub-repositories.
Each sub-repository represents a microservice.

#### Services/Repositories

**Backend Services:**
- **api-portal** – Main app backend (NestJS). Handles deals, vouchers, loyalty, user management. Stack: NestJS, TypeORM, MySQL, Redis, Elasticsearch
- **api-portal-golang** – Main app backend (Go migration). Same domain as api-portal. Stack: Go, Echo, GORM, MySQL, Redis
- **api-cms** – Backend for cms-portal. Manages content, deals, vouchers, app settings. Stack: NestJS, TypeORM, MySQL, MongoDB
- **api-pub** – Backend for cms-pub. Manages tracking links, shortlinks. Stack: NestJS, TypeORM, MySQL, MongoDB
- **api-notification** – Notification service. Sends push notifications via FCM, APNS, Telegram, Zalo. Stack: NestJS, RabbitMQ, Firebase, Elasticsearch

**Frontend Services:**
- **cms-portal** – Admin CMS for managing app content (deals, vouchers, settings). Stack: Nuxt 3, Vuetify, Pinia, TailwindCSS
- **cms-pub** – Admin CMS for managing tracking/shortlinks. Stack: Nuxt 3, Vuetify, Pinia, TailwindCSS

**Mobile App:**
- **app-noti** – Nô Tì (BlogGiamGia) mobile app. End-user facing deals/vouchers/loyalty app. Stack: React Native 0.77, Redux Toolkit, NativeWind


---

### 📥 Input

User will provide:

* Issue description (error, wrong behavior, performance, data issue…)
* (Optional) Service name(s) if known
* (Optional) Approximate time the issue started

If information is missing, ask **only the minimum necessary questions** before investigating.

---

### 🧠 Investigation Strategy (STRICT FLOW)

Before checking each repository, you must pull the latest commit first.

When investigating, follow **exactly** this process:

#### Step 1 – Identify relevant services

* Based on the issue description, determine:

    * primary affected service(s)
    * secondary / upstream / downstream services (if applicable)
* Clearly state *why* each service is considered relevant.

#### Step 2 – Root cause hypothesis

* Propose **1–3 most likely root causes**
* Rank them by probability
* Be explicit about uncertainty if evidence is weak.

Tôi tạo link bằng API /generate-link-loyalty trong api-portal thì thấy app hiện 
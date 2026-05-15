# 🚀 Phase 1 MVP Roadmap - Survey Mini-app

## 🎯 Mục tiêu Phase 1

**Scope:** CHỈ tính năng khảo sát, CHƯA phát điểm (rewards deferred to Phase 2)

**Success Criteria:**
- ✅ Admin tạo được campaign + 8 câu hỏi
- ✅ User làm được survey, data được lưu đầy đủ
- ✅ Có thể export data để phân tích
- ❌ KHÔNG phát điểm trong Phase 1

**Timeline:** **3 tuần** (includes image_choice support)

**Updated Scope:**
- ✅ 8 base question types
- ✅ **Image choice variant** (image_grid display mode)
- ✅ Image upload APIs + CMS UI
- ✅ ImageChoiceRenderer mobile component

---

## 📋 Phase 1 Feature Checklist

### ✅ IN SCOPE (Làm trong Phase 1)

#### 1. Database & Schema
- [ ] Final schema với **4 tables** (NO rewards):
  - `survey_campaigns`
  - `survey_questions`
  - `survey_responses` (1 user = 1 response per campaign)
  - `survey_answers`
  - ~~`survey_rewards`~~ ❌ Deferred to Phase 2
- [ ] Triggers auto-calculate basic metrics
- [ ] Views cho analytics
- [ ] Constraints & validation
- [ ] Migration scripts

#### 2. Backend APIs - User-facing
- [ ] `GET /api/surveys/active` - List active surveys
- [ ] `GET /api/surveys/:id` - Get survey details + questions
- [ ] `POST /api/surveys/:id/start` - Start survey (create response)
- [ ] `POST /api/surveys/:id/answers` - Save/Update answers (UPSERT)
- [ ] `POST /api/surveys/:id/complete` - Complete survey
- [ ] `GET /api/surveys/:id/my-responses` - User's response history

**Business Rules:**
- ✅ Auto-save mỗi câu (UPSERT)
- ✅ Resume nếu user out app
- ✅ Block edit sau khi complete
- ✅ Validate required questions trước khi complete

#### 3. Backend APIs - Admin (CMS)
- [ ] **Campaign Management:**
  - `GET /admin/api/surveys` - List campaigns
  - `POST /admin/api/surveys` - Create campaign
  - `GET /admin/api/surveys/:id` - Get campaign details
  - `PUT /admin/api/surveys/:id` - Update campaign
  - `DELETE /admin/api/surveys/:id` - Soft delete
  - `POST /admin/api/surveys/:id/publish` - Publish
  - `POST /admin/api/surveys/:id/unpublish` - Unpublish

- [ ] **Question Management:**
  - `POST /admin/api/surveys/:id/questions` - Add question
  - `PUT /admin/api/v1/questions/:questionId` - Update question
  - `DELETE /admin/api/v1/questions/:questionId` - Delete question
  - `POST /admin/api/v1/questions/reorder` - Change display_order

- [ ] **Analytics & Reports:**
  - `GET /admin/api/surveys/:id/stats` - Campaign statistics
  - `GET /admin/api/surveys/:id/responses` - List responses (with filters)
  - `GET /admin/api/surveys/:id/responses/:responseId` - Response detail
  - `GET /admin/api/surveys/:id/export` - Export CSV/Excel

- ~~**Reward Management**~~ ❌ **REMOVED from Phase 1** (deferred to Phase 2)

#### 4. Admin CMS UI
- [ ] **Campaign Management Page:**
  - List campaigns (table view with filters)
  - Create campaign form
  - Edit campaign form
  - Publish/Unpublish toggle
  - Delete button

- [ ] **Question Builder:**
  - Add question form (8 question types support)
  - Drag-and-drop reorder questions
  - Edit question inline
  - Delete question
  - Preview question rendering

- [ ] **Question Type Components:**
  - [x] NPS (0-10 scale)
  - [x] Rating Scale (1-10)
  - [x] Feature Matrix (grid ratings)
  - [x] Single Choice (radio)
  - [x] Multiple Choice (checkbox)
  - [x] Ranking (drag-drop top 3)
  - [x] Text Short (single line)
  - [x] Text Long (textarea)

- [ ] **Response Viewer:**
  - List all responses (table with filters)
  - View response detail (read-only)
  - Filter by: status, quality_score, has_optional_text, is_suspicious
  - Pagination

- [ ] **Analytics Dashboard:**
  - Campaign overview stats (completion rate, avg time, etc.)
  - Per-question analytics (answer distribution, text responses)
  - Charts: completion over time, text response rate
  - Export CSV button

- ~~**Reward Management UI**~~ ❌ **REMOVED from Phase 1**

#### 5. Mini-app (User-facing Mobile)
- [ ] **Survey List Screen:**
  - Show active surveys
  - Show reward range (30-100 điểm)
  - Show estimated time
  - Show user status (chưa làm / đang làm / đã xong)

- [ ] **Survey Intro Screen:**
  - Campaign title + description
  - Estimated time
  - Reward info
  - Total questions
  - "Bắt đầu" button

- [ ] **Survey Question Screen:**
  - Progress bar (X/8 câu)
  - Question renderer (8 types)
  - Optional text input (nếu enabled)
  - "Tiếp theo" / "Quay lại" buttons
  - Auto-save sau mỗi câu ✅
  - Resume logic ✅

- [ ] **Question Renderers (8 types):**
  - [x] NPS component
  - [x] Rating scale component
  - [x] Feature matrix component
  - [x] Single choice component
  - [x] Multiple choice component
  - [x] Ranking component (drag-drop)
  - [x] Text short component
  - [x] Text long component

- [ ] **Survey Review Screen:**
  - Show all answers (read-only)
  - "Chỉnh sửa" button (navigate back to specific question)
  - Warning: "Sau khi gửi không thể sửa"
  - "Hoàn thành" button

- [ ] **Survey Success Screen:**
  - Thank you message: "Cảm ơn bạn đã tham gia khảo sát!"
  - Summary: time spent, questions answered
  - ❌ NO reward info (Phase 1)
  - "Đóng" button

- [ ] **Resume Logic:**
  - Detect existing in_progress response
  - Show dialog: "Tiếp tục làm dở?" or "Làm từ đầu?"
  - Pre-fill saved answers
  - Jump to first unanswered question

#### 6. ~~Integration~~ ❌ **REMOVED from Phase 1**
- ~~Loyalty Points Integration~~ (deferred to Phase 2 entirely)

#### 7. Testing & Launch
- [ ] Unit tests cho critical APIs
- [ ] Integration tests cho UPSERT logic
- [ ] Manual testing với sample survey (8 questions)
- [ ] Internal beta: 20-50 users
- [ ] Soft launch: 1,000 users
- [ ] Monitor errors, performance

---

### ❌ OUT OF SCOPE (Phase 2)

#### 1. Auto Quality Scoring
- ❌ Automatic quality_score calculation
- ❌ Spam detection automation
- ❌ Auto award points based on quality
→ **Phase 1:** Manual review by PM

#### 2. Advanced Analytics
- ❌ Real-time dashboard updates
- ❌ Advanced charts (heatmaps, correlations)
- ❌ NPS score breakdown (promoters/passives/detractors)
- ❌ Text analysis (sentiment, keywords)
→ **Phase 1:** Basic stats + CSV export

#### 3. Multiple Attempts
- ❌ Allow user làm lại survey (retry)
- ❌ A/B testing (different question orders)
→ **Phase 1:** 1 user = 1 response only

#### 4. Edit After Complete
- ❌ Allow edit với time window (30 min)
- ❌ Track edit history after complete
→ **Phase 1:** No edit after complete

#### 5. Advanced Features
- ❌ Conditional questions (skip logic)
- ❌ Question branching (if answer A → show Q5, else Q6)
- ❌ Multi-language support
- ❌ Image/video in questions
- ❌ Survey templates
→ **Phase 1:** Simple linear survey

#### 6. Notifications
- ❌ Push notification khi có survey mới
- ❌ Reminder nếu user chưa làm
- ❌ Notification khi nhận điểm
→ **Phase 1:** Manual announcement

---

## 🗓️ Timeline Breakdown (2-2.5 weeks) - Faster without rewards!

### Week 1: Backend + Database
**Focus:** Foundation - Schema, APIs, Basic CMS

| Day | Backend | Frontend (CMS) |
|-----|---------|----------------|
| **Day 1-2** | • Setup database schema<br>• Run migrations<br>• Create entities/repositories | • Setup CMS routes<br>• Campaign list page (basic) |
| **Day 3** | • User APIs: GET active, GET detail<br>• POST start | • Create campaign form |
| **Day 4** | • User APIs: POST answers (UPSERT)<br>• POST complete | • Edit campaign form |
| **Day 5** | • Admin APIs: Campaign CRUD | • Question builder (basic, 2-3 types) |

**Deliverables:**
- ✅ Database schema deployed
- ✅ Core user APIs working
- ✅ Basic CMS cho campaign management

---

### Week 2: CMS Complete + Mini-app Start
**Focus:** Complete CMS, Start mini-app

| Day | Backend | CMS | Mini-app |
|-----|---------|-----|----------|
| **Day 1-2** | • Admin APIs: Question CRUD<br>• Admin APIs: Stats, Responses | • Question builder (all 8 types)<br>• Reorder questions | • Setup mini-app structure |
| **Day 3** | • Admin APIs: Export CSV | • Response viewer<br>• Analytics dashboard (basic) | • Survey list screen<br>• Intro screen |
| **Day 4** | • Admin APIs: Rewards manual | • Reward management UI | • Question screen (2-3 types) |
| **Day 5** | • Bug fixes, optimization | • Polish CMS UI | • Question renderers (all 8 types) |

**Deliverables:**
- ✅ Full CMS working (create campaign + questions)
- ✅ Mini-app structure ready
- ✅ Basic question renderers

---

### Week 3: Mini-app Complete + Testing + Launch
**Focus:** Complete mini-app, Testing, Soft launch

| Day | Backend | Mini-app | Testing/Launch |
|-----|---------|----------|----------------|
| **Day 1** | • Integration tests | • Auto-save logic<br>• Resume logic | • Internal testing (team) |
| **Day 2** | • Bug fixes | • Review screen<br>• Success screen | • Create sample survey (8 questions) |
| **Day 3** | • Performance optimization | • Polish UI/UX<br>• Loading states | • Beta testing (20 users) |
| **Day 4** | • Manual reward script | • Error handling<br>• Offline support (basic) | • Review beta feedback<br>• Fix critical bugs |
| **Day 5** | • Deploy to production | • Deploy mini-app | • Soft launch (1,000 users)<br>• Monitor |

**Deliverables:**
- ✅ Full mini-app working
- ✅ Tested with real users
- ✅ Deployed to production
- ✅ First survey live!

---

## 📦 Deliverables Summary

### 1. Database
- ✅ Schema deployed: **4 tables** (NO rewards)
- ✅ Migrations scripts
- ✅ Sample data seeder

### 2. Backend
- ✅ 6 User APIs
- ✅ ~13 Admin APIs (no rewards)
- ✅ Unit tests coverage >70%
- ✅ API documentation (Swagger)

### 3. CMS (Admin Panel)
- ✅ Campaign management (CRUD)
- ✅ Question builder (8 question types)
- ✅ Response viewer
- ✅ Analytics dashboard
- ✅ Export CSV functionality
- ❌ ~~Manual reward management~~ (Phase 2)

### 4. Mini-app (Mobile)
- ✅ Survey list
- ✅ Survey flow (intro → questions → review → success)
- ✅ 8 question type renderers
- ✅ Auto-save functionality
- ✅ Resume logic
- ✅ Offline support (basic)

### 5. Documentation
- ✅ API documentation
- ✅ Admin user guide
- ✅ Mobile app flow diagram
- ✅ Database schema documentation

---

## 👥 Team Allocation (Recommended)

### Backend (1-2 devs):
- Database schema & migrations
- API development (user + admin)
- Business logic (UPSERT, validation, progress calculation)
- Integration tests

### Frontend CMS (1 dev):
- Campaign management UI
- Question builder (8 types)
- Response viewer
- Analytics dashboard
- Export functionality

### Mobile (1-2 devs):
- Survey list & intro screens
- Question renderers (8 types)
- Auto-save & resume logic
- UI/UX polish
- Offline handling

### QA/PM (1):
- Create sample survey
- Testing flows
- Beta user recruitment
- Data analysis
- Manual reward review

**Total:** 4-6 người x 2-2.5 tuần = **10-15 man-weeks** (nhanh hơn vì không có rewards)

---

## 🎯 Success Metrics (After Launch)

### Participation (Target):
- ✅ 8-10% response rate (3,200-4,000 responses từ 40K DAU)
- ✅ >85% completion rate
- ✅ <5M VNĐ total cost

### Quality:
- ✅ 60%+ responses có optional text
- ✅ Avg completion time: 4-7 phút
- ✅ <5% suspicious responses

### Technical:
- ✅ <1% API error rate
- ✅ <200ms P95 response time
- ✅ Zero data loss (auto-save working)

### Insights:
- ✅ Clear feature gaps identified
- ✅ 50+ actionable feature ideas
- ✅ NPS score calculated
- ✅ Onboarding friction points documented

---

## 🚦 Go/No-Go Checklist (Before Launch)

### Pre-launch Checklist:
- [ ] Database schema deployed & tested
- [ ] All APIs working (manual testing)
- [ ] CMS: Can create campaign + 8 questions successfully
- [ ] Mini-app: Can complete full survey flow
- [ ] Auto-save tested (kill app mid-survey → resume works)
- [ ] Resume logic tested (pre-fill saved answers)
- [ ] Export CSV works
- [ ] Sample survey created (8 questions, all types)
- [ ] Internal testing: 20+ responses collected
- [ ] Beta testing: Feedback reviewed, critical bugs fixed
- [ ] Manual reward script ready
- [ ] Monitoring & alerts setup
- [ ] Rollback plan ready

### Launch Day:
- [ ] Deploy backend to production
- [ ] Deploy mini-app to app stores / server
- [ ] Create first real campaign
- [ ] Test end-to-end in production
- [ ] Monitor error rate, response time
- [ ] Announce to users (in-app banner / notification)
- [ ] Monitor first 100 responses

---

## 📊 Post-Launch (Week 4)

### Days 1-3: Monitor
- Check error logs
- Monitor completion rate
- Check data quality
- Fix urgent bugs

### Days 4-5: First Analysis
- Export data
- Review responses
- Calculate basic stats
- Identify top contributors (manual)

### Week 4 End: Reward Distribution
- PM review top 10 responses
- Manually award points (base + top contributors)
- Notify users
- Collect feedback on reward system

---

## 🔄 Phase 2 Planning (After Phase 1 Launch)

Based on Phase 1 learnings, plan Phase 2:
- ✅ Auto quality scoring
- ✅ Spam detection automation
- ✅ Advanced analytics
- ✅ Conditional questions
- ✅ Push notifications
- ✅ A/B testing

**Phase 2 Timeline:** 2-3 tuần additional

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `schema-final-phase1.sql` | Final database schema |
| `api-design.md` | API endpoints specification |
| `auto-save-implementation.md` | Auto-save logic detail |
| `schema-simplified.md` | Schema rationale (1 attempt only) |
| `schema-comparison.md` | Original vs improved comparison |
| `phase1-roadmap.md` | **This file - Phase 1 plan** |

---

**Ready to start? 🚀**

Next step: Review roadmap với team → Assign tasks → Kick-off Week 1!

## 📄 PRD - Mini-app Survey Nô Tì

---

## 1. 🎯 Mục tiêu

### **Primary Goals:**
- Thu thập phản hồi/đánh giá của user về các tính năng, trải nghiệm hiện tại
- Lấy ý tưởng cải tiến sản phẩm từ user base ~600K người
- Hiểu mức độ hài lòng của user với các tính năng chính
- Nhận feedback về trải nghiệm sử dụng App - nhất là độ dễ sử dụng trong những lần đầu
- Lấy ý tưởng về các tính năng mới

### **Success Metrics:**
- **Target response rate:** 8-10% (~3,200-4,000 responses từ 40K DAU)
- **Target quality responses:** 60%+ có optional text
- **Completion rate:** >85% (users who start → finish)
- **Avg completion time:** 4-7 phút

---

## 2. 💰 Cơ cấu Phần thưởng

### **Tier 1: Base Reward (All qualified users)**
- **30-100 điểm** cho mỗi user hoàn thành hợp lệ
- Điểm được tính **động dựa trên chất lượng** response
- Điều kiện:
    - Hoàn thành đủ required questions
    - Không spam pattern

### **Tier 2: Top Contributors (Top 5-10 users)**
- **Rank 1:** 500 điểm + Voucher 100K
- **Rank 2-3:** 400 điểm + Voucher 80K
- **Rank 4-5:** 300 điểm + Voucher 50K
- **Rank 6-10:** 200 điểm + Voucher 30K

**Cách xếp hạng:**
- Manual review bởi PM/team
- Tiêu chí: độ insight, actionability, độ chi tiết của text answers

### **Budget Estimation:**

| Response Rate | Participants | Base Rewards | Top Rewards | Total Cost |
|--------------|-------------|--------------|-------------|-----------|
| 5% | 2,000 | ~2.4M VNĐ | ~640K VNĐ | ~3.1M VNĐ |
| 8% (target) | 3,200 | ~3.8M VNĐ | ~640K VNĐ | ~4.6M VNĐ |
| 12% | 4,800 | ~5.8M VNĐ | ~640K VNĐ | ~6.5M VNĐ |

**Safe Budget Allocation:** **5M VNĐ**

---

## 3. 🗄️ Database Schema

### **3.1. survey_campaigns**
```sql
CREATE TABLE survey_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Tên campaign: "Khảo sát trải nghiệm Q2 2026"',
    description TEXT COMMENT 'Mô tả campaign cho user',
    
    -- Time constraints
    start_time DATETIME NOT NULL COMMENT 'Thời điểm mở survey',
    end_time DATETIME NOT NULL COMMENT 'Thời điểm đóng survey',
    
    -- User limits
    max_attempts_per_user INT DEFAULT 1 COMMENT 'Mỗi user được làm tối đa bao nhiêu lần',
    
    -- Reward config (dynamic calculation based on quality)
    min_reward_points INT DEFAULT 30 COMMENT 'Điểm tối thiểu (low quality)',
    max_reward_points INT DEFAULT 100 COMMENT 'Điểm tối đa (high quality)',
    
    -- Validation rules
    estimated_completion_time_seconds INT DEFAULT 300 COMMENT 'Thời gian ước tính để hoàn thành (5 phút)',
    
    -- Publish status
    published BOOLEAN DEFAULT FALSE COMMENT 'TRUE = visible to users, FALSE = draft',
    
    -- Metadata
    created_by INT COMMENT 'Admin user ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_published_time (published, start_time, end_time),
    INDEX idx_active_campaigns (published, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### **3.2. survey_questions**
```sql
CREATE TABLE survey_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    
    -- Question content
    question_text TEXT NOT NULL COMMENT 'Nội dung câu hỏi',
    question_type ENUM(
        'nps',                  -- Net Promoter Score (0-10)
        'rating_scale',         -- 1-10 rating
        'feature_matrix',       -- Grid of ratings cho nhiều features
        'single_choice',        -- Radio buttons
        'multiple_choice',      -- Checkboxes
        'ranking',              -- Drag & drop ranking
        'text_short',           -- Single line input
        'text_long'             -- Paragraph textarea
    ) NOT NULL,
    
    -- Configuration per type (JSON structure varies by question_type)
    config JSON NOT NULL COMMENT 'Type-specific config',
    
    -- Optional text input
    enable_optional_text BOOLEAN DEFAULT FALSE,
    optional_text_placeholder VARCHAR(255) DEFAULT 'Chia sẻ thêm (nếu có)...',
    
    -- Display & validation
    display_order INT NOT NULL COMMENT 'Thứ tự hiển thị câu hỏi (1, 2, 3...)',
    is_required BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,
    INDEX idx_campaign_order (campaign_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### **3.3. survey_responses**
```sql
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'FK to piggi.users.id',
    
    -- Timing
    started_at DATETIME NOT NULL COMMENT 'Thời điểm user mở survey lần đầu',
    completed_at DATETIME COMMENT 'Thời điểm user submit (NULL = chưa complete)',
    
    -- Status
    status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, created_at),
    INDEX idx_user_campaign (user_id, campaign_id),
    INDEX idx_campaign_status (campaign_id, status),
    INDEX idx_completed (campaign_id, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### **3.4. survey_answers**
```sql
CREATE TABLE survey_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    
    -- Answer value (structure varies by question_type)
    answer_value JSON NOT NULL,
    
    -- Optional text (available on all question types if enabled)
    optional_text TEXT COMMENT 'User explanation/reasoning',
    
    -- Timing per question
    completed_at DATETIME NOT NULL COMMENT 'Thời điểm user trả lời xong câu này',
    
    -- Edit tracking
    update_history JSON COMMENT 'Lịch sử sửa đổi: [{timestamp, old_answer_value, old_optional_text}]',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_question (response_id, question_id),
    INDEX idx_question_answers (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. 📋 Các Định dạng Survey

### **4.1. NPS (Net Promoter Score)**
**Format:** Rating 0-10 + Optional Text

```json
{
  "question_type": "nps",
  "config": {
    "min": 0,
    "max": 10,
    "labels": {
      "0": "Không có khả năng",
      "10": "Chắc chắn giới thiệu"
    }
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Lý do chính cho điểm này?"
}
```

**Answer format:**
```json
{
  "answer_value": {"score": 9},
  "optional_text": "App nhanh, dễ dùng, deal tốt"
}
```

**Use case:** Overall satisfaction baseline

---

### **4.2. Feature Matrix**
**Format:** Grid rating với option "Chưa dùng"

```json
{
  "question_type": "feature_matrix",
  "config": {
    "features": [
      "Trang chủ (Feed)",
      "Thông báo",
      "Dạo deal",
      "Tích điểm đổi quà",
      "Chat/Community",
      "Khám phá (Mini-apps)",
      "Flash sale"
    ],
    "scale": [
      {"value": 0, "label": "Chưa dùng"},
      {"value": 1, "label": "Rất tệ"},
      {"value": 2, "label": "Tệ"},
      {"value": 3, "label": "Bình thường"},
      {"value": 4, "label": "Tốt"},
      {"value": 5, "label": "Rất tốt"}
    ]
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Tính năng nào bạn muốn cải thiện gấp nhất? Vì sao?"
}
```

**Answer format:**
```json
{
  "answer_value": {
    "Trang chủ (Feed)": 4,
    "Thông báo": 5,
    "Dạo deal": 0,
    "Tích điểm đổi quà": 3,
    "Chat/Community": 2,
    "Khám phá (Mini-apps)": 0,
    "Flash sale": 5
  },
  "optional_text": "Muốn cải thiện thông báo cho chính xác hơn"
}
```

**Use case:** So sánh satisfaction giữa các tính năng, phát hiện feature adoption rate

---

### **4.3. Rating Scale (1-10)**
**Format:** Numeric scale

```json
{
  "question_type": "rating_scale",
  "config": {
    "min": 1,
    "max": 10,
    "labels": {
      "1": "Rất khó hiểu",
      "10": "Cực kỳ dễ dùng"
    }
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Điều gì khó hiểu nhất lúc đầu? Hoặc điều gì giúp bạn dùng dễ dàng?"
}
```

**Answer format:**
```json
{
  "answer_value": {"score": 7},
  "optional_text": "Lúc đầu không biết tích điểm ở đâu, sau thấy icon thì OK"
}
```

**Use case:** Onboarding experience, ease of use

---

### **4.4. Single Choice (Radio)**
**Format:** Radio buttons

```json
{
  "question_type": "single_choice",
  "config": {
    "options": [
      "Không bao giờ",
      "Thi thoảng (1-2 lần/tháng)",
      "Thường xuyên (>3 lần/tháng)",
      "Không chắc/Không nhớ"
    ],
    "allow_other": false
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Nếu có, lý do gì khiến bạn quên? (VD: quên mở app, link hết hạn,...)"
}
```

**Answer format:**
```json
{
  "answer_value": {
    "selected": "Thi thoảng (1-2 lần/tháng)"
  },
  "optional_text": "Đôi khi mua hàng nhanh quên không click vào Nô Tì trước"
}
```

**Use case:** Behavior frequency, binary choices

---

### **4.5. Multiple Choice (Checkbox)**
**Format:** Multi-select với option "Other"

```json
{
  "question_type": "multiple_choice",
  "config": {
    "options": [
      "Không dùng app khác (chỉ dùng Nô Tì)",
      "BeeCost",
      "MuaThongMinh.vn",
      "Group Facebook săn sale",
      "Kênh Telegram deal",
      "TikTok (xem video deal)",
      "Website chính sàn (Shopee/Lazada/TikTok)"
    ],
    "allow_other": true,
    "allow_multiple": true
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Tại sao bạn vẫn dùng các kênh đó song song với Nô Tì?"
}
```

**Answer format:**
```json
{
  "answer_value": {
    "selected": ["BeeCost", "Group Facebook săn sale"],
    "other": "Zalo deal group"
  },
  "optional_text": "BeeCost có lịch sử giá, Facebook có deal độc quyền"
}
```

**Use case:** Competitor analysis, multiple interests

---

### **4.6. Ranking (Drag & Drop)**
**Format:** Top 3 ranking

```json
{
  "question_type": "ranking",
  "config": {
    "items": [
      "Tốc độ app nhanh hơn",
      "Deal chất lượng cao hơn",
      "Thông báo chính xác hơn (đúng deal, đúng lúc)",
      "Nhiều voucher/quà đổi điểm hơn",
      "Giao diện đẹp, dễ dùng hơn",
      "Tìm kiếm deal tốt hơn",
      "Tích điểm dễ dàng, không bị sót",
      "Cộng đồng/chat sôi động hơn"
    ],
    "max_selections": 3
  },
  "enable_optional_text": true,
  "optional_text_placeholder": "Điều gì khác bạn mong muốn nhất?"
}
```

**Answer format:**
```json
{
  "answer_value": {
    "ranked": [
      "Thông báo chính xác hơn (đúng deal, đúng lúc)",
      "Tích điểm dễ dàng, không bị sót",
      "Deal chất lượng cao hơn"
    ]
  },
  "optional_text": "Muốn có AI gợi ý deal phù hợp sở thích"
}
```

**Use case:** Priority forcing, trade-off decisions

---

### **4.7. Text Short (Single Line)**
**Format:** Short text input

```json
{
  "question_type": "text_short",
  "config": {
    "placeholder": "VD: Tiện lợi, nhanh chóng, dễ dùng...",
    "min_length": 0,
    "max_length": 200
  },
  "enable_optional_text": false
}
```

**Answer format:**
```json
{
  "answer_value": {
    "text": "Tiện lợi, giúp tiết kiệm tiền"
  }
}
```

**Use case:** One-word association, quick feedback

---

### **4.8. Text Long (Paragraph)**
**Format:** Multi-line textarea

```json
{
  "question_type": "text_long",
  "config": {
    "placeholder": "Mô tả chi tiết nhất có thể: tính năng làm gì, giải quyết vấn đề gì của bạn, bạn sẽ dùng nó khi nào/thế nào?\n\nGợi ý: Nghĩ về lần cuối bạn thấy khó chịu khi săn sale - tính năng nào có thể giúp bạn lúc đó?",
    "min_length": 0,
    "max_length": 2000
  },
  "enable_optional_text": false
}
```

**Answer format:**
```json
{
  "answer_value": {
    "text": "Tôi muốn Nô Tì có tính năng so sánh giá tự động giữa các sàn. VD: tôi thấy 1 sản phẩm trên Shopee, app tự động tìm kiếm trên Lazada, TikTok và hiện giá tốt nhất. Vì đôi khi cùng 1 sản phẩm nhưng giá khác nhau giữa các sàn."
  }
}
```

**Use case:** Feature ideas, open-ended feedback, storytelling

---

## 5. 📊 Sample Survey Structure (8 Questions)

### **Câu 1: NPS (Net Promoter Score)**
- **Type:** `nps`
- **Question:** "Khả năng bạn giới thiệu Nô Tì cho bạn bè/người thân?"
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 2: Feature Satisfaction Matrix**
- **Type:** `feature_matrix`
- **Question:** "Đánh giá mức độ hài lòng về các tính năng:"
- **Features:** Trang chủ, Thông báo, Dạo deal, Tích điểm đổi quà, Chat/Community, Khám phá, Flash sale
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 3: Onboarding Experience**
- **Type:** `rating_scale`
- **Question:** "Đánh giá độ dễ sử dụng khi bạn BẮT ĐẦU dùng Nô Tì?"
- **Scale:** 1-10
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 4: Point Tracking Behavior**
- **Type:** `single_choice`
- **Question:** "Bạn có bao giờ mua hàng nhưng quên không tích điểm Nô Tì không?"
- **Options:** Không bao giờ, Thi thoảng, Thường xuyên, Không chắc
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 5: Competitor Usage**
- **Type:** `multiple_choice`
- **Question:** "Ngoài Nô Tì, bạn còn dùng app/kênh săn sale nào? (Chọn tất cả)"
- **Options:** Không dùng app khác, BeeCost, MuaThongMinh.vn, Group Facebook, Telegram, TikTok, Website chính sàn
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 6: Feature Priority Ranking**
- **Type:** `ranking`
- **Question:** "Nếu chỉ cải thiện được 3 điều, bạn muốn Nô Tì ưu tiên gì? (Kéo để sắp xếp theo thứ tự quan trọng, chỉ chọn TOP 3)"
- **Items:** 8 improvement areas
- **Optional text:** Enabled
- **Required:** Yes

### **Câu 7: New Feature Ideas**
- **Type:** `text_long`
- **Question:** "Nếu có phép màu, bạn muốn Nô Tì có thêm tính năng gì?"
- **Required:** No

### **Câu 8: General Feedback**
- **Type:** `text_long`
- **Question:** "Những góp ý/nhận xét khác về Nô Tì?"
- **Required:** No

---

## 6. 🚀 Implementation Flow

### **Phase 1: Database Setup (Week 1)**
1. Create migration scripts
2. Seed sample campaign với 8 câu hỏi
3. Build admin panel để manage campaigns

### **Phase 2: API Development (Week 1-2)**
**Endpoints:**
```
GET    /api/surveys/active                    # Get active campaigns for user
GET    /api/surveys/:campaignId                # Get campaign details + questions
GET    /api/surveys/:campaignId/attempts       # Check user's attempt count
POST   /api/surveys/:campaignId/start          # Start new response
POST   /api/surveys/:campaignId/answers        # Submit answer for a question
POST   /api/surveys/:campaignId/complete       # Complete survey
GET    /api/surveys/:campaignId/stats          # Analytics (admin)
```

### **Phase 3: Mobile UI (Week 2-3)**
**Screens:**
- Survey Intro (rewards explanation)
- Question Renderer (dynamic by type)
- Progress Bar
- Survey Complete (thank you + reward claim)

### **Phase 4: Testing & Launch (Week 3-4)**
- Internal testing: 20-50 responses
- Soft launch: 1,000 users
- Full launch: Push notification + in-app banner

---

## 7. 📈 Analytics Queries

### **Campaign stats:**
```sql
-- Total responses, avg time, completion rate
SELECT 
    COUNT(*) as total_started,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_completion_time_sec,
    PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as p80_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as p99_time
FROM survey_responses
WHERE campaign_id = ?;
```

### **Per-question timing:**
```sql
-- Avg time per question (calculated from completed_at differences)
WITH question_times AS (
    SELECT 
        question_id,
        response_id,
        completed_at,
        LAG(completed_at) OVER (PARTITION BY response_id ORDER BY question_id) as prev_completed_at
    FROM survey_answers
    WHERE response_id IN (SELECT id FROM survey_responses WHERE campaign_id = ?)
)
SELECT 
    question_id,
    AVG(TIMESTAMPDIFF(MILLISECOND, prev_completed_at, completed_at)) as avg_time_ms,
    PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY TIMESTAMPDIFF(MILLISECOND, prev_completed_at, completed_at)) as p80_time_ms
FROM question_times
WHERE prev_completed_at IS NOT NULL
GROUP BY question_id;
```

### **Feature matrix aggregation:**
```sql
-- Average ratings per feature
SELECT 
    'Trang chủ (Feed)' as feature,
    AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(answer_value, '$."Trang chủ (Feed)"')) AS DECIMAL)) as avg_rating,
    COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(answer_value, '$."Trang chủ (Feed)"')) = '0' THEN 1 END) as not_used_count
FROM survey_answers
WHERE question_id = ? -- Feature matrix question
GROUP BY feature;
```

---

## 8. ⚠️ Important Notes

### **Point System:**
- 1 điểm = 24 VNĐ (internal conversion rate)
- **CRITICAL:** Không bao giờ nhắc tỷ lệ quy đổi này trong user-facing content
- User chỉ nên quan tâm đến "điểm", không quan tâm giá trị thành tiền

### **Reward Distribution:**
- Base rewards: Tính động dựa trên quality (min_reward_points → max_reward_points)
- Top contributor rewards: Manual review sau khi campaign end
- Actual point distribution: Lưu vào `loyalty_histories` table (outside scope của schema này)

### **Data Retention:**
- Responses older than 6 months: Consider archiving
- Support soft delete cho GDPR compliance

---

## 9. ✅ Success Criteria

### **Participation:**
- ✅ 8-10% response rate (3,200-4,000 responses)
- ✅ >85% completion rate
- ✅ <5M VNĐ total cost

### **Quality:**
- ✅ 60%+ responses có optional text
- ✅ Avg completion time: 4-7 phút
- ✅ P80 completion time < 10 phút

### **Insights:**
- ✅ Clear feature gaps identified
- ✅ 50+ actionable feature ideas
- ✅ NPS score calculated
- ✅ Onboarding friction points documented

---

**End of PRD** 🚀


## Phases
### Phase 1: MVP
- Không cần logic tính điểm cho user
- Finalize database schema
- Viết các API cần thiết cho CMS/User
- Mini-app survey

### Phase 2: Final
- Logic ghi nhận điểm cho user theo tốc độ hoàn thành
- Dựa trên min-max points để tính ra số điểm
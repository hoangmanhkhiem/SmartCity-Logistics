# 📊 Schema Comparison: Original vs Improved

## 🎯 Tóm tắt thay đổi chính

### ✅ Sửa lỗi critical (MUST FIX for Phase 1):
1. **survey_responses.unique_user_campaign_attempt** - Fix unique constraint logic
2. **Thêm table `survey_rewards`** - Track reward distribution
3. **Fix analytics queries** - MySQL không có PERCENTILE_CONT function

### 🔧 Cải thiện bổ sung:
4. Quality scoring fields
5. Spam detection fields
6. Soft delete support (GDPR)
7. Performance optimization (denormalized metrics)
8. Better constraints & validation

---

## 📋 Chi tiết từng thay đổi

### 1. ❌ BUG FIX: `survey_responses` Unique Constraint

#### Original (SAI):
```sql
UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, created_at)
```

**Vấn đề:**
- `created_at` có thể trùng (cùng millisecond)
- Không enforce được `max_attempts_per_user`
- Logic sai: "lần thử" không phải là timestamp

#### Improved (ĐÚNG):
```sql
attempt_number INT DEFAULT 1,
UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, attempt_number)
```

**Lợi ích:**
- ✅ Đúng logic: user_1 có thể làm attempt_1, attempt_2, attempt_3
- ✅ Dễ query: "Lấy attempt cuối của user"
- ✅ Dễ validate: Check `attempt_number <= max_attempts_per_user`

**Cách migrate data cũ:**
```sql
-- Step 1: Add column
ALTER TABLE survey_responses ADD COLUMN attempt_number INT DEFAULT 1 AFTER user_id;

-- Step 2: Populate attempt_number cho data cũ
UPDATE survey_responses sr
SET attempt_number = (
    SELECT COUNT(*) + 1
    FROM survey_responses sr2
    WHERE sr2.campaign_id = sr.campaign_id
      AND sr2.user_id = sr.user_id
      AND sr2.created_at < sr.created_at
);

-- Step 3: Drop old constraint, add new
ALTER TABLE survey_responses
  DROP INDEX unique_user_campaign_attempt,
  ADD UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, attempt_number);
```

---

### 2. ⭐ NEW TABLE: `survey_rewards`

#### Tại sao cần table này?

**PRD requirements:**
- ✅ "Điểm được tính **động dựa trên chất lượng**" → Cần lưu quality_score
- ✅ "Top 5-10 users" → Cần track rank + voucher
- ✅ "Không spam pattern" → Cần spam detection
- ✅ Budget tracking → Cần track points_awarded

**Original schema thiếu:**
- ❌ Không có nơi lưu quality_score
- ❌ Không có nơi lưu points_awarded
- ❌ Không track được reward status (pending/awarded/rejected)
- ❌ Không track được top contributor rewards

#### Improved: Thêm `survey_rewards` table

**Core fields:**
```sql
CREATE TABLE survey_rewards (
    response_id INT (FK to survey_responses),
    reward_type ENUM('base_reward', 'top_contributor'),
    points_awarded INT,  -- Số điểm thực tế phát
    quality_score DECIMAL(5,2),  -- 0-100
    status ENUM('pending', 'calculated', 'awarded', 'rejected'),
    
    -- Top contributors
    rank_position INT,  -- 1, 2, 3... NULL nếu không phải top
    voucher_id INT,
    voucher_value INT,
    
    -- Spam detection
    is_spam BOOLEAN,
    spam_reasons JSON,
    
    -- Audit
    reviewed_by INT,
    review_notes TEXT
)
```

**Use cases:**

**Base reward flow:**
```
1. User complete survey → survey_responses.status = 'completed'
2. System calculate quality → INSERT survey_rewards (status='calculated', quality_score=75, points_awarded=80)
3. System phát điểm → UPDATE survey_rewards SET status='awarded', awarded_at=NOW(), loyalty_history_id=XXX
```

**Top contributor flow:**
```
1. PM review top responses → UPDATE survey_rewards SET reviewed_by=X, review_notes='Great insights'
2. PM select top 10 → UPDATE survey_rewards SET rank_position=1, voucher_value=100000, reward_type='top_contributor'
3. System phát thêm điểm + voucher
```

**Spam detection flow:**
```
1. System detect spam pattern → UPDATE survey_rewards SET is_spam=TRUE, spam_reasons='["too_fast", "gibberish"]', status='rejected'
2. No points awarded
```

---

### 3. 📊 Analytics Queries - MySQL Compatibility

#### Original (SAI - Không chạy được trên MySQL):
```sql
-- ❌ MySQL KHÔNG có PERCENTILE_CONT
SELECT 
    PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY completion_time) as p80_time
FROM survey_responses;
```

#### Improved (MySQL compatible):

**Option 1: Subquery với PERCENT_RANK (MySQL 8.0+)**
```sql
-- ✅ P80 completion time
SELECT completion_time as p80_time
FROM (
    SELECT 
        TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
        PERCENT_RANK() OVER (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as percentile
    FROM survey_responses
    WHERE campaign_id = ? AND status = 'completed'
) ranked
WHERE percentile >= 0.80
ORDER BY percentile
LIMIT 1;
```

**Option 2: ROW_NUMBER approach (Faster)**
```sql
-- ✅ P80, P95, P99 trong 1 query
SELECT 
    MAX(CASE WHEN row_num = p80_row THEN completion_time END) as p80_time,
    MAX(CASE WHEN row_num = p95_row THEN completion_time END) as p95_time,
    MAX(CASE WHEN row_num = p99_row THEN completion_time END) as p99_time
FROM (
    SELECT 
        TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
        ROW_NUMBER() OVER (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as row_num,
        CEIL(COUNT(*) OVER () * 0.80) as p80_row,
        CEIL(COUNT(*) OVER () * 0.95) as p95_row,
        CEIL(COUNT(*) OVER () * 0.99) as p99_row
    FROM survey_responses
    WHERE campaign_id = ? AND status = 'completed'
) ranked;
```

**Option 3: User-defined function (Reusable)**
```sql
-- Tạo function PERCENTILE (chỉ cần tạo 1 lần)
DELIMITER $$
CREATE FUNCTION PERCENTILE(
    p_campaign_id INT,
    p_percentile DECIMAL(3,2)
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE result INT;
    
    SELECT completion_time INTO result
    FROM (
        SELECT 
            TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
            PERCENT_RANK() OVER (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as pct
        FROM survey_responses
        WHERE campaign_id = p_campaign_id AND status = 'completed'
    ) t
    WHERE pct >= p_percentile
    ORDER BY pct
    LIMIT 1;
    
    RETURN result;
END$$
DELIMITER ;

-- Dùng function:
SELECT 
    PERCENTILE(1, 0.50) as p50_time,
    PERCENTILE(1, 0.80) as p80_time,
    PERCENTILE(1, 0.99) as p99_time;
```

---

### 4. 🎯 Quality Scoring Fields

#### Thêm vào `survey_responses`:
```sql
quality_score DECIMAL(5,2),  -- Overall 0-100
has_optional_text BOOLEAN,   -- Có ít nhất 1 optional text
total_text_length INT,       -- Tổng độ dài text
```

**Công thức tính quality_score (Phase 2):**
```javascript
// Pseudo code
function calculateQualityScore(response) {
    let score = 0;
    
    // 1. Completion time (30 points)
    // Ideal: 4-7 minutes (240-420 seconds)
    const timeScore = calculateTimeScore(response.completion_time);
    score += timeScore * 0.3;
    
    // 2. Optional text presence (30 points)
    const textScore = response.has_optional_text ? 100 : 0;
    score += textScore * 0.3;
    
    // 3. Text quality (20 points)
    // Length, diversity, not gibberish
    const textQualityScore = analyzeTextQuality(response.total_text_length);
    score += textQualityScore * 0.2;
    
    // 4. Consistency (20 points)
    // Check for contradictions, random patterns
    const consistencyScore = checkConsistency(response.answers);
    score += consistencyScore * 0.2;
    
    return Math.round(score); // 0-100
}

// Map quality_score → points_awarded
function calculateReward(quality_score, min_points, max_points) {
    // Linear mapping
    return min_points + Math.round((quality_score / 100) * (max_points - min_points));
    
    // Example: quality_score=75, min=30, max=100
    // → 30 + (75/100) * 70 = 30 + 52.5 = 82.5 ≈ 83 points
}
```

---

### 5. 🚨 Spam Detection Fields

#### Thêm vào `survey_responses`:
```sql
is_suspicious BOOLEAN,
suspicious_reasons JSON,  -- ["too_fast", "duplicate_ip", "repetitive_answers"]
ip_address VARCHAR(45),   -- Track IP
```

#### Thêm vào `survey_rewards`:
```sql
is_spam BOOLEAN,
spam_reasons JSON,
spam_checked_at DATETIME,
spam_checked_by INT  -- Admin ID hoặc NULL (system)
```

**Spam detection logic (Phase 2):**
```javascript
function detectSpam(response) {
    const reasons = [];
    
    // 1. Too fast
    if (response.completion_time < 120) { // < 2 minutes
        reasons.push('too_fast');
    }
    
    // 2. Duplicate IP trong cùng campaign (cùng ngày)
    const sameIPCount = countResponsesFromIP(response.ip_address, response.campaign_id, 'today');
    if (sameIPCount > 3) {
        reasons.push('duplicate_ip');
    }
    
    // 3. Repetitive text (same answer cho nhiều questions)
    if (hasRepetitiveText(response.answers)) {
        reasons.push('repetitive_text');
    }
    
    // 4. Gibberish detection (ML model hoặc simple heuristics)
    if (isGibberish(response.text_answers)) {
        reasons.push('gibberish_text');
    }
    
    // 5. All same rating (VD: tất cả đều chọn 5)
    if (hasUniformRatings(response.answers)) {
        reasons.push('uniform_ratings');
    }
    
    return {
        is_suspicious: reasons.length > 0,
        suspicious_reasons: reasons
    };
}
```

---

### 6. 🗑️ Soft Delete Support (GDPR)

#### Thêm vào TẤT CẢ tables:
```sql
deleted_at DATETIME
```

**Use cases:**
- User request xóa data (GDPR right to erasure)
- Admin soft delete campaign (không muốn hiện nhưng giữ lại data)
- Archive old campaigns (>6 months)

**Query pattern:**
```sql
-- ❌ Old way
SELECT * FROM survey_campaigns WHERE published = TRUE;

-- ✅ New way (always filter deleted)
SELECT * FROM survey_campaigns 
WHERE published = TRUE AND deleted_at IS NULL;
```

**Helper procedure:**
```sql
DELIMITER $$
CREATE PROCEDURE soft_delete_campaign(IN p_campaign_id INT)
BEGIN
    UPDATE survey_campaigns SET deleted_at = NOW() WHERE id = p_campaign_id;
    UPDATE survey_questions SET deleted_at = NOW() WHERE campaign_id = p_campaign_id;
    UPDATE survey_responses SET deleted_at = NOW() WHERE campaign_id = p_campaign_id;
    UPDATE survey_answers sa
      JOIN survey_responses sr ON sa.response_id = sr.id
      SET sa.deleted_at = NOW()
      WHERE sr.campaign_id = p_campaign_id;
END$$
DELIMITER ;
```

---

### 7. ⚡ Performance Optimization

#### Denormalized metrics trong `survey_campaigns`:
```sql
total_started INT DEFAULT 0,
total_completed INT DEFAULT 0,
avg_quality_score DECIMAL(5,2),
last_stats_updated_at DATETIME
```

**Why:**
- ❌ Slow: `SELECT COUNT(*) FROM survey_responses WHERE campaign_id = ?` với 10K+ responses
- ✅ Fast: `SELECT total_completed FROM survey_campaigns WHERE id = ?`

**Update strategy:**
```sql
-- Option 1: Trigger-based (Real-time, có overhead)
CREATE TRIGGER after_insert_response ...

-- Option 2: Cron job (Eventual consistency, nhẹ hơn)
-- Chạy mỗi 5 phút update stats
UPDATE survey_campaigns c
SET 
    total_started = (SELECT COUNT(*) FROM survey_responses WHERE campaign_id = c.id),
    total_completed = (SELECT COUNT(*) FROM survey_responses WHERE campaign_id = c.id AND status = 'completed'),
    avg_quality_score = (SELECT AVG(quality_score) FROM survey_responses WHERE campaign_id = c.id AND status = 'completed'),
    last_stats_updated_at = NOW()
WHERE c.id IN (SELECT DISTINCT campaign_id FROM survey_responses WHERE updated_at > c.last_stats_updated_at);
```

---

### 8. 🔒 Better Constraints & Validation

#### Added constraints:
```sql
-- Quality score range
ALTER TABLE survey_responses
  ADD CONSTRAINT check_quality_score
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

-- Time logic
ALTER TABLE survey_responses
  ADD CONSTRAINT check_completion_time
  CHECK (completed_at IS NULL OR completed_at >= started_at);

-- Reward points range
ALTER TABLE survey_campaigns
  ADD CONSTRAINT check_reward_points_range
  CHECK (min_reward_points >= 0 AND max_reward_points >= min_reward_points);
```

**Why:**
- Prevent bad data at database level
- Don't rely only on application validation

---

## 📊 New Indexes

### Original indexes:
```sql
-- survey_campaigns
INDEX idx_published_time (published, start_time, end_time)
INDEX idx_active_campaigns (published, end_time)

-- survey_questions
INDEX idx_campaign_order (campaign_id, display_order)

-- survey_responses
INDEX idx_user_campaign (user_id, campaign_id)
INDEX idx_campaign_status (campaign_id, status)
INDEX idx_completed (campaign_id, completed_at)

-- survey_answers
INDEX idx_question_answers (question_id)
```

### Improved indexes (thêm):
```sql
-- Support soft delete queries
INDEX idx_deleted (deleted_at)  -- Trên TẤT CẢ tables

-- Quality scoring queries
INDEX idx_completed (campaign_id, completed_at, quality_score)  -- Composite

-- Spam detection
INDEX idx_suspicious (is_suspicious, campaign_id)

-- Reward queries
INDEX idx_rewards_campaign_status (response_id, status, points_awarded)
INDEX idx_awarded (awarded_at, status)
```

---

## 🚀 Migration Plan for Existing Data

### Step 1: Schema changes (downtime < 5 minutes)
```sql
-- Add new columns (non-breaking)
ALTER TABLE survey_responses 
  ADD COLUMN attempt_number INT DEFAULT 1 AFTER user_id,
  ADD COLUMN quality_score DECIMAL(5,2),
  ADD COLUMN has_optional_text BOOLEAN DEFAULT FALSE,
  ADD COLUMN total_text_length INT DEFAULT 0,
  ADD COLUMN is_suspicious BOOLEAN DEFAULT FALSE,
  ADD COLUMN suspicious_reasons JSON,
  ADD COLUMN ip_address VARCHAR(45),
  ADD COLUMN deleted_at DATETIME;

-- Similar for other tables...
```

### Step 2: Backfill data (background job)
```sql
-- Populate attempt_number
UPDATE survey_responses sr
SET attempt_number = (
    SELECT COUNT(*) + 1
    FROM survey_responses sr2
    WHERE sr2.campaign_id = sr.campaign_id
      AND sr2.user_id = sr.user_id
      AND sr2.created_at < sr.created_at
);

-- Calculate has_optional_text & total_text_length
UPDATE survey_responses sr
SET 
    has_optional_text = (
        SELECT COUNT(*) > 0
        FROM survey_answers sa
        WHERE sa.response_id = sr.id AND sa.optional_text IS NOT NULL
    ),
    total_text_length = (
        SELECT COALESCE(SUM(CHAR_LENGTH(optional_text)), 0)
        FROM survey_answers
        WHERE response_id = sr.id
    )
WHERE sr.status = 'completed';
```

### Step 3: Create new table (non-blocking)
```sql
CREATE TABLE survey_rewards (...);
```

### Step 4: Update constraints (potential lock)
```sql
-- Drop old unique key
ALTER TABLE survey_responses DROP INDEX unique_user_campaign_attempt;

-- Add new unique key
ALTER TABLE survey_responses 
  ADD UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, attempt_number);
```

### Step 5: Add indexes (background, online DDL)
```sql
ALTER TABLE survey_responses 
  ADD INDEX idx_deleted (deleted_at),
  ADD INDEX idx_suspicious (is_suspicious, campaign_id);
```

---

## 📝 Summary

### Must-have for Phase 1 (MVP):
1. ✅ Fix `attempt_number` unique constraint
2. ✅ Add `survey_rewards` table
3. ✅ Add `deleted_at` for soft delete
4. ✅ Fix analytics queries (MySQL compatible)

### Nice-to-have (có thể Phase 2):
5. Quality scoring fields (có thể manual review trước)
6. Spam detection (có thể dùng manual review)
7. Denormalized metrics (tối ưu sau khi có data thật)
8. Triggers & procedures (có thể code ở application layer)

### Breaking changes:
- ⚠️ `unique_user_campaign_attempt` constraint change
  → Requires migration script
  → Downtime: ~1 minute (ALTER TABLE)

### Non-breaking additions:
- ✅ New table `survey_rewards`
- ✅ New columns with DEFAULT values
- ✅ New indexes (online DDL)
- ✅ Soft delete pattern

---

**Recommendation:** Implement **ALL must-have changes** trong Phase 1 để tránh phải migrate data 2 lần.

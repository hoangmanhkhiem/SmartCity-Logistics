# 🎯 Simplified Schema - 1 Attempt Per User Only

## Requirement Clarification

**Original PRD:**
- `max_attempts_per_user INT DEFAULT 1` → Có thể config nhiều lần

**Actual Requirement (Phase 1):**
- **Mỗi user CHỈ được làm 1 lần duy nhất / 1 campaign**
- Hard-code logic, không cần flexible

---

## Schema Changes

### ❌ KHÔNG CẦN các fields sau:

```sql
-- In survey_campaigns table:
-- max_attempts_per_user INT DEFAULT 1  → Bỏ, hard-code = 1

-- In survey_responses table:
-- attempt_number INT DEFAULT 1  → Bỏ, không cần track
```

### ✅ Simplified `survey_campaigns`:

```sql
CREATE TABLE survey_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Time constraints
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    
    -- ❌ REMOVED: max_attempts_per_user (hard-code = 1)
    
    -- Reward config
    min_reward_points INT DEFAULT 30,
    max_reward_points INT DEFAULT 100,
    
    -- ... rest of fields
) ENGINE=InnoDB;
```

### ✅ Simplified `survey_responses`:

```sql
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- ❌ REMOVED: attempt_number
    
    -- Timing
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    
    -- Status
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    
    -- Quality metrics
    quality_score DECIMAL(5,2),
    has_optional_text BOOLEAN DEFAULT FALSE,
    total_text_length INT DEFAULT 0,
    
    -- Spam detection
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reasons JSON,
    
    -- Device info
    user_agent TEXT,
    ip_address VARCHAR(45),
    app_version VARCHAR(20),
    
    -- Soft delete
    deleted_at DATETIME,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,
    
    -- ✅ SIMPLE unique constraint
    UNIQUE KEY unique_user_campaign (campaign_id, user_id),
    
    -- Indexes
    INDEX idx_user_campaign (user_id, campaign_id),
    INDEX idx_campaign_status (campaign_id, status, deleted_at),
    INDEX idx_completed (campaign_id, completed_at, quality_score),
    INDEX idx_suspicious (is_suspicious, campaign_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Business Logic Changes

### ❌ KHÔNG CẦN trigger auto-increment attempt_number:

```sql
-- DELETE THIS TRIGGER (không cần nữa)
-- DELIMITER $$
-- CREATE TRIGGER before_insert_survey_response ...
```

### ✅ Validation logic đơn giản hơn:

```typescript
async function startSurvey(userId: number, campaignId: number) {
  // 1. Validate campaign is active
  const campaign = await validateCampaignActive(campaignId);
  
  // 2. Check user đã làm chưa (1 query duy nhất)
  const existingResponse = await db.survey_responses.findOne({
    where: { 
      campaign_id: campaignId, 
      user_id: userId,
      deleted_at: null  // Chỉ check responses chưa bị xóa
    }
  });
  
  if (existingResponse) {
    // Case 1: Đã complete rồi
    if (existingResponse.status === 'completed') {
      throw new BadRequestException('Bạn đã hoàn thành survey này rồi');
    }
    
    // Case 2: Đang in_progress → Resume existing response
    return {
      response_id: existingResponse.id,
      is_resume: true,
      message: 'Tiếp tục survey đang làm dở'
    };
  }
  
  // 3. Create NEW response (không cần tính attempt_number)
  const response = await db.survey_responses.create({
    campaign_id: campaignId,
    user_id: userId,
    // ❌ REMOVED: attempt_number: 1
    started_at: new Date(),
    status: 'in_progress',
    user_agent: req.body.device_info?.user_agent,
    ip_address: req.ip,
    app_version: req.body.device_info?.app_version
  });
  
  return {
    response_id: response.id,
    is_resume: false
  };
}
```

---

## API Response Changes

### GET `/api/surveys/active`

```typescript
// ✅ Simplified user_attempts
{
  surveys: [
    {
      id: 1,
      title: "Khảo sát Q2 2026",
      // ...
      
      // ✅ BEFORE (complex):
      // user_attempts: {
      //   total_attempts: 0,
      //   max_attempts: 1,
      //   can_attempt: true,
      //   last_attempt: null
      // }
      
      // ✅ AFTER (simple):
      user_status: {
        has_completed: false,  // true/false
        is_in_progress: false, // true/false
        can_start: true        // true/false
      }
    }
  ]
}
```

### GET `/api/surveys/:id/my-responses`

```typescript
// ✅ Simplified response
{
  data: {
    response: {  // Singular, không phải array (chỉ có 1 response)
      id: 123,
      campaign_id: 1,
      // ❌ REMOVED: attempt_number: 1
      status: "completed",
      started_at: "...",
      completed_at: "...",
      
      reward: {
        status: "awarded",
        points_awarded: 85
      }
    }
  }
}
```

---

## Benefits of Simplification

### ✅ Pros:
1. **Đơn giản hơn nhiều**: Bỏ được 2 fields + 1 trigger
2. **Query nhanh hơn**: Không cần `COUNT(*)` để tính attempt
3. **Logic rõ ràng hơn**: 1 user = 1 response (1-to-1 relationship)
4. **Ít bugs hơn**: Không có edge cases về attempt_number
5. **API cleaner**: Không cần expose attempt-related fields

### ⚠️ Cons (Trade-offs):
1. **Không flexible**: Nếu sau này muốn cho user làm lại → Phải migration
2. **Không support retry**: Nếu user làm fail (bug, crash) → Không retry được
3. **A/B testing khó hơn**: Không test được "cho 1 nhóm user làm 2 lần"

---

## Migration từ Complex → Simple

### Nếu đã implement schema phức tạp, migrate như sau:

```sql
-- Step 1: Verify tất cả users đều chỉ có attempt_number = 1
SELECT user_id, campaign_id, COUNT(*) as attempts
FROM survey_responses
GROUP BY user_id, campaign_id
HAVING attempts > 1;
-- → Nếu có results → Cần xử lý data trước

-- Step 2: Drop unique constraint cũ
ALTER TABLE survey_responses 
  DROP INDEX unique_user_campaign_attempt;

-- Step 3: Add unique constraint mới (đơn giản)
ALTER TABLE survey_responses
  ADD UNIQUE KEY unique_user_campaign (campaign_id, user_id);

-- Step 4: Drop attempt_number column
ALTER TABLE survey_responses
  DROP COLUMN attempt_number;

-- Step 5: Drop trigger (nếu có)
DROP TRIGGER IF EXISTS before_insert_survey_response;

-- Step 6: Remove max_attempts_per_user từ campaigns
ALTER TABLE survey_campaigns
  DROP COLUMN max_attempts_per_user;
```

---

## Recommendation

### 🎯 For Phase 1 (MVP):
**→ Dùng SIMPLE schema (1 attempt only)**

**Lý do:**
- Requirement rõ ràng: chỉ 1 lần
- Đơn giản hơn để implement nhanh
- Ít bugs hơn
- Dễ maintain hơn

### 🚀 For Future (nếu cần):
**Nếu sau này cần multiple attempts:**
- Add lại `attempt_number` column
- Update unique constraint
- Migrate existing data (set all = 1)
- Update API responses

**Cost:** ~2 hours migration, ~1 day testing

---

## Updated Query Examples

### Check user can start survey:

```sql
-- ✅ BEFORE (complex):
-- SELECT COUNT(*) as attempt_count
-- FROM survey_responses
-- WHERE campaign_id = ? AND user_id = ?;
-- IF attempt_count >= max_attempts THEN reject

-- ✅ AFTER (simple):
SELECT id, status
FROM survey_responses
WHERE campaign_id = ? AND user_id = ? AND deleted_at IS NULL;
-- IF exists AND status = 'completed' THEN reject
-- IF exists AND status = 'in_progress' THEN resume
-- IF not exists THEN allow
```

### Get user's response for campaign:

```sql
-- ✅ BEFORE (complex):
-- SELECT * FROM survey_responses
-- WHERE campaign_id = ? AND user_id = ?
-- ORDER BY attempt_number DESC
-- LIMIT 1;

-- ✅ AFTER (simple):
SELECT * FROM survey_responses
WHERE campaign_id = ? AND user_id = ? AND deleted_at IS NULL;
-- Max 1 row (guaranteed by unique constraint)
```

---

## Summary

| Aspect | Complex Schema | **Simple Schema (Recommended)** |
|--------|----------------|----------------------------------|
| Unique constraint | `(campaign_id, user_id, attempt_number)` | `(campaign_id, user_id)` ✅ |
| Fields | +2 fields | -2 fields ✅ |
| Triggers | +1 trigger | 0 triggers ✅ |
| Query complexity | Need COUNT(*) | Direct lookup ✅ |
| Future flexibility | ✅ Can extend | ❌ Need migration |
| Implementation time | ~3 days | ~1.5 days ✅ |
| Bug potential | Medium | Low ✅ |

**Verdict:** Dùng **Simple Schema** cho Phase 1 MVP 🚀

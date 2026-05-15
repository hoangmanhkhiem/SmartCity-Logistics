# 🚀 Survey API Design - Phase 1

## 📋 API Overview

### User-facing APIs (Mobile App):
```
GET    /api/surveys/active              # Lấy danh sách surveys đang active
GET    /api/surveys/:id                 # Chi tiết 1 survey + questions
POST   /api/surveys/:id/start           # Bắt đầu làm survey
POST   /api/surveys/:id/answers         # Submit/Update answers
POST   /api/surveys/:id/complete        # Hoàn thành survey
GET    /api/surveys/:id/my-responses    # Lịch sử responses của user
```

### Admin CMS APIs:
```
# Campaign Management
GET    /admin/api/surveys                     # List campaigns (with filters)
POST   /admin/api/surveys                     # Create campaign
GET    /admin/api/surveys/:id                 # Get campaign details
PUT    /admin/api/surveys/:id                 # Update campaign
DELETE /admin/api/surveys/:id                 # Soft delete campaign
POST   /admin/api/surveys/:id/publish         # Publish campaign
POST   /admin/api/surveys/:id/unpublish       # Unpublish campaign

# Question Management
POST   /admin/api/surveys/:id/questions       # Add question
PUT    /admin/api/v1/questions/:questionId       # Update question
DELETE /admin/api/v1/questions/:questionId       # Delete question
POST   /admin/api/v1/questions/:questionId/reorder  # Change display_order

# Analytics & Reports
GET    /admin/api/surveys/:id/stats           # Campaign statistics
GET    /admin/api/surveys/:id/responses       # List all responses (paginated)
GET    /admin/api/surveys/:id/responses/:responseId  # Response details
GET    /admin/api/surveys/:id/export          # Export CSV/Excel
GET    /admin/api/surveys/:id/question-analytics  # Per-question analytics

# Reward Management
GET    /admin/api/surveys/:id/rewards         # List rewards (pending/awarded)
POST   /admin/api/v1/rewards/:id/calculate       # Trigger quality score calculation
POST   /admin/api/v1/rewards/:id/award           # Manually award points
POST   /admin/api/v1/rewards/:id/reject          # Reject reward (spam)
POST   /admin/api/surveys/:id/top-contributors  # Select top contributors
```

---

## 📱 User APIs - Chi tiết

### 1. GET `/api/surveys/active`

**Purpose:** Lấy danh sách surveys đang active cho user

**Authorization:** Required (JWT token)

**Query params:**
```typescript
{
  page?: number;      // Default: 1
  limit?: number;     // Default: 10
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    surveys: [
      {
        id: 1,
        title: "Khảo sát trải nghiệm Q2 2026",
        description: "Giúp chúng tôi cải thiện Nô Tì...",
        start_time: "2026-04-01T00:00:00Z",
        end_time: "2026-04-30T23:59:59Z",
        estimated_completion_time_seconds: 300,
        
        // Reward info
        min_reward_points: 30,
        max_reward_points: 100,
        
        // User's attempt status
        user_attempts: {
          total_attempts: 0,  // Đã làm bao nhiêu lần
          max_attempts: 1,     // Được làm tối đa
          can_attempt: true,   // Còn được làm không
          last_attempt: null   // Lần làm gần nhất
        },
        
        // Stats (optional - for motivation)
        total_participants: 1250,
        completion_rate: 87.5
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      total_pages: 1
    }
  }
}
```

**Business logic:**
```sql
SELECT c.*
FROM survey_campaigns c
WHERE c.published = TRUE
  AND c.deleted_at IS NULL
  AND NOW() BETWEEN c.start_time AND c.end_time
  AND (
    -- Check user chưa đạt max attempts
    (SELECT COUNT(*) FROM survey_responses sr 
     WHERE sr.campaign_id = c.id AND sr.user_id = :userId) < c.max_attempts_per_user
  )
ORDER BY c.start_time DESC;
```

---

### 2. GET `/api/surveys/:id`

**Purpose:** Lấy chi tiết survey + tất cả questions

**Authorization:** Required

**Response:**
```typescript
{
  success: true,
  data: {
    campaign: {
      id: 1,
      title: "Khảo sát trải nghiệm Q2 2026",
      description: "...",
      estimated_completion_time_seconds: 300,
      min_reward_points: 30,
      max_reward_points: 100,
      
      user_attempts: {
        total_attempts: 0,
        max_attempts: 1,
        can_attempt: true
      }
    },
    
    questions: [
      {
        id: 1,
        question_text: "Khả năng bạn giới thiệu Nô Tì cho bạn bè?",
        question_type: "nps",
        display_order: 1,
        is_required: true,
        
        config: {
          min: 0,
          max: 10,
          labels: {
            "0": "Không có khả năng",
            "10": "Chắc chắn giới thiệu"
          }
        },
        
        enable_optional_text: true,
        optional_text_placeholder: "Lý do chính cho điểm này?"
      },
      {
        id: 2,
        question_text: "Đánh giá các tính năng:",
        question_type: "feature_matrix",
        display_order: 2,
        is_required: true,
        
        config: {
          features: [
            "Trang chủ (Feed)",
            "Thông báo",
            "Dạo deal"
          ],
          scale: [
            {"value": 0, "label": "Chưa dùng"},
            {"value": 1, "label": "Rất tệ"},
            {"value": 5, "label": "Rất tốt"}
          ]
        },
        
        enable_optional_text: true,
        optional_text_placeholder: "Tính năng nào cần cải thiện gấp nhất?"
      }
      // ... more questions
    ]
  }
}
```

**Business logic:**
```sql
-- 1. Get campaign
SELECT * FROM survey_campaigns 
WHERE id = :campaignId 
  AND published = TRUE 
  AND deleted_at IS NULL
  AND NOW() BETWEEN start_time AND end_time;

-- 2. Check user can attempt
SELECT COUNT(*) as attempt_count
FROM survey_responses
WHERE campaign_id = :campaignId AND user_id = :userId;

-- 3. Get questions
SELECT * FROM survey_questions
WHERE campaign_id = :campaignId 
  AND deleted_at IS NULL
ORDER BY display_order ASC;
```

---

### 3. POST `/api/surveys/:id/start`

**Purpose:** Bắt đầu làm survey (tạo response record)

**Authorization:** Required

**Request body:**
```typescript
{
  // Optional metadata
  device_info?: {
    user_agent: string;
    app_version: string;
    device_model: string;
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    response_id: 123,
    campaign_id: 1,
    started_at: "2026-04-28T10:30:00Z",
    status: "in_progress",
    
    // Return questions để client render
    questions: [...] // Same as GET /surveys/:id
  }
}
```

**Business logic:**
```typescript
async function startSurvey(userId: number, campaignId: number) {
  // 1. Validate campaign is active
  const campaign = await validateCampaignActive(campaignId);
  
  // 2. Check user attempts
  const attemptCount = await getUserAttemptCount(userId, campaignId);
  if (attemptCount >= campaign.max_attempts_per_user) {
    throw new BadRequestException('Bạn đã hết lượt làm survey này');
  }
  
  // 3. Calculate next attempt_number (handled by trigger or manually)
  const attemptNumber = attemptCount + 1;
  
  // 4. Create response
  const response = await db.survey_responses.create({
    campaign_id: campaignId,
    user_id: userId,
    attempt_number: attemptNumber,
    started_at: new Date(),
    status: 'in_progress',
    user_agent: req.body.device_info?.user_agent,
    ip_address: req.ip,
    app_version: req.body.device_info?.app_version
  });
  
  return response;
}
```

---

### 4. POST `/api/surveys/:id/answers`

**Purpose:** Submit hoặc update câu trả lời cho 1 hoặc nhiều questions

**Authorization:** Required

**Request body:**
```typescript
{
  response_id: number;  // From /start endpoint
  
  answers: [
    {
      question_id: number;
      answer_value: any;  // Structure depends on question_type
      optional_text?: string;
      started_at?: string;  // ISO timestamp - khi user bắt đầu câu này
      completed_at: string;  // ISO timestamp - khi user xong câu này
    }
  ]
}
```

**Example:**
```json
{
  "response_id": 123,
  "answers": [
    {
      "question_id": 1,
      "answer_value": {"score": 9},
      "optional_text": "App nhanh, dễ dùng",
      "started_at": "2026-04-28T10:31:00Z",
      "completed_at": "2026-04-28T10:31:45Z"
    },
    {
      "question_id": 2,
      "answer_value": {
        "Trang chủ (Feed)": 4,
        "Thông báo": 5,
        "Dạo deal": 3
      },
      "optional_text": "Thông báo rất tốt, nhưng Dạo deal hơi chậm",
      "completed_at": "2026-04-28T10:33:20Z"
    }
  ]
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    saved_count: 2,
    updated_count: 0,  // Nếu user sửa lại câu trả lời cũ
    
    progress: {
      answered_questions: 2,
      total_questions: 8,
      completion_percentage: 25
    }
  }
}
```

**Business logic:**
```typescript
async function saveAnswers(userId: number, dto: SaveAnswersDto) {
  // 1. Validate response belongs to user
  const response = await db.survey_responses.findOne({
    where: { id: dto.response_id, user_id: userId, status: 'in_progress' }
  });
  
  if (!response) {
    throw new BadRequestException('Response không hợp lệ hoặc đã complete');
  }
  
  // 2. Validate questions belong to campaign
  const questionIds = dto.answers.map(a => a.question_id);
  const validQuestions = await db.survey_questions.find({
    where: { 
      id: In(questionIds), 
      campaign_id: response.campaign_id,
      deleted_at: null 
    }
  });
  
  if (validQuestions.length !== questionIds.length) {
    throw new BadRequestException('Một số questions không hợp lệ');
  }
  
  // 3. Save or update answers
  const savedAnswers = [];
  for (const answerDto of dto.answers) {
    // Check if answer exists (user editing previous answer)
    const existingAnswer = await db.survey_answers.findOne({
      where: { response_id: dto.response_id, question_id: answerDto.question_id }
    });
    
    if (existingAnswer) {
      // Update + track history
      const updateHistory = existingAnswer.update_history || [];
      updateHistory.push({
        timestamp: new Date(),
        old_answer_value: existingAnswer.answer_value,
        old_optional_text: existingAnswer.optional_text
      });
      
      await db.survey_answers.update(existingAnswer.id, {
        answer_value: answerDto.answer_value,
        optional_text: answerDto.optional_text,
        optional_text_length: answerDto.optional_text?.length || 0,
        completed_at: answerDto.completed_at,
        time_spent_seconds: calculateTimeSpent(answerDto.started_at, answerDto.completed_at),
        edit_count: existingAnswer.edit_count + 1,
        update_history: updateHistory
      });
    } else {
      // Create new
      await db.survey_answers.create({
        response_id: dto.response_id,
        question_id: answerDto.question_id,
        answer_value: answerDto.answer_value,
        optional_text: answerDto.optional_text,
        optional_text_length: answerDto.optional_text?.length || 0,
        started_at: answerDto.started_at,
        completed_at: answerDto.completed_at,
        time_spent_seconds: calculateTimeSpent(answerDto.started_at, answerDto.completed_at)
      });
    }
  }
  
  return { saved_count: dto.answers.length };
}
```

---

### 5. POST `/api/surveys/:id/complete`

**Purpose:** Hoàn thành survey (finalize response)

**Authorization:** Required

**Request body:**
```typescript
{
  response_id: number;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    response_id: 123,
    status: "completed",
    completed_at: "2026-04-28T10:37:00Z",
    
    // Completion summary
    summary: {
      total_questions: 8,
      answered_questions: 8,
      required_questions: 6,
      answered_required: 6,
      completion_time_seconds: 405
    },
    
    // Reward info (Phase 1: Pending manual review)
    reward: {
      status: "pending",  // Phase 1: pending | Phase 2: calculated
      estimated_points: "30-100",
      message: "Cảm ơn bạn! Điểm thưởng sẽ được tính trong vòng 24h."
    }
  }
}
```

**Business logic:**
```typescript
async function completeSurvey(userId: number, campaignId: number, responseId: number) {
  // 1. Validate response
  const response = await db.survey_responses.findOne({
    where: { id: responseId, user_id: userId, campaign_id: campaignId, status: 'in_progress' }
  });
  
  if (!response) {
    throw new BadRequestException('Response không hợp lệ');
  }
  
  // 2. Validate all required questions answered
  const campaign = await db.survey_campaigns.findOne(campaignId);
  const requiredQuestions = await db.survey_questions.find({
    where: { campaign_id: campaignId, is_required: true, deleted_at: null }
  });
  
  const answeredQuestions = await db.survey_answers.find({
    where: { response_id: responseId }
  });
  
  const answeredQuestionIds = answeredQuestions.map(a => a.question_id);
  const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));
  
  if (missingRequired.length > 0) {
    throw new BadRequestException(`Còn ${missingRequired.length} câu hỏi bắt buộc chưa trả lời`);
  }
  
  // 3. Mark as completed
  const completedAt = new Date();
  await db.survey_responses.update(responseId, {
    status: 'completed',
    completed_at: completedAt
  });
  
  // 4. Calculate basic metrics (triggers will handle has_optional_text, total_text_length)
  // These will be used for quality scoring in Phase 2
  
  // 5. Create reward record (Phase 1: pending manual review)
  await db.survey_rewards.create({
    response_id: responseId,
    reward_type: 'base_reward',
    status: 'pending',
    points_awarded: 0  // Will be calculated later
  });
  
  // 6. Queue background job for quality scoring (Phase 2)
  // await queueQualityScoring(responseId);
  
  return response;
}
```

---

### 6. GET `/api/surveys/:id/my-responses`

**Purpose:** Lịch sử responses của user cho 1 campaign

**Authorization:** Required

**Response:**
```typescript
{
  success: true,
  data: {
    responses: [
      {
        id: 123,
        campaign_id: 1,
        attempt_number: 1,
        status: "completed",
        started_at: "2026-04-28T10:30:00Z",
        completed_at: "2026-04-28T10:37:00Z",
        completion_time_seconds: 420,
        
        reward: {
          status: "awarded",
          points_awarded: 85,
          awarded_at: "2026-04-28T18:00:00Z"
        }
      }
    ]
  }
}
```

---

## 🔐 Admin APIs - Chi tiết (Selected key endpoints)

### 1. POST `/admin/api/surveys`

**Purpose:** Tạo campaign mới

**Authorization:** Admin only, requires `SURVEY_CREATE` permission

**Request body:**
```typescript
{
  title: string;
  description: string;
  start_time: string; // ISO datetime
  end_time: string;
  max_attempts_per_user: number;  // Default: 1
  min_reward_points: number;      // Default: 30
  max_reward_points: number;      // Default: 100
  estimated_completion_time_seconds: number;  // Default: 300
  published: boolean;  // Default: false (draft)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: 1,
    title: "...",
    // ... all campaign fields
    created_at: "...",
    created_by: 5  // Admin user ID
  }
}
```

---

### 2. GET `/admin/api/surveys/:id/stats`

**Purpose:** Campaign statistics & analytics

**Authorization:** Admin only

**Response:**
```typescript
{
  success: true,
  data: {
    campaign: {
      id: 1,
      title: "Khảo sát Q2 2026",
      start_time: "...",
      end_time: "...",
      status: "active"  // draft | active | completed
    },
    
    participation: {
      total_started: 3250,
      total_completed: 2840,
      total_in_progress: 410,
      completion_rate: 87.4,  // %
      
      // Time-series data (last 7 days)
      daily_responses: [
        { date: "2026-04-22", started: 450, completed: 390 },
        { date: "2026-04-23", started: 520, completed: 465 }
        // ...
      ]
    },
    
    timing: {
      avg_completion_time_seconds: 385,
      median_completion_time_seconds: 360,
      p80_completion_time_seconds: 480,
      p95_completion_time_seconds: 600,
      
      fastest_completion_seconds: 125,
      slowest_completion_seconds: 1850
    },
    
    quality: {
      avg_quality_score: 72.5,
      responses_with_optional_text: 1850,
      optional_text_rate: 65.1,  // %
      avg_text_length: 145,
      
      suspicious_responses: 45,
      suspicious_rate: 1.4  // %
    },
    
    rewards: {
      total_points_pending: 0,
      total_points_awarded: 241500,
      avg_points_per_user: 85,
      
      reward_distribution: {
        "30-40": 150,   // 150 users got 30-40 points
        "41-50": 320,
        "51-60": 580,
        "61-70": 720,
        "71-80": 650,
        "81-90": 350,
        "91-100": 70
      }
    }
  }
}
```

**Query:**
```sql
-- Main stats
SELECT 
    COUNT(*) as total_started,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
    AVG(CASE WHEN status = 'completed' THEN quality_score END) as avg_quality_score,
    AVG(CASE WHEN status = 'completed' THEN TIMESTAMPDIFF(SECOND, started_at, completed_at) END) as avg_completion_seconds
FROM survey_responses
WHERE campaign_id = ? AND deleted_at IS NULL;

-- Percentile (P80)
SELECT completion_time as p80_time
FROM (
    SELECT 
        TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
        PERCENT_RANK() OVER (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as percentile
    FROM survey_responses
    WHERE campaign_id = ? AND status = 'completed'
) ranked
WHERE percentile >= 0.80
LIMIT 1;
```

---

### 3. GET `/admin/api/surveys/:id/responses`

**Purpose:** List all responses (với filters)

**Authorization:** Admin only

**Query params:**
```typescript
{
  page?: number;
  limit?: number;
  status?: 'in_progress' | 'completed';
  quality_score_min?: number;
  quality_score_max?: number;
  has_optional_text?: boolean;
  is_suspicious?: boolean;
  sort_by?: 'created_at' | 'completed_at' | 'quality_score';
  sort_order?: 'asc' | 'desc';
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    responses: [
      {
        id: 123,
        user_id: 456,
        user: {
          id: 456,
          name: "Nguyễn Văn A",
          phone: "0901***789"  // Masked
        },
        
        attempt_number: 1,
        status: "completed",
        started_at: "2026-04-28T10:30:00Z",
        completed_at: "2026-04-28T10:37:00Z",
        completion_time_seconds: 420,
        
        quality_score: 85.5,
        has_optional_text: true,
        total_text_length: 245,
        is_suspicious: false,
        
        reward: {
          status: "awarded",
          points_awarded: 88
        },
        
        // Preview of answers (first 2 questions)
        answers_preview: [
          {
            question_id: 1,
            question_text: "Khả năng giới thiệu...",
            answer_value: {"score": 9},
            optional_text: "App nhanh, dễ dùng"
          },
          {
            question_id: 2,
            question_text: "Đánh giá tính năng...",
            answer_value: {...},
            optional_text: "..."
          }
        ]
      }
    ],
    
    pagination: { page: 1, limit: 20, total: 2840, total_pages: 142 },
    
    filters_applied: {
      status: "completed",
      quality_score_min: 70
    }
  }
}
```

---

### 4. POST `/admin/api/surveys/:id/top-contributors`

**Purpose:** Select top contributors và assign rewards

**Authorization:** Admin only

**Request body:**
```typescript
{
  top_contributors: [
    {
      response_id: 123,
      rank: 1,
      points_bonus: 500,
      voucher_value: 100000,
      review_notes: "Rất chi tiết, nhiều insights về UI/UX"
    },
    {
      response_id: 456,
      rank: 2,
      points_bonus: 400,
      voucher_value: 80000,
      review_notes: "Ý tưởng tính năng mới rất hay"
    }
    // ... top 10
  ]
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    updated_count: 10,
    total_bonus_points: 3200,
    total_voucher_value: 540000
  }
}
```

**Business logic:**
```typescript
async function selectTopContributors(campaignId: number, adminId: number, dto: SelectTopDto) {
  for (const contributor of dto.top_contributors) {
    // Update reward record
    await db.survey_rewards.update(
      { response_id: contributor.response_id },
      {
        reward_type: 'top_contributor',
        rank_position: contributor.rank,
        points_awarded: (existing_points) + contributor.points_bonus,
        voucher_value: contributor.voucher_value,
        reviewed_by: adminId,
        review_notes: contributor.review_notes,
        status: 'calculated'  // Ready to award
      }
    );
  }
  
  // Queue job to award points + vouchers
  await queueRewardDistribution(campaignId);
}
```

---

## 🔄 Workflow Summary

### User Flow:
```
1. User opens app → GET /surveys/active → Shows available surveys
2. User taps survey → GET /surveys/:id → Shows intro + questions
3. User starts → POST /surveys/:id/start → Creates response record
4. User answers → POST /surveys/:id/answers (multiple times) → Saves progress
5. User finishes → POST /surveys/:id/complete → Marks completed, creates reward record
6. [Background] System calculates quality score → Updates reward
7. [Background] System awards points → Updates loyalty_histories
8. User receives push notification: "Bạn nhận được 85 điểm!"
```

### Admin Flow:
```
1. Admin creates campaign → POST /admin/surveys
2. Admin adds questions → POST /admin/surveys/:id/questions (8 times)
3. Admin previews → GET /admin/surveys/:id
4. Admin publishes → POST /admin/surveys/:id/publish
5. [Wait for responses]
6. Admin monitors → GET /admin/surveys/:id/stats
7. Admin reviews responses → GET /admin/surveys/:id/responses?quality_score_min=80
8. Admin selects top 10 → POST /admin/surveys/:id/top-contributors
9. System awards all rewards (base + top) → Background job
10. Admin exports data → GET /admin/surveys/:id/export
```

---

## ⚡ Performance Considerations

### Caching strategy:
```typescript
// Cache active surveys list (5 minutes)
@Cache('surveys:active', 300)
async getActiveSurveys() { ... }

// Cache campaign details (10 minutes)
@Cache('survey:${id}:details', 600)
async getSurveyDetails(id: number) { ... }

// Cache stats (1 minute - cho admin dashboard)
@Cache('survey:${id}:stats', 60)
async getCampaignStats(id: number) { ... }

// Invalidate cache on changes
@CacheEvict(['surveys:active', 'survey:${id}:details'])
async updateCampaign(id: number) { ... }
```

### Database optimization:
```typescript
// Use transactions for /complete endpoint
async completeSurvey() {
  return await db.transaction(async (tx) => {
    await tx.survey_responses.update(...);
    await tx.survey_rewards.create(...);
    // Rollback if any step fails
  });
}

// Use bulk insert for /answers with multiple questions
async saveAnswers(answers: Answer[]) {
  return await db.survey_answers.bulkInsert(answers);
}
```

---

**Next steps:**
1. Review API design với team
2. Finalize database schema
3. Implement Phase 1 APIs (user-facing first)
4. Build admin panel
5. Testing & soft launch

# Survey Mini-app - Phase 1 Database Setup

## Tổng quan

Phase 1 của Survey mini-app chỉ bao gồm chức năng khảo sát cơ bản, **KHÔNG có reward system**. 

Database schema bao gồm 4 bảng chính:
- `survey_campaigns` - Quản lý các campaign khảo sát
- `survey_questions` - Câu hỏi trong từng campaign
- `survey_responses` - Phản hồi của user cho mỗi campaign
- `survey_answers` - Câu trả lời cụ thể cho từng câu hỏi

## Files đã tạo

### Migration File
📁 Location: `/Users/trieubao/Work/PIGGI_BE/piggi-portal-database/src/migrations/`
- `1777343966000-create-survey-tables.ts`

Migration này tạo:
- 4 tables với đầy đủ indexes, constraints
- 1 trigger `after_update_response_metrics` để auto-update metrics
- 2 views cho analytics (`v_campaign_stats`, `v_question_stats`)

### Entity Files
📁 Location: `/Users/trieubao/Work/PIGGI_BE/piggi-portal-database/src/entities/`

#### 1. Survey Campaign
- `survey-campaign/survey-campaign.entity.ts`
- `survey-campaign/survey-campaign.provider.ts`
- Provider: `SURVEY_CAMPAIGN_REPOSITORY`

#### 2. Survey Question  
- `survey-question/survey-question.entity.ts`
- `survey-question/survey-question.provider.ts`
- Provider: `SURVEY_QUESTION_REPOSITORY`
- Enum: `QuestionType` (8 types: nps, rating_scale, feature_matrix, single_choice, multiple_choice, ranking, text_short, text_long)

#### 3. Survey Response
- `survey-response/survey-response.entity.ts`
- `survey-response/survey-response.provider.ts`
- Provider: `SURVEY_RESPONSE_REPOSITORY`
- Enum: `ResponseStatus` (in_progress, completed, abandoned)

#### 4. Survey Answer
- `survey-answer/survey-answer.entity.ts`
- `survey-answer/survey-answer.provider.ts`
- Provider: `SURVEY_ANSWER_REPOSITORY`

### Export Updates
File `mysql.expose.ts` đã được update để export tất cả survey entities và providers.

## Database Schema Highlights

### Key Constraints
1. **Unique User Response**: Mỗi user chỉ được 1 response per campaign
   ```sql
   UNIQUE KEY unique_user_campaign (campaignId, userId)
   ```

2. **Auto-save Pattern**: 1 question có thể được update nhiều lần (UPSERT)
   ```sql
   UNIQUE KEY unique_response_question (responseId, questionId)
   ```

3. **Completion Time Check**:
   ```sql
   CHECK (completedAt IS NULL OR completedAt >= startedAt)
   ```

### Important Indexes
- Campaign active status: `idx_active (published, endTime, deletedAt)`
- Question order: `idx_campaign_order (campaignId, displayOrder, deletedAt)`
- Response tracking: `idx_campaign_status (campaignId, status, deletedAt)`
- User lookup: `idx_user_campaign (userId, campaignId)`

### Trigger
`after_update_response_metrics` tự động update khi status chuyển sang `completed`:
- `hasOptionalText`: Có ít nhất 1 optional text
- `totalTextLength`: Tổng độ dài các optional text

### Analytics Views
1. **v_campaign_stats**: Campaign metrics
   - Total responses, completion rate
   - Average completion time
   - Optional text rate

2. **v_question_stats**: Question metrics
   - Total answers
   - Answers with optional text
   - Average time spent

## Cách chạy Migration

### Option 1: Sử dụng TypeORM CLI (Recommended)

1. **Build package**:
```bash
cd /Users/trieubao/Work/PIGGI_BE/piggi-portal-database
yarn build
```

2. **Chạy migration**:
```bash
# Trong api-cms hoặc project sử dụng piggi-portal-database
yarn migration:run
```

3. **Revert nếu cần**:
```bash
yarn migration:revert
```

### Option 2: Import vào MySQL trực tiếp

1. **Generate SQL từ migration**:
```bash
cd /Users/trieubao/Work/PIGGI_BE/piggi-portal-database
yarn migration:show
```

2. **Hoặc run manual** bằng schema gốc:
```bash
mysql -u root -p piggi_database < /Users/trieubao/Work/PIGGI_BE/piggi-pm/.conversations/survey/schema-phase1-no-rewards.sql
```

### Option 3: Sử dụng package updated

1. **Publish package mới**:
```bash
cd /Users/trieubao/Work/PIGGI_BE/piggi-portal-database
yarn version patch  # hoặc minor/major
yarn build
yarn publish
```

2. **Update trong api-cms**:
```bash
cd /Users/trieubao/Work/PIGGI_BE/api-cms
yarn upgrade @piggi-group/piggi-portal-database
```

3. **Chạy migration**:
```bash
yarn migration:run
```

## Sử dụng Entities trong Code

### Import entities
```typescript
import {
  SurveyCampaignEntity,
  SurveyQuestionEntity,
  SurveyResponseEntity,
  SurveyAnswerEntity,
  QuestionType,
  ResponseStatus,
  surveyCampaignProviders,
  surveyQuestionProviders,
  surveyResponseProviders,
  surveyAnswerProviders,
} from '@piggi-group/piggi-portal-database';
```

### Inject repositories
```typescript
// In module
@Module({
  providers: [
    ...surveyCampaignProviders,
    ...surveyQuestionProviders,
    ...surveyResponseProviders,
    ...surveyAnswerProviders,
    SurveyService,
  ],
})
export class SurveyModule {}

// In service
@Injectable()
export class SurveyService {
  constructor(
    @Inject('SURVEY_CAMPAIGN_REPOSITORY')
    private campaignRepo: Repository<SurveyCampaignEntity>,
    
    @Inject('SURVEY_QUESTION_REPOSITORY')
    private questionRepo: Repository<SurveyQuestionEntity>,
    
    @Inject('SURVEY_RESPONSE_REPOSITORY')
    private responseRepo: Repository<SurveyResponseEntity>,
    
    @Inject('SURVEY_ANSWER_REPOSITORY')
    private answerRepo: Repository<SurveyAnswerEntity>,
  ) {}
}
```

### Example: Tạo campaign với questions
```typescript
async createCampaign(data: CreateCampaignDto) {
  const campaign = await this.campaignRepo.save({
    title: data.title,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    published: false,
    createdBy: data.adminId,
  });

  // Tạo questions
  const questions = data.questions.map((q, index) => ({
    campaignId: campaign.id,
    questionText: q.text,
    questionType: q.type as QuestionType,
    config: q.config,
    displayOrder: index + 1,
    isRequired: q.required ?? true,
  }));

  await this.questionRepo.save(questions);

  return campaign;
}
```

### Example: UPSERT answer (auto-save pattern)
```typescript
async saveAnswer(userId: number, campaignId: number, questionId: number, answerData: any) {
  // Tìm hoặc tạo response
  let response = await this.responseRepo.findOne({
    where: { campaignId, userId },
  });

  if (!response) {
    response = await this.responseRepo.save({
      campaignId,
      userId,
      startedAt: new Date(),
      status: ResponseStatus.IN_PROGRESS,
    });
  }

  // UPSERT answer
  const answer = await this.answerRepo.findOne({
    where: { responseId: response.id, questionId },
  });

  if (answer) {
    // Update existing
    answer.answerValue = answerData.value;
    answer.optionalText = answerData.optionalText;
    answer.optionalTextLength = answerData.optionalText?.length || 0;
    answer.editCount += 1;
    answer.completedAt = new Date();
    
    await this.answerRepo.save(answer);
  } else {
    // Create new
    await this.answerRepo.save({
      responseId: response.id,
      questionId,
      answerValue: answerData.value,
      optionalText: answerData.optionalText,
      optionalTextLength: answerData.optionalText?.length || 0,
      completedAt: new Date(),
    });
  }

  return answer;
}
```

### Example: Complete survey
```typescript
async completeSurvey(userId: number, campaignId: number) {
  const response = await this.responseRepo.findOne({
    where: { campaignId, userId },
  });

  if (!response) {
    throw new NotFoundException('Response not found');
  }

  // Update status - trigger sẽ tự động update metrics
  response.status = ResponseStatus.COMPLETED;
  response.completedAt = new Date();
  
  await this.responseRepo.save(response);
  
  // Trigger `after_update_response_metrics` sẽ tự động:
  // - Update hasOptionalText
  // - Update totalTextLength
  
  return response;
}
```

## Question Types và Config Schema

### 1. NPS (Net Promoter Score)
```typescript
config: {
  scale: 11,  // 0-10
  labels: {
    low: "Không khuyến khích",
    high: "Rất khuyến khích"
  }
}
```

### 2. Rating Scale
```typescript
config: {
  scale: 5,  // 1-5 stars
  labels: {
    low: "Rất không hài lòng",
    high: "Rất hài lòng"
  }
}
```

### 3. Feature Matrix
```typescript
config: {
  features: ["Feature A", "Feature B", "Feature C"],
  scale_labels: ["Không quan trọng", "Quan trọng", "Rất quan trọng"]
}
```

### 4. Single Choice (với image support)
```typescript
config: {
  choices: [
    { id: "choice1", text: "Option 1", imageUrl: "https://..." },
    { id: "choice2", text: "Option 2", imageUrl: "https://..." }
  ],
  allowOther: true
}
```

### 5. Multiple Choice
```typescript
config: {
  choices: [
    { id: "choice1", text: "Option 1" },
    { id: "choice2", text: "Option 2" }
  ],
  minSelect: 1,
  maxSelect: 3,
  allowOther: true
}
```

### 6. Ranking
```typescript
config: {
  items: [
    { id: "item1", text: "Item A" },
    { id: "item2", text: "Item B" }
  ],
  minRank: 3  // Bắt buộc rank ít nhất 3 items
}
```

### 7. Text Short
```typescript
config: {
  maxLength: 200,
  placeholder: "Nhập câu trả lời ngắn..."
}
```

### 8. Text Long
```typescript
config: {
  maxLength: 1000,
  placeholder: "Chia sẻ ý kiến của bạn...",
  minLength: 50
}
```

## Testing Migration

### Verify tables
```sql
SHOW TABLES LIKE 'survey_%';
```

Expected output:
```
survey_answers
survey_campaigns
survey_questions
survey_responses
```

### Verify trigger
```sql
SHOW TRIGGERS WHERE `Table` = 'survey_responses';
```

### Verify views
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SELECT * FROM v_campaign_stats LIMIT 1;
SELECT * FROM v_question_stats LIMIT 1;
```

### Test unique constraint
```sql
-- Nên thành công
INSERT INTO survey_responses (campaignId, userId, startedAt) 
VALUES (1, 100, NOW());

-- Nên FAIL với duplicate key error
INSERT INTO survey_responses (campaignId, userId, startedAt) 
VALUES (1, 100, NOW());
```

## Next Steps (Phase 2)

Phase 2 sẽ thêm:
- `survey_rewards` table cho reward configuration
- Logic tính điểm và phát thưởng
- Integration với loyalty system

Hiện tại các field sau chỉ mang tính thông tin, chưa dùng cho logic reward:
- `hasOptionalText`
- `totalTextLength`
- `estimatedCompletionTimeSeconds`

## Lưu ý quan trọng

1. **Soft Delete**: Tất cả entities đều có `deletedAt`, sử dụng TypeORM's soft delete
2. **Timestamps**: Sử dụng TypeORM decorators (`@CreateDateColumn`, `@UpdateDateColumn`)
3. **JSON Fields**: `config`, `answerValue`, `updateHistory` - store complex data
4. **Cascade Delete**: Foreign keys có `ON DELETE CASCADE`
5. **Trigger Timing**: Trigger chỉ chạy khi status chuyển từ non-completed → completed

## Troubleshooting

### Migration fails với foreign key error
Đảm bảo chạy theo thứ tự: campaigns → questions → responses → answers

### Trigger không hoạt động
Check MySQL delimiter settings và permissions:
```sql
SHOW GRANTS FOR CURRENT_USER();
```

### Entity import errors
Rebuild package sau khi update:
```bash
cd piggi-portal-database
yarn build
```

---

**Created**: 2026-04-28  
**Version**: Phase 1 (Survey only, no rewards)  
**Database Package**: @piggi-group/piggi-portal-database

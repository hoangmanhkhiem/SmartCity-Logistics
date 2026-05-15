# Survey Phase 1 - Quick Reference

## Enums

### QuestionType
```typescript
enum QuestionType {
    NPS = 'nps',                          // Net Promoter Score (0-10)
    RATING_SCALE = 'rating_scale',        // Star rating or scale (1-5)
    FEATURE_MATRIX = 'feature_matrix',    // Multiple features × scale
    SINGLE_CHOICE = 'single_choice',      // Radio buttons (with image support)
    MULTIPLE_CHOICE = 'multiple_choice',  // Checkboxes
    RANKING = 'ranking',                  // Drag & drop to rank
    TEXT_SHORT = 'text_short',            // Single line text
    TEXT_LONG = 'text_long',              // Multi-line text area
}
```

### ResponseStatus
```typescript
enum ResponseStatus {
    IN_PROGRESS = 'in_progress',  // User started but not completed
    COMPLETED = 'completed',      // User submitted survey
    ABANDONED = 'abandoned',      // User left without completing
}
```

## Repository Provider Constants

```typescript
'SURVEY_CAMPAIGN_REPOSITORY'  // SurveyCampaignEntity
'SURVEY_QUESTION_REPOSITORY'  // SurveyQuestionEntity
'SURVEY_RESPONSE_REPOSITORY'  // SurveyResponseEntity
'SURVEY_ANSWER_REPOSITORY'    // SurveyAnswerEntity
```

## Database Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `survey_campaigns` | Campaign info | title, startTime, endTime, published |
| `survey_questions` | Questions per campaign | questionText, questionType, config, displayOrder |
| `survey_responses` | User responses | userId, campaignId, status, completedAt |
| `survey_answers` | Individual answers | responseId, questionId, answerValue, optionalText |

## Important Indexes

### survey_campaigns
- `idx_published_time` (published, startTime, endTime)
- `idx_active` (published, endTime, deletedAt)
- `idx_deleted` (deletedAt)

### survey_questions
- `idx_campaign_order` (campaignId, displayOrder, deletedAt)
- `idx_deleted` (deletedAt)

### survey_responses
- **unique_user_campaign** (campaignId, userId) ← UNIQUE
- `idx_user_campaign` (userId, campaignId)
- `idx_campaign_status` (campaignId, status, deletedAt)
- `idx_completed` (campaignId, completedAt)
- `idx_deleted` (deletedAt)

### survey_answers
- **unique_response_question** (responseId, questionId) ← UNIQUE
- `idx_question` (questionId, deletedAt)
- `idx_response` (responseId)
- `idx_deleted` (deletedAt)

## Common Query Patterns

### Get active campaigns
```typescript
const campaigns = await campaignRepo.find({
  where: {
    published: true,
    startTime: LessThanOrEqual(new Date()),
    endTime: MoreThanOrEqual(new Date()),
    deletedAt: IsNull(),
  },
  order: { startTime: 'DESC' },
});
```

### Get campaign with questions
```typescript
const campaign = await campaignRepo.findOne({
  where: { id: campaignId },
  relations: ['questions'],
  order: { questions: { displayOrder: 'ASC' } },
});
```

### Check if user already responded
```typescript
const response = await responseRepo.findOne({
  where: {
    campaignId,
    userId,
    deletedAt: IsNull(),
  },
});

const hasResponded = !!response;
```

### Get user's response with answers
```typescript
const response = await responseRepo.findOne({
  where: { campaignId, userId },
  relations: ['answers', 'answers.question'],
});
```

### UPSERT answer (auto-save)
```typescript
// TypeORM way
const answer = await answerRepo.findOne({
  where: { responseId, questionId },
});

if (answer) {
  // Update
  await answerRepo.update(
    { responseId, questionId },
    { 
      answerValue: newValue,
      optionalText: newText,
      editCount: () => 'editCount + 1',
      completedAt: new Date(),
    }
  );
} else {
  // Insert
  await answerRepo.save({
    responseId,
    questionId,
    answerValue: newValue,
    optionalText: newText,
    completedAt: new Date(),
  });
}

// Or using raw SQL
await dataSource.query(`
  INSERT INTO survey_answers (responseId, questionId, answerValue, completedAt)
  VALUES (?, ?, ?, NOW())
  ON DUPLICATE KEY UPDATE
    answerValue = VALUES(answerValue),
    editCount = editCount + 1,
    completedAt = NOW()
`, [responseId, questionId, JSON.stringify(answerValue)]);
```

### Get campaign stats (using view)
```typescript
const stats = await dataSource.query(`
  SELECT * FROM v_campaign_stats
  WHERE campaign_id = ?
`, [campaignId]);
```

## Answer Value JSON Examples

### NPS
```json
{ "score": 8 }
```

### Rating Scale
```json
{ "rating": 4 }
```

### Single Choice
```json
{ 
  "choiceId": "choice2",
  "other": "Custom answer if allowOther" 
}
```

### Multiple Choice
```json
{ 
  "choiceIds": ["choice1", "choice3"],
  "other": "Custom if allowOther"
}
```

### Ranking
```json
{
  "ranking": [
    { "itemId": "item3", "rank": 1 },
    { "itemId": "item1", "rank": 2 },
    { "itemId": "item2", "rank": 3 }
  ]
}
```

### Feature Matrix
```json
{
  "ratings": {
    "feature1": 3,
    "feature2": 5,
    "feature3": 4
  }
}
```

### Text
```json
{ "text": "User's text response" }
```

## Trigger Behavior

**Trigger Name**: `after_update_response_metrics`

**When**: AFTER UPDATE on `survey_responses`

**Condition**: Status changed from non-completed to completed

**Actions**:
1. Updates `hasOptionalText` = true if any answer has optional text
2. Updates `totalTextLength` = sum of all optional text lengths

**Example**:
```typescript
// This triggers the auto-update
await responseRepo.update(
  { id: responseId },
  { 
    status: ResponseStatus.COMPLETED,
    completedAt: new Date(),
  }
);

// After update, hasOptionalText and totalTextLength are auto-calculated
```

## Views Available

### v_campaign_stats
```sql
SELECT * FROM v_campaign_stats WHERE campaign_id = ?;
```

**Columns**:
- campaign_id
- title
- start_time, end_time
- published
- total_responses
- completed_count
- completion_rate (%)
- avg_completion_seconds
- responses_with_text
- optional_text_rate (%)

### v_question_stats
```sql
SELECT * FROM v_question_stats WHERE campaign_id = ?;
```

**Columns**:
- question_id
- campaign_id
- question_type
- display_order
- total_answers
- answers_with_text
- avg_time_seconds

## Validation Rules

### Campaign Level
- `startTime` < `endTime`
- Cannot delete campaign with responses (soft delete instead)

### Response Level
- 1 user can only have 1 response per campaign (enforced by unique constraint)
- `completedAt` must be >= `startedAt` (enforced by CHECK constraint)

### Answer Level
- 1 response can only have 1 answer per question (enforced by unique constraint)
- Cannot answer deleted questions
- `answerValue` must be valid JSON

## Soft Delete Behavior

All entities use `deletedAt`:

```typescript
// Soft delete
await repo.softDelete({ id: entityId });
// or
entity.deletedAt = new Date();
await repo.save(entity);

// Restore
await repo.restore({ id: entityId });
// or
entity.deletedAt = null;
await repo.save(entity);

// Find with deleted
await repo.find({ withDeleted: true });

// Find only deleted
await repo.find({ 
  where: { deletedAt: Not(IsNull()) },
  withDeleted: true,
});
```

## Performance Tips

1. **Use indexes for queries**:
   - Filter by `published` + time range → uses `idx_published_time`
   - Lookup user's response → uses `idx_user_campaign`
   - Get campaign's responses → uses `idx_campaign_status`

2. **Use views for analytics**:
   - Don't calculate stats manually
   - Use `v_campaign_stats` and `v_question_stats`

3. **Batch operations**:
   ```typescript
   // Good - single query
   await answerRepo.save(answersArray);
   
   // Bad - multiple queries
   for (const answer of answersArray) {
     await answerRepo.save(answer);
   }
   ```

4. **Eager loading**:
   ```typescript
   // Load related data in one query
   const campaign = await campaignRepo.findOne({
     where: { id },
     relations: ['questions'],
   });
   ```

## Common Gotchas

1. **JSON fields**: TypeORM auto-serializes/deserializes, but raw queries need manual JSON.stringify/parse

2. **Enum values**: Use enum from entity, not strings
   ```typescript
   // Good
   status: ResponseStatus.COMPLETED
   
   // Bad
   status: 'completed'
   ```

3. **Unique constraint errors**: Handle duplicate user response gracefully
   ```typescript
   try {
     await responseRepo.save({ campaignId, userId, ... });
   } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
       // User already started this survey
       return existingResponse;
     }
     throw error;
   }
   ```

4. **Trigger updates**: Don't manually update `hasOptionalText` and `totalTextLength` when completing survey - let trigger handle it

5. **Cascade deletes**: Deleting campaign will delete all questions, responses, and answers - use with caution (prefer soft delete)

---

**Last Updated**: 2026-04-28  
**Version**: Phase 1

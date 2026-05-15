# Auto-save Implementation - Save từng câu ngay lập tức

## 1. API Endpoint

### POST `/api/surveys/:id/answers`

**Controller:**
```typescript
// src/modules/survey/controllers/survey-user.controller.ts

@Controller('api/surveys')
@UseGuards(JwtAuthGuard)
export class SurveyUserController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post(':campaignId/answers')
  async saveAnswers(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @GetUser() user: User,
    @Body() dto: SaveAnswersDto,
  ) {
    return this.surveyService.saveAnswers(user.id, campaignId, dto);
  }
}
```

**DTO:**
```typescript
// src/modules/survey/dto/save-answers.dto.ts

import { Type } from 'class-transformer';
import { IsInt, IsArray, ValidateNested, IsOptional, IsString, IsObject, IsDateString } from 'class-validator';

class AnswerItemDto {
  @IsInt()
  question_id: number;

  @IsObject()
  answer_value: any; // JSON object, structure depends on question_type

  @IsOptional()
  @IsString()
  optional_text?: string;

  @IsOptional()
  @IsDateString()
  started_at?: string;

  @IsDateString()
  completed_at: string;
}

export class SaveAnswersDto {
  @IsInt()
  response_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
```

---

## 2. Service Logic (UPSERT)

```typescript
// src/modules/survey/services/survey.service.ts

@Injectable()
export class SurveyService {
  constructor(
    @Inject('SURVEY_RESPONSES_REPOSITORY')
    private responseRepo: Repository<SurveyResponseEntity>,
    
    @Inject('SURVEY_ANSWERS_REPOSITORY')
    private answerRepo: Repository<SurveyAnswerEntity>,
    
    @Inject('SURVEY_QUESTIONS_REPOSITORY')
    private questionRepo: Repository<SurveyQuestionEntity>,
  ) {}

  async saveAnswers(userId: number, campaignId: number, dto: SaveAnswersDto) {
    // 1. Validate response belongs to user & is in_progress
    const response = await this.responseRepo.findOne({
      where: { 
        id: dto.response_id, 
        user_id: userId,
        campaign_id: campaignId,
        deleted_at: null 
      }
    });

    if (!response) {
      throw new BadRequestException('Response không tồn tại hoặc không thuộc về bạn');
    }

    // ❌ Block edit if already completed
    if (response.status === 'completed') {
      throw new BadRequestException('Survey đã hoàn thành. Không thể chỉnh sửa.');
    }

    // 2. Validate all questions belong to this campaign
    const questionIds = dto.answers.map(a => a.question_id);
    const validQuestions = await this.questionRepo.find({
      where: { 
        id: In(questionIds),
        campaign_id: campaignId,
        deleted_at: null 
      }
    });

    if (validQuestions.length !== questionIds.length) {
      throw new BadRequestException('Một số câu hỏi không hợp lệ');
    }

    // 3. UPSERT answers (INSERT or UPDATE)
    const savedAnswers = [];
    
    for (const answerDto of dto.answers) {
      // ✅ Try to find existing answer
      const existingAnswer = await this.answerRepo.findOne({
        where: {
          response_id: dto.response_id,
          question_id: answerDto.question_id,
          deleted_at: null
        }
      });

      if (existingAnswer) {
        // ✅ UPDATE existing answer
        const updateHistory = existingAnswer.update_history || [];
        updateHistory.push({
          timestamp: new Date().toISOString(),
          old_answer_value: existingAnswer.answer_value,
          old_optional_text: existingAnswer.optional_text
        });

        await this.answerRepo.update(existingAnswer.id, {
          answer_value: answerDto.answer_value,
          optional_text: answerDto.optional_text,
          optional_text_length: answerDto.optional_text?.length || 0,
          completed_at: new Date(answerDto.completed_at),
          time_spent_seconds: this.calculateTimeSpent(
            answerDto.started_at,
            answerDto.completed_at
          ),
          edit_count: existingAnswer.edit_count + 1,
          update_history: updateHistory,
          updated_at: new Date()
        });

        savedAnswers.push({ ...existingAnswer, updated: true });
        
      } else {
        // ✅ INSERT new answer
        const newAnswer = await this.answerRepo.save({
          response_id: dto.response_id,
          question_id: answerDto.question_id,
          answer_value: answerDto.answer_value,
          optional_text: answerDto.optional_text,
          optional_text_length: answerDto.optional_text?.length || 0,
          started_at: answerDto.started_at ? new Date(answerDto.started_at) : null,
          completed_at: new Date(answerDto.completed_at),
          time_spent_seconds: this.calculateTimeSpent(
            answerDto.started_at,
            answerDto.completed_at
          ),
          edit_count: 0,
          is_skipped: false
        });

        savedAnswers.push({ ...newAnswer, updated: false });
      }
    }

    // 4. Update response last activity
    await this.responseRepo.update(dto.response_id, {
      updated_at: new Date()
    });

    // 5. Calculate progress
    const progress = await this.calculateProgress(dto.response_id, campaignId);

    return {
      saved_count: savedAnswers.length,
      updated_count: savedAnswers.filter(a => a.updated).length,
      inserted_count: savedAnswers.filter(a => !a.updated).length,
      progress
    };
  }

  private calculateTimeSpent(startedAt: string | undefined, completedAt: string): number {
    if (!startedAt) return 0;
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    return Math.floor((end.getTime() - start.getTime()) / 1000); // seconds
  }

  private async calculateProgress(responseId: number, campaignId: number) {
    // Get all questions for this campaign
    const allQuestions = await this.questionRepo.find({
      where: { campaign_id: campaignId, deleted_at: null },
      select: ['id', 'is_required']
    });

    // Get answered questions
    const answeredQuestions = await this.answerRepo.find({
      where: { response_id: responseId, deleted_at: null },
      select: ['question_id']
    });

    const answeredQuestionIds = answeredQuestions.map(a => a.question_id);
    
    const totalQuestions = allQuestions.length;
    const answeredCount = answeredQuestions.length;
    
    const requiredQuestions = allQuestions.filter(q => q.is_required);
    const requiredAnswered = requiredQuestions.filter(q => 
      answeredQuestionIds.includes(q.id)
    ).length;
    
    const canComplete = requiredAnswered === requiredQuestions.length;

    return {
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      required_total: requiredQuestions.length,
      required_answered: requiredAnswered,
      required_remaining: requiredQuestions.length - requiredAnswered,
      completion_percentage: Math.round((answeredCount / totalQuestions) * 100),
      can_complete: canComplete
    };
  }
}
```

---

## 3. Alternative: MySQL UPSERT (INSERT ON DUPLICATE KEY)

**Nếu muốn performance cao hơn**, dùng raw query với `INSERT ... ON DUPLICATE KEY UPDATE`:

```typescript
async saveAnswers(userId: number, campaignId: number, dto: SaveAnswersDto) {
  // ... validation code same as above ...

  // Use transaction for atomic operation
  return await this.answerRepo.manager.transaction(async (transactionalEntityManager) => {
    for (const answerDto of dto.answers) {
      const timeSpent = this.calculateTimeSpent(answerDto.started_at, answerDto.completed_at);

      // ✅ UPSERT query (MySQL only)
      await transactionalEntityManager.query(`
        INSERT INTO survey_answers (
          response_id,
          question_id,
          answer_value,
          optional_text,
          optional_text_length,
          started_at,
          completed_at,
          time_spent_seconds,
          edit_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          answer_value = VALUES(answer_value),
          optional_text = VALUES(optional_text),
          optional_text_length = VALUES(optional_text_length),
          completed_at = VALUES(completed_at),
          time_spent_seconds = VALUES(time_spent_seconds),
          edit_count = edit_count + 1,
          update_history = JSON_ARRAY_APPEND(
            COALESCE(update_history, '[]'),
            '$',
            JSON_OBJECT(
              'timestamp', NOW(),
              'old_answer_value', answer_value,
              'old_optional_text', optional_text
            )
          ),
          updated_at = NOW()
      `, [
        dto.response_id,
        answerDto.question_id,
        JSON.stringify(answerDto.answer_value),
        answerDto.optional_text,
        answerDto.optional_text?.length || 0,
        answerDto.started_at ? new Date(answerDto.started_at) : null,
        new Date(answerDto.completed_at),
        timeSpent
      ]);
    }

    // Update response activity
    await transactionalEntityManager.update(
      SurveyResponseEntity,
      { id: dto.response_id },
      { updated_at: new Date() }
    );

    // Calculate progress
    const progress = await this.calculateProgress(dto.response_id, campaignId);
    
    return {
      saved_count: dto.answers.length,
      progress
    };
  });
}
```

---

## 4. Resume Logic (GET Survey Details)

**Khi user quay lại app**, API cần return:
1. Campaign info + questions
2. Existing response (nếu có)
3. Saved answers (để pre-fill UI)

```typescript
// GET /api/surveys/:id

async getSurveyDetails(userId: number, campaignId: number) {
  // 1. Get campaign
  const campaign = await this.campaignRepo.findOne({
    where: { 
      id: campaignId,
      published: true,
      deleted_at: null
    }
  });

  if (!campaign) {
    throw new NotFoundException('Survey không tồn tại');
  }

  // Check time
  const now = new Date();
  if (now < campaign.start_time || now > campaign.end_time) {
    throw new BadRequestException('Survey chưa mở hoặc đã đóng');
  }

  // 2. Get questions
  const questions = await this.questionRepo.find({
    where: { campaign_id: campaignId, deleted_at: null },
    order: { display_order: 'ASC' }
  });

  // 3. Check existing response
  const existingResponse = await this.responseRepo.findOne({
    where: { 
      campaign_id: campaignId,
      user_id: userId,
      deleted_at: null
    }
  });

  let savedAnswers = [];
  let userStatus = {
    has_response: false,
    status: null,
    can_start: true,
    can_resume: false,
    can_complete: false
  };

  if (existingResponse) {
    // User already started/completed this survey
    userStatus.has_response = true;
    userStatus.status = existingResponse.status;

    if (existingResponse.status === 'completed') {
      // ✅ User đã hoàn thành → Show completed view
      userStatus.can_start = false;
      userStatus.can_resume = false;
    } else if (existingResponse.status === 'in_progress') {
      // ✅ User đang làm dở → Resume
      userStatus.can_start = false;
      userStatus.can_resume = true;

      // Get saved answers để pre-fill
      savedAnswers = await this.answerRepo.find({
        where: { 
          response_id: existingResponse.id,
          deleted_at: null 
        }
      });

      // Check if can complete
      const progress = await this.calculateProgress(existingResponse.id, campaignId);
      userStatus.can_complete = progress.can_complete;
    }
  }

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      estimated_completion_time_seconds: campaign.estimated_completion_time_seconds,
      min_reward_points: campaign.min_reward_points,
      max_reward_points: campaign.max_reward_points
    },
    
    questions: questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      config: q.config,
      display_order: q.display_order,
      is_required: q.is_required,
      enable_optional_text: q.enable_optional_text,
      optional_text_placeholder: q.optional_text_placeholder
    })),

    // ✅ Existing response info (for resume)
    existing_response: existingResponse ? {
      response_id: existingResponse.id,
      status: existingResponse.status,
      started_at: existingResponse.started_at,
      completed_at: existingResponse.completed_at,
      
      // ✅ Saved answers (pre-fill UI)
      saved_answers: savedAnswers.map(a => ({
        question_id: a.question_id,
        answer_value: a.answer_value,
        optional_text: a.optional_text,
        completed_at: a.completed_at
      }))
    } : null,

    user_status: userStatus
  };
}
```

---

## 5. Mobile App Flow (Frontend)

```typescript
// ===================================
// 1. User mở survey lần đầu
// ===================================

async function openSurvey(campaignId: number) {
  const data = await GET(`/surveys/${campaignId}`);
  
  if (data.user_status.status === 'completed') {
    // Show completed view (read-only)
    navigateTo('SurveyCompletedScreen', { data });
    return;
  }

  if (data.user_status.can_resume) {
    // ✅ User đang làm dở → Show resume dialog
    showDialog({
      title: 'Tiếp tục làm survey?',
      message: `Bạn đã trả lời ${data.existing_response.saved_answers.length}/${data.questions.length} câu.`,
      buttons: [
        {
          text: 'Làm từ đầu',
          onPress: () => startFresh(campaignId)
        },
        {
          text: 'Tiếp tục',
          onPress: () => resumeSurvey(data)
        }
      ]
    });
    return;
  }

  // New survey → Start
  const response = await POST(`/surveys/${campaignId}/start`);
  navigateTo('SurveyQuestionScreen', { 
    campaignId,
    responseId: response.response_id,
    questions: data.questions,
    currentQuestionIndex: 0
  });
}

// ===================================
// 2. Resume existing survey
// ===================================

function resumeSurvey(data) {
  const savedAnswers = data.existing_response.saved_answers;
  const answeredQuestionIds = savedAnswers.map(a => a.question_id);
  
  // Pre-fill saved answers
  const questionsWithAnswers = data.questions.map(q => ({
    ...q,
    saved_answer: savedAnswers.find(a => a.question_id === q.id)
  }));

  // Find first unanswered question
  const firstUnansweredIndex = questionsWithAnswers.findIndex(
    q => !answeredQuestionIds.includes(q.id)
  );

  navigateTo('SurveyQuestionScreen', {
    campaignId: data.campaign.id,
    responseId: data.existing_response.response_id,
    questions: questionsWithAnswers,
    currentQuestionIndex: firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0
  });
}

// ===================================
// 3. User trả lời 1 câu → Auto-save
// ===================================

async function onAnswerQuestion(
  responseId: number,
  campaignId: number,
  question: Question,
  answerValue: any,
  optionalText?: string
) {
  // Show loading indicator
  setLoading(true);

  try {
    // ✅ Auto-save ngay lập tức
    const result = await POST(`/surveys/${campaignId}/answers`, {
      response_id: responseId,
      answers: [
        {
          question_id: question.id,
          answer_value: answerValue,
          optional_text: optionalText,
          started_at: questionStartTime.toISOString(),
          completed_at: new Date().toISOString()
        }
      ]
    });

    // Update progress bar
    updateProgress(result.progress);

    // Show success indicator (subtle)
    showToast('Đã lưu câu trả lời', { duration: 1000, type: 'success' });

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      goToNextQuestion();
    } else {
      // Last question → Show complete button
      showCompleteButton(result.progress.can_complete);
    }

  } catch (error) {
    // ❌ Save failed → Show retry
    showErrorDialog({
      title: 'Lỗi lưu câu trả lời',
      message: 'Vui lòng thử lại',
      buttons: [
        { text: 'Thử lại', onPress: () => onAnswerQuestion(...) },
        { text: 'Bỏ qua', onPress: () => goToNextQuestion() }
      ]
    });
  } finally {
    setLoading(false);
  }
}

// ===================================
// 4. User click "Hoàn thành"
// ===================================

async function onCompletesurvey(responseId: number, campaignId: number) {
  // Validate all required answered
  const progress = await GET(`/surveys/${campaignId}/progress?response_id=${responseId}`);
  
  if (!progress.can_complete) {
    showDialog({
      title: 'Chưa đủ câu trả lời',
      message: `Còn ${progress.required_remaining} câu bắt buộc chưa trả lời`,
      buttons: [{ text: 'OK' }]
    });
    return;
  }

  // Show confirmation
  const confirmed = await showConfirmDialog({
    title: 'Hoàn thành survey?',
    message: 'Bạn sẽ không thể chỉnh sửa sau khi gửi.',
    cancelable: true
  });

  if (!confirmed) return;

  try {
    const result = await POST(`/surveys/${campaignId}/complete`, {
      response_id: responseId
    });

    // Navigate to success screen
    navigateTo('SurveySuccessScreen', {
      reward: result.reward,
      summary: result.summary
    });

  } catch (error) {
    showErrorDialog({
      title: 'Lỗi',
      message: error.message
    });
  }
}
```

---

## 6. Edge Cases Handling

### Case 1: Network offline khi answer
```typescript
// Use local storage to queue answers
async function onAnswerQuestion(question, answerValue) {
  const answerData = {
    response_id: currentResponseId,
    question_id: question.id,
    answer_value: answerValue,
    timestamp: new Date().toISOString()
  };

  try {
    // Try to save to server
    await saveAnswer(answerData);
    
  } catch (error) {
    if (error.message === 'Network error') {
      // ✅ Save to local queue
      await saveToLocalQueue(answerData);
      showToast('Lưu tạm, sẽ đồng bộ khi có mạng');
      
      // Retry when back online
      onNetworkReconnect(() => syncLocalQueue());
    }
  }
}
```

### Case 2: User kill app giữa chừng
```typescript
// On app resume
async function onAppResume() {
  // Check if user has pending local answers
  const pendingAnswers = await getLocalQueue();
  
  if (pendingAnswers.length > 0) {
    // Sync to server
    await syncLocalQueue();
  }

  // Check if user was in the middle of a survey
  const activeResponseId = await getActiveResponseId();
  if (activeResponseId) {
    showDialog({
      title: 'Tiếp tục làm survey?',
      message: 'Bạn có survey đang làm dở',
      buttons: [
        { text: 'Bỏ qua' },
        { text: 'Tiếp tục', onPress: () => resumeActiveSurvey(activeResponseId) }
      ]
    });
  }
}
```

---

## Summary

### ✅ Benefits:
1. **No data loss**: User out app → data vẫn còn
2. **Resume anywhere**: User quay lại → tiếp tục từ câu đang làm dở
3. **Better UX**: Không bắt user phải làm hết 1 lúc
4. **Edit freely**: User có thể quay lại sửa câu trước (khi in_progress)

### 🔧 Implementation:
- API: POST /answers support **UPSERT** (insert or update)
- Save **mỗi câu** ngay khi user trả lời xong
- Resume logic: GET /surveys/:id return saved answers
- Mobile: Pre-fill saved answers, resume từ câu chưa trả lời

### ⚡ Performance:
- Use transaction để atomic
- Consider batching nếu user answer nhiều câu cùng lúc
- Cache progress calculation

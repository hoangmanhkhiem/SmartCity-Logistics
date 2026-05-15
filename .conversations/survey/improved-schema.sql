-- ===================================
-- IMPROVED SURVEY DATABASE SCHEMA
-- Phase 1: MVP with essential fixes
-- ===================================

-- 1. SURVEY CAMPAIGNS
-- Quản lý các chiến dịch khảo sát
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
    min_quality_score DECIMAL(5,2) DEFAULT 0 COMMENT 'Điểm chất lượng tối thiểu để nhận reward (0-100)',

    -- Publish status
    published BOOLEAN DEFAULT FALSE COMMENT 'TRUE = visible to users, FALSE = draft',

    -- Denormalized stats (cache for performance) - Phase 2
    total_started INT DEFAULT 0 COMMENT 'Tổng số responses đã bắt đầu',
    total_completed INT DEFAULT 0 COMMENT 'Tổng số responses đã hoàn thành',
    avg_quality_score DECIMAL(5,2) COMMENT 'Điểm chất lượng trung bình',
    last_stats_updated_at DATETIME COMMENT 'Lần cập nhật stats cuối',

    -- Soft delete (GDPR compliance)
    deleted_at DATETIME COMMENT 'Soft delete timestamp',

    -- Metadata
    created_by INT COMMENT 'Admin user ID',
    updated_by INT COMMENT 'Admin user ID who last updated',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_published_time (published, start_time, end_time),
    INDEX idx_active_campaigns (published, end_time, deleted_at),
    INDEX idx_deleted (deleted_at)

    -- Foreign keys sẽ thêm sau khi có admin_users table
    -- FOREIGN KEY (created_by) REFERENCES admin_users(id),
    -- FOREIGN KEY (updated_by) REFERENCES admin_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Quản lý các chiến dịch khảo sát';

-- ===================================

-- 2. SURVEY QUESTIONS
-- Lưu trữ các câu hỏi của từng campaign
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
    -- Validate JSON structure ở application level hoặc dùng CHECK constraint MySQL 8.0.16+
    config JSON NOT NULL COMMENT 'Type-specific config (see documentation for schemas)',

    -- Optional text input
    enable_optional_text BOOLEAN DEFAULT FALSE COMMENT 'Cho phép user nhập text giải thích thêm',
    optional_text_placeholder VARCHAR(255) DEFAULT 'Chia sẻ thêm (nếu có)...',

    -- Display & validation
    display_order INT NOT NULL COMMENT 'Thứ tự hiển thị câu hỏi (1, 2, 3...)',
    is_required BOOLEAN DEFAULT TRUE COMMENT 'Bắt buộc trả lời',

    -- Quality scoring weight (for phase 2)
    quality_weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Trọng số tính điểm chất lượng (0.50 - 2.00)',

    -- Soft delete
    deleted_at DATETIME,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_campaign_order (campaign_id, display_order, deleted_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Câu hỏi trong các campaign khảo sát';

-- ===================================

-- 3. SURVEY RESPONSES
-- Lưu response của user cho mỗi campaign
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'FK to piggi.users.id',
    attempt_number INT DEFAULT 1 COMMENT 'Lần thử thứ mấy (1, 2, 3... dựa vào max_attempts_per_user)',

    -- Timing
    started_at DATETIME NOT NULL COMMENT 'Thời điểm user mở survey lần đầu',
    completed_at DATETIME COMMENT 'Thời điểm user submit (NULL = chưa complete)',

    -- Status
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress' COMMENT 'abandoned = user không hoàn thành sau 24h',

    -- Quality metrics (calculated after completion)
    quality_score DECIMAL(5,2) COMMENT 'Overall quality score 0-100 (calculated)',
    has_optional_text BOOLEAN DEFAULT FALSE COMMENT 'Có ít nhất 1 optional text',
    total_text_length INT DEFAULT 0 COMMENT 'Tổng độ dài text responses',

    -- Spam detection
    is_suspicious BOOLEAN DEFAULT FALSE COMMENT 'Được đánh dấu nghi ngờ spam',
    suspicious_reasons JSON COMMENT 'Lý do nghi ngờ: ["too_fast", "repetitive_answers", "gibberish_text"]',

    -- Device & analytics
    user_agent TEXT COMMENT 'Device info for analytics',
    ip_address VARCHAR(45) COMMENT 'IP address (IPv4 hoặc IPv6)',
    app_version VARCHAR(20) COMMENT 'App version khi user làm survey',

    -- Soft delete
    deleted_at DATETIME,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Uncomment khi có users table

    -- FIX: Unique constraint đúng logic
    UNIQUE KEY unique_user_campaign_attempt (campaign_id, user_id, attempt_number),

    -- Indexes
    INDEX idx_user_campaign (user_id, campaign_id),
    INDEX idx_campaign_status (campaign_id, status, deleted_at),
    INDEX idx_completed (campaign_id, completed_at, quality_score),
    INDEX idx_suspicious (is_suspicious, campaign_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Responses của users cho các survey campaigns';

-- ===================================

-- 4. SURVEY ANSWERS
-- Lưu câu trả lời cho từng question
CREATE TABLE survey_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,
    question_id INT NOT NULL,

    -- Answer value (structure varies by question_type)
    -- Examples:
    -- NPS: {"score": 9}
    -- Feature Matrix: {"Trang chủ": 4, "Thông báo": 5, "Dạo deal": 0}
    -- Text: {"text": "User input here"}
    answer_value JSON NOT NULL,

    -- Optional text (available on all question types if enabled)
    optional_text TEXT COMMENT 'User explanation/reasoning',
    optional_text_length INT COMMENT 'Độ dài optional text (for quality scoring)',

    -- Timing per question
    started_at DATETIME COMMENT 'Thời điểm user bắt đầu câu hỏi này (nếu track được)',
    completed_at DATETIME NOT NULL COMMENT 'Thời điểm user trả lời xong câu này',
    time_spent_seconds INT COMMENT 'Thời gian trả lời câu này (seconds)',

    -- Edit tracking
    edit_count INT DEFAULT 0 COMMENT 'Số lần user sửa đổi câu trả lời',
    update_history JSON COMMENT 'Lịch sử sửa đổi: [{timestamp, old_answer_value, old_optional_text}]',

    -- Quality flags
    is_skipped BOOLEAN DEFAULT FALSE COMMENT 'User bỏ qua câu này (nếu not required)',

    -- Soft delete
    deleted_at DATETIME,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_question (response_id, question_id),

    -- Indexes
    INDEX idx_question_answers (question_id, deleted_at),
    INDEX idx_response (response_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Câu trả lời của users cho từng question';

-- ===================================

-- 5. SURVEY REWARDS (NEW - Critical for Phase 1)
-- Tracking điểm thưởng cho responses
CREATE TABLE survey_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,

    -- Reward calculation
    reward_type ENUM('base_reward', 'top_contributor') DEFAULT 'base_reward',
    points_awarded INT NOT NULL COMMENT 'Số điểm đã phát (30-100 for base, custom for top)',

    -- Quality scoring breakdown
    quality_score DECIMAL(5,2) COMMENT 'Overall quality score 0-100',
    quality_factors JSON COMMENT 'Chi tiết: {completion_time: 300, has_optional_text: true, text_quality: 85, consistency: 90}',
    calculation_method VARCHAR(50) DEFAULT 'auto' COMMENT 'auto | manual | bonus',

    -- Status tracking
    status ENUM('pending', 'calculated', 'awarded', 'rejected') DEFAULT 'pending',
    pending_reason TEXT COMMENT 'Lý do pending: chờ review, spam detected, etc.',
    calculated_at DATETIME COMMENT 'Thời điểm tính điểm',
    awarded_at DATETIME COMMENT 'Thời điểm phát điểm thành công vào loyalty_histories',

    -- Manual review (for top contributors or disputed cases)
    reviewed_by INT COMMENT 'Admin ID who reviewed',
    review_notes TEXT COMMENT 'Lý do adjust điểm, chọn top contributor, etc.',

    -- Top contributor rewards
    rank_position INT COMMENT 'Thứ hạng: 1, 2, 3... (NULL nếu không phải top)',
    voucher_id INT COMMENT 'FK to vouchers table (if applicable)',
    voucher_value INT COMMENT 'Giá trị voucher (VNĐ)',

    -- Spam/fraud detection
    is_spam BOOLEAN DEFAULT FALSE,
    spam_reasons JSON COMMENT 'Lý do spam: ["too_fast", "duplicate_ip", "repetitive_text"]',
    spam_checked_at DATETIME,
    spam_checked_by INT COMMENT 'Admin ID hoặc system (NULL)',

    -- Loyalty integration
    loyalty_history_id INT COMMENT 'FK to loyalty_histories.id khi đã ghi nhận điểm',

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_reward (response_id), -- Mỗi response chỉ 1 reward record

    -- Indexes
    INDEX idx_status (status, calculated_at),
    INDEX idx_reward_type (reward_type, rank_position),
    INDEX idx_spam (is_spam, spam_checked_at),
    INDEX idx_awarded (awarded_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracking phần thưởng cho survey responses';

-- ===================================
-- TRIGGERS & PROCEDURES (Optional - Phase 2)
-- ===================================

-- Trigger: Auto update attempt_number
DELIMITER $$
CREATE TRIGGER before_insert_survey_response
BEFORE INSERT ON survey_responses
FOR EACH ROW
BEGIN
    DECLARE next_attempt INT;

    -- Tìm attempt_number tiếp theo cho user + campaign
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt
    FROM survey_responses
    WHERE campaign_id = NEW.campaign_id AND user_id = NEW.user_id;

    SET NEW.attempt_number = next_attempt;
END$$
DELIMITER ;

-- ===================================

-- Trigger: Auto calculate quality metrics on response completion
DELIMITER $$
CREATE TRIGGER after_update_survey_response
AFTER UPDATE ON survey_responses
FOR EACH ROW
BEGIN
    -- Khi status chuyển sang 'completed', tính quality metrics
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE survey_responses sr
        SET
            has_optional_text = (
                SELECT COUNT(*) > 0
                FROM survey_answers sa
                WHERE sa.response_id = NEW.id AND sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0
            ),
            total_text_length = (
                SELECT COALESCE(SUM(CHAR_LENGTH(optional_text)), 0)
                FROM survey_answers
                WHERE response_id = NEW.id
            )
        WHERE sr.id = NEW.id;
    END IF;
END$$
DELIMITER ;

-- ===================================
-- SAMPLE VIEWS (Helper views cho analytics)
-- ===================================

-- View: Campaign performance summary
CREATE OR REPLACE VIEW v_campaign_performance AS
SELECT
    c.id as campaign_id,
    c.title,
    c.start_time,
    c.end_time,
    c.published,
    COUNT(DISTINCT sr.id) as total_responses,
    SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) as completed_responses,
    SUM(CASE WHEN sr.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_responses,
    ROUND(SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT sr.id), 0), 2) as completion_rate,
    AVG(CASE
        WHEN sr.status = 'completed'
        THEN TIMESTAMPDIFF(SECOND, sr.started_at, sr.completed_at)
    END) as avg_completion_seconds,
    AVG(sr.quality_score) as avg_quality_score,
    SUM(CASE WHEN sr.is_suspicious = TRUE THEN 1 ELSE 0 END) as suspicious_count
FROM survey_campaigns c
LEFT JOIN survey_responses sr ON c.id = sr.campaign_id AND sr.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- ===================================

-- View: Question response analytics
CREATE OR REPLACE VIEW v_question_analytics AS
SELECT
    q.id as question_id,
    q.campaign_id,
    q.question_text,
    q.question_type,
    q.display_order,
    COUNT(DISTINCT sa.response_id) as total_answers,
    SUM(CASE WHEN sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0 THEN 1 ELSE 0 END) as answers_with_optional_text,
    ROUND(SUM(CASE WHEN sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT sa.response_id), 0), 2) as optional_text_rate,
    AVG(sa.time_spent_seconds) as avg_time_spent_seconds,
    SUM(CASE WHEN sa.is_skipped = TRUE THEN 1 ELSE 0 END) as skip_count
FROM survey_questions q
LEFT JOIN survey_answers sa ON q.id = sa.question_id AND sa.deleted_at IS NULL
WHERE q.deleted_at IS NULL
GROUP BY q.id;

-- ===================================
-- JSON CONFIG EXAMPLES (Documentation)
-- ===================================

/*
-- NPS Question Config:
{
  "min": 0,
  "max": 10,
  "labels": {
    "0": "Không có khả năng",
    "10": "Chắc chắn giới thiệu"
  }
}

-- Feature Matrix Config:
{
  "features": [
    "Trang chủ (Feed)",
    "Thông báo",
    "Dạo deal"
  ],
  "scale": [
    {"value": 0, "label": "Chưa dùng"},
    {"value": 1, "label": "Rất tệ"},
    {"value": 5, "label": "Rất tốt"}
  ]
}

-- Ranking Config:
{
  "items": ["Item 1", "Item 2", "Item 3"],
  "max_selections": 3
}

-- Multiple Choice Config:
{
  "options": ["Option 1", "Option 2", "Option 3"],
  "allow_other": true,
  "allow_multiple": true
}
*/

-- ===================================
-- INDEXES FOR COMMON ANALYTICS QUERIES
-- ===================================

-- Composite index cho percentile queries (Phase 2 optimization)
CREATE INDEX idx_completed_time_quality ON survey_responses(campaign_id, completed_at, quality_score)
WHERE status = 'completed' AND deleted_at IS NULL;

-- Index cho reward distribution queries
CREATE INDEX idx_rewards_campaign_status ON survey_rewards(response_id, status, points_awarded);

-- ===================================
-- CONSTRAINTS VALIDATION (MySQL 8.0.16+)
-- ===================================

-- Validate JSON schema cho survey_questions.config (Optional, nếu dùng MySQL 8.0.16+)
-- ALTER TABLE survey_questions ADD CONSTRAINT check_config_json
--   CHECK (JSON_VALID(config) = 1);

-- Validate quality_score range
ALTER TABLE survey_responses
  ADD CONSTRAINT check_quality_score
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

ALTER TABLE survey_rewards
  ADD CONSTRAINT check_reward_quality_score
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

-- Validate time logic
ALTER TABLE survey_responses
  ADD CONSTRAINT check_completion_time
  CHECK (completed_at IS NULL OR completed_at >= started_at);

-- Validate points range
ALTER TABLE survey_campaigns
  ADD CONSTRAINT check_reward_points_range
  CHECK (min_reward_points >= 0 AND max_reward_points >= min_reward_points);

-- ===================================
-- END OF SCHEMA
-- ===================================

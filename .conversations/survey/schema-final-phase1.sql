-- ===================================
-- SURVEY DATABASE SCHEMA - PHASE 1 FINAL
-- Simplified: 1 attempt per user only
-- ===================================

-- 1. SURVEY CAMPAIGNS
CREATE TABLE survey_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Tên campaign: "Khảo sát trải nghiệm Q2 2026"',
    description TEXT COMMENT 'Mô tả campaign cho user',

    -- Time constraints
    start_time DATETIME NOT NULL COMMENT 'Thời điểm mở survey',
    end_time DATETIME NOT NULL COMMENT 'Thời điểm đóng survey',

    -- Reward config (dynamic calculation based on quality)
    min_reward_points INT DEFAULT 30 COMMENT 'Điểm tối thiểu (low quality)',
    max_reward_points INT DEFAULT 100 COMMENT 'Điểm tối đa (high quality)',

    -- Validation rules
    estimated_completion_time_seconds INT DEFAULT 300 COMMENT 'Thời gian ước tính (5 phút)',
    min_quality_score DECIMAL(5,2) DEFAULT 0 COMMENT 'Điểm chất lượng tối thiểu để nhận reward',

    -- Publish status
    published BOOLEAN DEFAULT FALSE COMMENT 'TRUE = visible to users, FALSE = draft',

    -- Soft delete (GDPR compliance)
    deleted_at DATETIME,

    -- Metadata
    created_by INT COMMENT 'Admin user ID',
    updated_by INT COMMENT 'Admin ID who last updated',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_published_time (published, start_time, end_time),
    INDEX idx_active_campaigns (published, end_time, deleted_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Quản lý các chiến dịch khảo sát - 1 user chỉ làm 1 lần/campaign';

-- ===================================

-- 2. SURVEY QUESTIONS
CREATE TABLE survey_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,

    -- Question content
    question_text TEXT NOT NULL COMMENT 'Nội dung câu hỏi',
    question_type ENUM(
        'nps',              -- Net Promoter Score (0-10)
        'rating_scale',     -- 1-10 rating
        'feature_matrix',   -- Grid of ratings
        'single_choice',    -- Radio buttons
        'multiple_choice',  -- Checkboxes
        'ranking',          -- Drag & drop ranking
        'text_short',       -- Single line input
        'text_long'         -- Paragraph textarea
    ) NOT NULL,

    -- Configuration (JSON structure varies by question_type)
    config JSON NOT NULL COMMENT 'Type-specific config',

    -- Optional text input
    enable_optional_text BOOLEAN DEFAULT FALSE,
    optional_text_placeholder VARCHAR(255) DEFAULT 'Chia sẻ thêm (nếu có)...',

    -- Display & validation
    display_order INT NOT NULL COMMENT 'Thứ tự hiển thị (1, 2, 3...)',
    is_required BOOLEAN DEFAULT TRUE,

    -- Quality scoring weight (Phase 2)
    quality_weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Trọng số cho quality scoring',

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
COMMENT='Câu hỏi trong surveys';

-- ===================================

-- 3. SURVEY RESPONSES
-- ✅ SIMPLIFIED: Mỗi user chỉ 1 response / campaign
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'FK to users.id',

    -- Timing
    started_at DATETIME NOT NULL COMMENT 'Thời điểm bắt đầu làm survey',
    completed_at DATETIME COMMENT 'Thời điểm submit (NULL = chưa complete)',

    -- Status
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',

    -- Quality metrics (auto-calculated after completion)
    quality_score DECIMAL(5,2) COMMENT 'Overall quality 0-100',
    has_optional_text BOOLEAN DEFAULT FALSE COMMENT 'Có ít nhất 1 optional text',
    total_text_length INT DEFAULT 0 COMMENT 'Tổng độ dài text responses',

    -- Spam detection
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reasons JSON COMMENT '["too_fast", "duplicate_ip", "repetitive_text"]',

    -- Device & analytics
    user_agent TEXT,
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6',
    app_version VARCHAR(20),

    -- Soft delete
    deleted_at DATETIME,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,

    -- ✅ SIMPLE: 1 user = 1 response per campaign
    UNIQUE KEY unique_user_campaign (campaign_id, user_id),

    -- Indexes
    INDEX idx_user_campaign (user_id, campaign_id),
    INDEX idx_campaign_status (campaign_id, status, deleted_at),
    INDEX idx_completed (campaign_id, completed_at, quality_score),
    INDEX idx_suspicious (is_suspicious, campaign_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Responses của users - 1 user chỉ 1 response/campaign';

-- ===================================

-- 4. SURVEY ANSWERS
CREATE TABLE survey_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,
    question_id INT NOT NULL,

    -- Answer value (structure varies by question_type)
    answer_value JSON NOT NULL,

    -- Optional text
    optional_text TEXT,
    optional_text_length INT COMMENT 'Độ dài optional text',

    -- Timing per question
    started_at DATETIME COMMENT 'Khi user bắt đầu câu này',
    completed_at DATETIME NOT NULL COMMENT 'Khi user hoàn thành câu này',
    time_spent_seconds INT COMMENT 'Thời gian trả lời',

    -- Edit tracking
    edit_count INT DEFAULT 0 COMMENT 'Số lần sửa đổi',
    update_history JSON COMMENT '[{timestamp, old_answer_value, old_optional_text}]',

    -- Quality flags
    is_skipped BOOLEAN DEFAULT FALSE COMMENT 'User bỏ qua (nếu not required)',

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
COMMENT='Câu trả lời cho từng question';

-- ===================================

-- 5. SURVEY REWARDS
-- Track phần thưởng cho responses
CREATE TABLE survey_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,

    -- Reward type
    reward_type ENUM('base_reward', 'top_contributor') DEFAULT 'base_reward',

    -- Points calculation
    points_awarded INT NOT NULL DEFAULT 0 COMMENT 'Số điểm đã/sẽ phát',

    -- Quality scoring breakdown
    quality_score DECIMAL(5,2) COMMENT 'Quality score 0-100 (same as response.quality_score)',
    quality_factors JSON COMMENT '{completion_time: 300, has_text: true, text_quality: 85}',
    calculation_method VARCHAR(50) DEFAULT 'auto' COMMENT 'auto | manual | bonus',

    -- Status tracking
    status ENUM('pending', 'calculated', 'awarded', 'rejected') DEFAULT 'pending',
    pending_reason TEXT COMMENT 'Lý do pending: chờ review, spam...',
    calculated_at DATETIME COMMENT 'Thời điểm tính điểm',
    awarded_at DATETIME COMMENT 'Thời điểm phát điểm vào loyalty_histories',

    -- Manual review
    reviewed_by INT COMMENT 'Admin ID',
    review_notes TEXT,

    -- Top contributor rewards
    rank_position INT COMMENT 'Rank: 1, 2, 3... (NULL = not top)',
    voucher_id INT COMMENT 'FK to vouchers (if applicable)',
    voucher_value INT COMMENT 'Giá trị voucher VNĐ',

    -- Spam detection
    is_spam BOOLEAN DEFAULT FALSE,
    spam_reasons JSON COMMENT '["too_fast", "duplicate_ip"]',
    spam_checked_at DATETIME,
    spam_checked_by INT COMMENT 'Admin ID or NULL (system)',

    -- Integration
    loyalty_history_id INT COMMENT 'FK to loyalty_histories khi đã phát điểm',

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_reward (response_id),

    -- Indexes
    INDEX idx_status (status, calculated_at),
    INDEX idx_reward_type (reward_type, rank_position),
    INDEX idx_spam (is_spam, spam_checked_at),
    INDEX idx_awarded (awarded_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracking phần thưởng cho survey responses';

-- ===================================
-- TRIGGERS
-- ===================================

-- Trigger: Auto update quality metrics when response completed
DELIMITER $$
CREATE TRIGGER after_update_survey_response_quality
AFTER UPDATE ON survey_responses
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculate has_optional_text & total_text_length
        UPDATE survey_responses sr
        SET
            has_optional_text = (
                SELECT COUNT(*) > 0
                FROM survey_answers sa
                WHERE sa.response_id = NEW.id
                  AND sa.optional_text IS NOT NULL
                  AND LENGTH(sa.optional_text) > 0
                  AND sa.deleted_at IS NULL
            ),
            total_text_length = (
                SELECT COALESCE(SUM(optional_text_length), 0)
                FROM survey_answers
                WHERE response_id = NEW.id AND deleted_at IS NULL
            )
        WHERE sr.id = NEW.id;
    END IF;
END$$
DELIMITER ;

-- ===================================
-- VIEWS
-- ===================================

-- View: Campaign performance summary
CREATE OR REPLACE VIEW v_campaign_performance AS
SELECT
    c.id as campaign_id,
    c.title,
    c.start_time,
    c.end_time,
    c.published,

    -- Response stats
    COUNT(DISTINCT sr.id) as total_responses,
    SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN sr.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,

    -- Completion rate
    ROUND(
        SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(DISTINCT sr.id), 0),
        2
    ) as completion_rate,

    -- Timing
    AVG(CASE
        WHEN sr.status = 'completed'
        THEN TIMESTAMPDIFF(SECOND, sr.started_at, sr.completed_at)
    END) as avg_completion_seconds,

    -- Quality
    AVG(sr.quality_score) as avg_quality_score,
    SUM(CASE WHEN sr.is_suspicious = TRUE THEN 1 ELSE 0 END) as suspicious_count,

    -- Rewards
    SUM(CASE
        WHEN srw.status = 'awarded'
        THEN srw.points_awarded
        ELSE 0
    END) as total_points_awarded

FROM survey_campaigns c
LEFT JOIN survey_responses sr ON c.id = sr.campaign_id AND sr.deleted_at IS NULL
LEFT JOIN survey_rewards srw ON sr.id = srw.response_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- ===================================

-- View: Question analytics
CREATE OR REPLACE VIEW v_question_analytics AS
SELECT
    q.id as question_id,
    q.campaign_id,
    q.question_text,
    q.question_type,
    q.display_order,

    -- Answer stats
    COUNT(DISTINCT sa.response_id) as total_answers,
    SUM(CASE
        WHEN sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0
        THEN 1 ELSE 0
    END) as answers_with_text,

    ROUND(
        SUM(CASE
            WHEN sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0
            THEN 1 ELSE 0
        END) * 100.0 / NULLIF(COUNT(DISTINCT sa.response_id), 0),
        2
    ) as optional_text_rate,

    -- Timing
    AVG(sa.time_spent_seconds) as avg_time_spent_seconds,

    -- Skip rate
    SUM(CASE WHEN sa.is_skipped = TRUE THEN 1 ELSE 0 END) as skip_count

FROM survey_questions q
LEFT JOIN survey_answers sa ON q.id = sa.question_id AND sa.deleted_at IS NULL
WHERE q.deleted_at IS NULL
GROUP BY q.id;

-- ===================================
-- STORED PROCEDURES
-- ===================================

-- Procedure: Calculate quality score (Phase 2 - placeholder)
DELIMITER $$
CREATE PROCEDURE sp_calculate_quality_score(IN p_response_id INT)
BEGIN
    DECLARE v_completion_time INT;
    DECLARE v_has_text BOOLEAN;
    DECLARE v_text_length INT;
    DECLARE v_quality_score DECIMAL(5,2);

    -- Get response metrics
    SELECT
        TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
        has_optional_text,
        total_text_length
    INTO v_completion_time, v_has_text, v_text_length
    FROM survey_responses
    WHERE id = p_response_id;

    -- Simple quality calculation (Phase 1 placeholder)
    -- TODO: Implement proper scoring algorithm in Phase 2
    SET v_quality_score = 50; -- Base score

    -- Bonus for completion time (4-7 minutes ideal)
    IF v_completion_time BETWEEN 240 AND 420 THEN
        SET v_quality_score = v_quality_score + 20;
    ELSEIF v_completion_time >= 180 THEN
        SET v_quality_score = v_quality_score + 10;
    END IF;

    -- Bonus for optional text
    IF v_has_text THEN
        SET v_quality_score = v_quality_score + 20;

        -- Extra bonus for good text length
        IF v_text_length > 100 THEN
            SET v_quality_score = v_quality_score + 10;
        END IF;
    END IF;

    -- Cap at 100
    IF v_quality_score > 100 THEN
        SET v_quality_score = 100;
    END IF;

    -- Update response
    UPDATE survey_responses
    SET quality_score = v_quality_score
    WHERE id = p_response_id;

    -- Return score
    SELECT v_quality_score as calculated_quality_score;
END$$
DELIMITER ;

-- ===================================

-- Procedure: Award points based on quality score
DELIMITER $$
CREATE PROCEDURE sp_award_base_reward(IN p_response_id INT)
BEGIN
    DECLARE v_quality_score DECIMAL(5,2);
    DECLARE v_campaign_id INT;
    DECLARE v_min_points INT;
    DECLARE v_max_points INT;
    DECLARE v_points_awarded INT;

    -- Get response quality & campaign config
    SELECT
        sr.quality_score,
        sr.campaign_id,
        sc.min_reward_points,
        sc.max_reward_points
    INTO v_quality_score, v_campaign_id, v_min_points, v_max_points
    FROM survey_responses sr
    JOIN survey_campaigns sc ON sr.campaign_id = sc.id
    WHERE sr.id = p_response_id;

    -- Calculate points (linear mapping)
    SET v_points_awarded = v_min_points + ROUND((v_quality_score / 100) * (v_max_points - v_min_points));

    -- Update reward record
    UPDATE survey_rewards
    SET
        points_awarded = v_points_awarded,
        quality_score = v_quality_score,
        status = 'calculated',
        calculated_at = NOW()
    WHERE response_id = p_response_id;

    SELECT v_points_awarded as points_to_award;
END$$
DELIMITER ;

-- ===================================
-- CONSTRAINTS
-- ===================================

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

-- Validate reward points range
ALTER TABLE survey_campaigns
  ADD CONSTRAINT check_reward_points_range
  CHECK (min_reward_points >= 0 AND max_reward_points >= min_reward_points);

-- ===================================
-- INDEXES FOR ANALYTICS QUERIES
-- ===================================

-- Percentile queries optimization
CREATE INDEX idx_response_timing ON survey_responses(
    campaign_id,
    status,
    completed_at
) WHERE status = 'completed' AND deleted_at IS NULL;

-- ===================================
-- HELPER FUNCTIONS (MySQL 8.0+)
-- ===================================

-- Function: Get percentile completion time
DELIMITER $$
CREATE FUNCTION fn_get_percentile_time(
    p_campaign_id INT,
    p_percentile DECIMAL(3,2)
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_result INT;

    SELECT completion_time INTO v_result
    FROM (
        SELECT
            TIMESTAMPDIFF(SECOND, started_at, completed_at) as completion_time,
            PERCENT_RANK() OVER (ORDER BY TIMESTAMPDIFF(SECOND, started_at, completed_at)) as pct
        FROM survey_responses
        WHERE campaign_id = p_campaign_id
          AND status = 'completed'
          AND deleted_at IS NULL
    ) t
    WHERE pct >= p_percentile
    ORDER BY pct
    LIMIT 1;

    RETURN v_result;
END$$
DELIMITER ;

-- Usage: SELECT fn_get_percentile_time(1, 0.80) as p80_time;

-- ===================================
-- END OF SCHEMA
-- ===================================

-- ===================================
-- SAMPLE DATA (For testing)
-- ===================================

-- Insert sample campaign
INSERT INTO survey_campaigns (title, description, start_time, end_time, published, created_by)
VALUES (
    'Khảo sát trải nghiệm Nô Tì Q2 2026',
    'Giúp chúng tôi hiểu rõ hơn về trải nghiệm của bạn với Nô Tì',
    '2026-04-01 00:00:00',
    '2026-04-30 23:59:59',
    TRUE,
    1
);

-- Note: Sample questions, responses, answers sẽ được insert qua seeder scripts

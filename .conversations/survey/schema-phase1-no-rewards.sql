-- ===================================
-- SURVEY DATABASE SCHEMA - PHASE 1
-- Survey Only (NO Rewards)
-- ===================================

-- 1. SURVEY CAMPAIGNS
CREATE TABLE survey_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Tên campaign',
    description TEXT COMMENT 'Mô tả cho user',

    -- Time constraints
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,

    -- Metadata (informational only - NO reward logic)
    estimated_completion_time_seconds INT DEFAULT 300,

    -- Publish status
    published BOOLEAN DEFAULT FALSE,

    -- Soft delete
    deleted_at DATETIME,

    -- Audit
    created_by INT COMMENT 'Admin user ID',
    updated_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_published_time (published, start_time, end_time),
    INDEX idx_active (published, end_time, deleted_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================

-- 2. SURVEY QUESTIONS
CREATE TABLE survey_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,

    question_text TEXT NOT NULL,
    question_type ENUM(
        'nps',
        'rating_scale',
        'feature_matrix',
        'single_choice',
        'multiple_choice',
        'ranking',
        'text_short',
        'text_long'
    ) NOT NULL,

    config JSON NOT NULL COMMENT 'Type-specific config',

    -- Optional text
    enable_optional_text BOOLEAN DEFAULT FALSE,
    optional_text_placeholder VARCHAR(255) DEFAULT 'Chia sẻ thêm (nếu có)...',

    -- Display
    display_order INT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,

    -- Soft delete
    deleted_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,
    INDEX idx_campaign_order (campaign_id, display_order, deleted_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================

-- 3. SURVEY RESPONSES
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,

    -- Timing
    started_at DATETIME NOT NULL,
    completed_at DATETIME,

    -- Status
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',

    -- Basic metrics (for analytics, NOT for reward calculation)
    has_optional_text BOOLEAN DEFAULT FALSE COMMENT 'Có ít nhất 1 optional text',
    total_text_length INT DEFAULT 0 COMMENT 'Tổng độ dài text',

    -- Device info (for analytics)
    user_agent TEXT,
    ip_address VARCHAR(45),
    app_version VARCHAR(20),

    -- Soft delete
    deleted_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (campaign_id) REFERENCES survey_campaigns(id) ON DELETE CASCADE,

    -- 1 user = 1 response per campaign
    UNIQUE KEY unique_user_campaign (campaign_id, user_id),

    INDEX idx_user_campaign (user_id, campaign_id),
    INDEX idx_campaign_status (campaign_id, status, deleted_at),
    INDEX idx_completed (campaign_id, completed_at),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='User responses - NO reward tracking in Phase 1';

-- ===================================

-- 4. SURVEY ANSWERS
CREATE TABLE survey_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,
    question_id INT NOT NULL,

    -- Answer data
    answer_value JSON NOT NULL,
    optional_text TEXT,
    optional_text_length INT,

    -- Timing
    started_at DATETIME,
    completed_at DATETIME NOT NULL,
    time_spent_seconds INT,

    -- Edit tracking
    edit_count INT DEFAULT 0,
    update_history JSON,

    is_skipped BOOLEAN DEFAULT FALSE,

    deleted_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_question (response_id, question_id),

    INDEX idx_question (question_id, deleted_at),
    INDEX idx_response (response_id),
    INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================
-- TRIGGERS
-- ===================================

-- Auto update basic metrics
DELIMITER $$
CREATE TRIGGER after_update_response_metrics
AFTER UPDATE ON survey_responses
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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
-- VIEWS (Analytics)
-- ===================================

-- Campaign stats
CREATE OR REPLACE VIEW v_campaign_stats AS
SELECT
    c.id as campaign_id,
    c.title,
    c.start_time,
    c.end_time,
    c.published,

    COUNT(DISTINCT sr.id) as total_responses,
    SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) as completed_count,

    ROUND(
        SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(DISTINCT sr.id), 0),
        2
    ) as completion_rate,

    AVG(CASE
        WHEN sr.status = 'completed'
        THEN TIMESTAMPDIFF(SECOND, sr.started_at, sr.completed_at)
    END) as avg_completion_seconds,

    SUM(CASE WHEN sr.has_optional_text = TRUE THEN 1 ELSE 0 END) as responses_with_text,

    ROUND(
        SUM(CASE WHEN sr.has_optional_text = TRUE THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END), 0),
        2
    ) as optional_text_rate

FROM survey_campaigns c
LEFT JOIN survey_responses sr ON c.id = sr.campaign_id AND sr.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- ===================================

-- Question stats
CREATE OR REPLACE VIEW v_question_stats AS
SELECT
    q.id as question_id,
    q.campaign_id,
    q.question_type,
    q.display_order,

    COUNT(DISTINCT sa.response_id) as total_answers,
    SUM(CASE
        WHEN sa.optional_text IS NOT NULL AND LENGTH(sa.optional_text) > 0
        THEN 1 ELSE 0
    END) as answers_with_text,

    AVG(sa.time_spent_seconds) as avg_time_seconds

FROM survey_questions q
LEFT JOIN survey_answers sa ON q.id = sa.question_id AND sa.deleted_at IS NULL
WHERE q.deleted_at IS NULL
GROUP BY q.id;

-- ===================================
-- CONSTRAINTS
-- ===================================

ALTER TABLE survey_responses
  ADD CONSTRAINT check_completion_time
  CHECK (completed_at IS NULL OR completed_at >= started_at);

-- ===================================
-- SAMPLE DATA
-- ===================================

INSERT INTO survey_campaigns (title, description, start_time, end_time, published, created_by)
VALUES (
    'Khảo sát trải nghiệm Nô Tì Q2 2026',
    'Giúp chúng tôi hiểu rõ hơn về trải nghiệm của bạn',
    '2026-04-01 00:00:00',
    '2026-04-30 23:59:59',
    TRUE,
    1
);

-- ===================================
-- END
-- ===================================

-- 创建数据库表
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    mode VARCHAR(50) NOT NULL,
    position VARCHAR(10) NOT NULL,
    stack INTEGER NOT NULL,
    pot INTEGER NOT NULL,
    action_history TEXT[],
    board TEXT[],
    hole_cards TEXT[],
    ref_solution JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    question_id INTEGER REFERENCES questions(id),
    user_action VARCHAR(50) NOT NULL,
    is_correct BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些测试数据
INSERT INTO questions (mode, position, stack, pot, action_history, board, hole_cards, ref_solution) VALUES
('综合练习', 'BTN', 100, 15, ARRAY['UTG raise 3bb', 'fold', 'fold'], ARRAY[]::TEXT[], ARRAY['As', 'Kh'], '{"call": 40, "raise": 60}'),
('价值练习', 'CO', 80, 20, ARRAY['UTG raise 3bb', 'fold'], ARRAY[]::TEXT[], ARRAY['AA', 'KK'], '{"call": 20, "raise": 80}'),
('Bluff练习', 'BTN', 120, 25, ARRAY['UTG raise 3bb', 'fold', 'fold'], ARRAY[]::TEXT[], ARRAY['72o'], '{"fold": 100}');

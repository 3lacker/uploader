-- Insert a test user (password: "password123" hashed with bcrypt)
INSERT INTO "users" ("id", "email", "username", "password", "createdAt", "updatedAt")
VALUES (
    'test-user-id',
    'test@example.com',
    'testuser',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

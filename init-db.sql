-- Initialize database with extensions and initial setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Sequelize, but we can add additional ones here if needed

-- Create a function to clean up old notifications (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM birthday_notifications 
    WHERE scheduled_date < NOW() - INTERVAL '1 year' 
    AND status IN ('sent', 'failed');
END;
$$ LANGUAGE plpgsql;

-- Create a function to get birthday statistics
CREATE OR REPLACE FUNCTION get_birthday_stats()
RETURNS TABLE(
    total_users bigint,
    pending_notifications bigint,
    sent_notifications bigint,
    failed_notifications bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM birthday_notifications WHERE status = 'pending') as pending_notifications,
        (SELECT COUNT(*) FROM birthday_notifications WHERE status = 'sent') as sent_notifications,
        (SELECT COUNT(*) FROM birthday_notifications WHERE status = 'failed') as failed_notifications;
END;
$$ LANGUAGE plpgsql;

-- Cron Job: cleanup-tracks
-- Scheduled job that runs automatically at specified intervals
-- Schedule: 0 3 * * *
-- Command:  select delete_expired_tracks() 

SELECT cron.schedule('cleanup-tracks', '0 3 * * *', ' select delete_expired_tracks() ');

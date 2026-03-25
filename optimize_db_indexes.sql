-- Optimizing Database Performance with Indexes

-- Projects Table
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON "Project" (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON "Project" (created_at DESC);

-- Profiles Table
-- users.id is usually indexed by default as PK, but ensure profiles.id is too
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- Evaluations / Ratings
-- Assuming table name is 'evaluations' or similar based on previous context. 
-- Finding exact table names from typical usage: 'ProjectRating' or 'evaluations'
CREATE INDEX IF NOT EXISTS idx_project_ratings_project_id ON "ProjectRating" (project_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_user_id ON "ProjectRating" (user_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_guest_id ON "ProjectRating" (guest_id);

-- Likes
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON "Like" (project_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON "Like" (user_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON "Comment" (project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON "Comment" (user_id);

-- Collections
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON "Collection" (user_id);

-- Collection Items
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON "CollectionItem" (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_project_id ON "CollectionItem" (project_id);

-- Proposals
CREATE INDEX IF NOT EXISTS idx_proposals_sender_id ON "Proposal" (sender_id);
CREATE INDEX IF NOT EXISTS idx_proposals_receiver_id ON "Proposal" (receiver_id);

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON "Follow" (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON "Follow" (following_id);

-- Audit/Visit Logs
CREATE INDEX IF NOT EXISTS idx_visit_logs_project_id ON visit_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_visitor_id ON visit_logs (visitor_id);

-- Optimize Project Listing Query
-- Often sorts by created_at or joins with user
CREATE INDEX IF NOT EXISTS idx_projects_visibility_created ON "Project" (visibility, created_at DESC);

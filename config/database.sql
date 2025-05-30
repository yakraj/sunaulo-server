CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  userid VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(50),
  mobile VARCHAR(20) UNIQUE,
  avatar_url TEXT,
  gained_stars INT DEFAULT 0,
  claimed_stars INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOMETRY(Point, 4326),
  country VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE
);
CREATE TABLE CREDIANTIALS (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
);
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id VARCHAR(100) NOT NULL REFERENCES users(username),
  receiver_id VARCHAR(100) NOT NULL REFERENCES users(username),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);


CREATE TABLE posts (
  id SERIAL PRIMARY KEY,    
  post_id VARCHAR(255),
  user_id VARCHAR(100) NOT NULL REFERENCES users(username),
  post_description TEXT,
  description_devanagari TEXT,
  price NUMERIC(12,2) NOT NULL,
  post_status VARCHAR(50) DEFAULT 'active',
  date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  images TEXT[], -- Array of image URLs
  geoloc geometry(Point, 4326), -- PostGIS geolocation
  category_id INT,
  is_featured BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP,
  expires_at TIMESTAMP,
  contact_info VARCHAR(255),
  tags TEXT[],
  condition VARCHAR(50),
  negotiable BOOLEAN DEFAULT FALSE,
  UNIQUE(adid, user_id) 
);

  CREATE TABLE post_featured (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) REFERENCES posts(post_id),
    featured_from TIMESTAMP,
    featured_until TIMESTAMP,
    stars_spent INT,
    created_by VARCHAR(100) REFERENCES users(username)
  );

CREATE TABLE productviews (
  id SERIAL PRIMARY KEY,
  adid VARCHAR(255) REFERENCES posts(post_id),
  user_id VARCHAR(100) REFERENCES users(username),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(adid, user_id) -- Prevent duplicate views from same user
);

CREATE TABLE productlikes (
  id SERIAL PRIMARY KEY,
  adid VARCHAR(255) REFERENCES posts(post_id),
  user_id VARCHAR(100) REFERENCES users(username),
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(adid, user_id) -- Prevent duplicate likes from same user
);

-- Add indexes for better performance
CREATE INDEX idx_productviews_adid ON productviews(adid);
CREATE INDEX idx_productviews_user_id ON productviews(user_id);
CREATE INDEX idx_productlikes_adid ON productlikes(adid);
CREATE INDEX idx_productlikes_user_id ON productlikes(user_id);

-- Add view count to posts table
ALTER TABLE posts ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN like_count INT DEFAULT 0;
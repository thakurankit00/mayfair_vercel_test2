-- Mayfair Hotel Management System - Database Setup
-- This script sets up the database, user, and basic configuration

-- Create the database
CREATE DATABASE mayfair_hotel_db WITH 
    ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

-- Create the application user
CREATE USER mayfair_user WITH PASSWORD '12345678';

-- Grant permissions to the user
GRANT CONNECT ON DATABASE mayfair_hotel_db TO mayfair_user;
GRANT USAGE ON SCHEMA public TO mayfair_user;
GRANT CREATE ON SCHEMA public TO mayfair_user;
GRANT ALL PRIVILEGES ON DATABASE mayfair_hotel_db TO mayfair_user;

-- Connect to the new database to set up additional permissions
\c mayfair_hotel_db

-- Grant permissions on the public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO mayfair_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mayfair_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mayfair_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO mayfair_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO mayfair_user;

-- Create extensions we'll need
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Display success message
\echo 'Database setup completed successfully!'
\echo 'Database: mayfair_hotel_db'
\echo 'User: mayfair_user'
\echo 'Password: 12345678'

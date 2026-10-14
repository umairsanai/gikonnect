CREATE TYPE ROLE_TYPE AS ENUM ('ALUMNUS', 'STUDENT');
CREATE TYPE REQUEST_STATUS_TYPE AS ENUM ('PENDING', 'CANCELED', 'ACCEPTED');
CREATE TYPE EDUCATION_LEVEL_TYPE AS ENUM ('DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD');

CREATE TABLE societies (
    society_id SERIAL PRIMARY KEY,
    society_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(255) NOT NULL UNIQUE,
    dept_dean VARCHAR(255),
    dept_hod VARCHAR(255),
    cover_url TEXT
);

CREATE TABLE countries (
    country_id SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL UNIQUE
);

CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    city_name TEXT NOT NULL UNIQUE,
    country_id INT NOT NULL,

    CONSTRAINT fkey_cities_countries FOREIGN KEY (country_id) REFERENCES countries(country_id) ON UPDATE CASCADE ON DELETE RESTRICT   
);

CREATE TABLE universities (
    university_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city_id INT NOT NULL,

    CONSTRAINT fkey_universities_cities FOREIGN KEY (city_id) REFERENCES cities(city_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE study_fields (
    field_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profile_url TEXT,
    headline VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    password_changed_at BIGINT DEFAULT 0 CHECK(password_changed_at >= 0),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    about TEXT,
    role ROLE_TYPE NOT NULL,
    department_id INT NOT NULL,
    gpa NUMERIC(3, 2),
    graduation_year INT NOT NULL,
    reset_password_token VARCHAR(100),
    reset_password_expiry TIMESTAMP,

    CONSTRAINT fkey_users_departments FOREIGN KEY(department_id) REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_links (
    user_id INT NOT NULL,
    link_id SERIAL PRIMARY KEY,
    link_title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    
    CONSTRAINT fkey_users_userlinks FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_societies (
    user_id INT NOT NULL,
    society_id INT NOT NULL,
    role_title VARCHAR(255),

    PRIMARY KEY (user_id, society_id),
    CONSTRAINT fkey_usersocieties_users FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fkey_usersocieties_societies FOREIGN KEY(society_id) REFERENCES societies(society_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_experiences (
    user_id INT NOT NULL,
    experience_id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    city_id INT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,

    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fkey_users_userexperiences FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fkey_userexperiences_cities FOREIGN KEY (city_id) REFERENCES cities(city_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE user_education (
    user_id INT NOT NULL,
    education_id SERIAL PRIMARY KEY,
    degree_title VARCHAR(100) NOT NULL,
    university_id INT NOT NULL,
    field_id INT NOT NULL,
    education_level EDUCATION_LEVEL_TYPE NOT NULL,
    grade VARCHAR(10) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    
    UNIQUE (user_id, degree_title, university_id, start_date),
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fkey_users_usereducation FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fkey_user_education_study_fields FOREIGN KEY (field_id) REFERENCES study_fields(field_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fkey_universities_usereducation FOREIGN KEY(university_id) REFERENCES universities(university_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_skills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT fkey_userskills_users FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fkey_userskills_skills FOREIGN KEY(skill_id) REFERENCES skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE user_projects (
    user_id INT NOT NULL,
    project_id SERIAL PRIMARY KEY,
    project_title VARCHAR(100) NOT NULL UNIQUE,
    project_description TEXT,
    project_url TEXT,

    CONSTRAINT fkey_users_userprojects FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_project_skills (
    project_id INT NOT NULL,
    skill_id INT NOT NULL,

    PRIMARY KEY (project_id, skill_id),
    CONSTRAINT fkey_skills_userprojectskills FOREIGN KEY(skill_id) REFERENCES skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fkey_userprojects_userprojectskills FOREIGN KEY(project_id) REFERENCES user_projects(project_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_connections (
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    connected_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, connected_user_id),
    CONSTRAINT chk_no_self_connection CHECK (user_id <> connected_user_id)
);

CREATE TABLE connection_requests (
    request_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    request_status REQUEST_STATUS_TYPE NOT NULL DEFAULT 'PENDING',
    intent VARCHAR(50),
    request_description VARCHAR(250),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_no_self_request CHECK (sender_id <> recipient_id),
    CONSTRAINT uq_pending_request UNIQUE (sender_id, recipient_id)
);

CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chat_message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_read INT NOT NULL DEFAULT 0,
    
    CONSTRAINT chk_no_self_chat CHECK (sender_id <> recipient_id)
);

CREATE TABLE email_verification_tokens (
    user_id INT,
    verification_token VARCHAR(100),

    PRIMARY KEY (user_id, verification_token),
    CONSTRAINT fkey_email_verification_tokens_users FOREIGN KEY(user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);
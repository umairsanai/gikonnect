import pool from "../database.js";
import { AppError, handleAsyncError } from "../error.js";
import { isInteger, isString, userTypes } from "../helpers.js";
import { Request, Response, NextFunction } from "express";

export const getMe = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    let user_id = req.user.user_id;
    let user = await (req.user.role === "ALUMNUS" ? fetchAlumnusProfile(user_id) : fetchStudentProfile(user_id));

    res.status(200).json({
        status: "success",
        data: user
    });
});

// TODO:
export const getConnections = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    res.status(200).json({
        status: "success"
    });
});

// TODO: Complete this route!
export const updateProfile = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    res.status(200).json({
        status: "success"
    });
});
// TODO: Complete this route!
export const updateProfilePicture = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    
    res.status(200).json({
        status: "success"
    });
});


export const addEducation = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);
    
    const { degree_title, university_id, field_id, education_level, grade, description, start_date, end_date } = req.body;
        
    if (!isString(degree_title) || !isInteger(university_id) || !isInteger(field_id) || !isString(education_level) || !isString(grade) || !isString(start_date)) 
        throw new AppError("Invalid or missing input fields", 400);
    
    await pool.query("INSERT INTO user_education (user_id, degree_title, university_id, field_id, education_level, grade, description, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [req.user.user_id, degree_title, university_id, field_id, education_level, grade, description, start_date, end_date]);
    
    res.status(201).json({
        status: "success"
    });
});

export const updateEducation = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);
    if (!isString(req.params.id)) throw new AppError("Invalid request ID", 400);

    const education_id = parseInt(req.params.id, 10);
    const { degree_title, university_id, field_id, education_level, grade, description, start_date, end_date } = req.body;
        
    if (!isInteger(education_id) || !isString(degree_title) || !isInteger(field_id) || !isString(education_level) || !isString(grade) || !isString(start_date) || !isInteger(university_id)) 
        throw new AppError("Invalid or missing input fields", 400);
    
    await pool.query("UPDATE user_education SET degree_title = $3, university_id = $4, field_id = $5, education_level = $6, grade = $7, description = $8, start_date = $9, end_date = $10 WHERE user_id=$1 AND education_id=$2", [req.user.user_id, education_id, degree_title, university_id, field_id, education_level, grade, description, start_date, end_date]);
    
    res.status(200).json({
        status: "success"
    });
});

export const addSociety = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);

    const { society_id, title } = req.body;

    if (!isInteger(society_id) || !isString(title)) 
        throw new AppError("Invalid or missing input fields", 400);

    await pool.query("INSERT INTO user_societies (user_id, society_id, role_title) VALUES ($1, $2, $3)", [req.user.user_id, society_id, title]);

    res.status(201).json({
        status: "success"
    });
});

export const updateSociety = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    if (!req.body) throw new AppError("Request body is required", 400);
    if (!isString(req.params.id)) throw new AppError("Invalid request ID", 400);

    const society_id = parseInt(req.params.id, 10);
    const { title } = req.body;

    if (!isInteger(society_id) || !isString(title)) 
        throw new AppError("Invalid or missing input fields", 400);

    await pool.query("UPDATE user_societies SET role_title = $3 WHERE user_id=$1 AND society_id=$2", [req.user.user_id, society_id, title]);

    res.status(200).json({
        status: "success"
    });
});

export const removeSociety = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);
    
    const society_id = parseInt(req.params.id);
    
    if (!isInteger(society_id)) 
        throw new AppError("Invalid society id", 400);
    
    await pool.query("DELETE FROM user_societies WHERE user_id=$1 AND society_id=$2", [req.user.user_id, society_id]);
    
    res.status(200).json({
        status: "success"
    });
});

export const addExperience = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    if (!req.body) throw new AppError("Request body is required", 400);

    const { job_title, description, company, city_id, start_date, end_date } = req.body;

    if (!isString(job_title) || !isString(company) || !isInteger(city_id) || !isString(start_date)) 
        throw new AppError("Invalid or missing input fields", 400);

    await pool.query("INSERT INTO user_experiences (user_id, job_title, description, company, city_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7)", [req.user.user_id, job_title, description, company, city_id, start_date, end_date]);

    res.status(201).json({
        status: "success"
    });
});

export const updateExperience = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);
    if (!isString(req.params.id)) throw new AppError("Invalid request ID", 400);

    const experience_id = parseInt(req.params.id);
    const { job_title, description, company, city_id, start_date, end_date } = req.body;

    if (!isInteger(experience_id) || !isString(job_title) || !isString(company) || !isInteger(city_id) || !isString(start_date)) 
        throw new AppError("Invalid or missing input fields", 400);

    await pool.query("UPDATE user_experiences SET job_title = $1, description = $2, company = $3, city_id = $4, start_date = $5, end_date = $6 WHERE experience_id = $7 AND user_id = $8", [job_title, description, company, city_id, start_date, end_date, experience_id, req.user.user_id]);

    res.status(200).json({
        status: "success"
    });
});

export const addSkill = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);

    const skill_id = parseInt(req.params.id);
    
    if (!isInteger(skill_id)) 
        throw new AppError("Invalid skill ID", 400);

    await pool.query("INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)", [req.user.user_id, skill_id]);

    res.status(201).json({
        status: "success"
    });
});

export const removeSkill = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) 
        throw new AppError("Invalid request ID", 400);

    const skill_id = parseInt(req.params.id);
    
    if (!isInteger(skill_id)) 
        throw new AppError("Invalid skill ID", 400);
    
    await pool.query("DELETE FROM user_skills WHERE user_id=$1 AND skill_id=$2", [req.user.user_id, skill_id]);
    
    res.status(200).json({
        status: "success"
    });
});

export const addProject = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);

    let { project_title, project_url, project_description, skills } = req.body;

    if (!isString(project_title) || !isString(project_url) || !isString(project_description)) 
        throw new AppError("Invalid or missing input fields", 400);

    if (!Array.isArray(skills) || !skills.every(s => isInteger(s)) || skills.length === 0) 
        throw new AppError("Invalid or missing skills", 400);

    skills = [...new Set(skills)];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        
        const project_id = (await client.query("INSERT INTO user_projects (user_id, project_title, project_url, project_description) VALUES ($1, $2, $3, $4) RETURNING project_id", [req.user.user_id, project_title, project_url, project_description])).rows[0].project_id;
        await client.query("INSERT INTO user_project_skills (project_id, skill_id) SELECT $1, unnest($2::int[])", [project_id, skills]);
        
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

    res.status(201).json({
        status: "success"
    });
});

export const updateProject = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new AppError("Request body is required", 400);
    if (!isString(req.params.id)) throw new AppError("Invalid request ID", 400);

    const project_id = parseInt(req.params.id);
    let { project_title, project_url, project_description, skills } = req.body;

    if (!isInteger(project_id) || !isString(project_title) || !isString(project_url) || !isString(project_description)) 
        throw new AppError("Invalid or missing input fields", 400);

    if (!Array.isArray(skills) || !skills.every(s => isInteger(s)) || skills.length === 0) 
        throw new AppError("Invalid or missing skills", 400);

    skills = [...new Set(skills)];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");        

        await client.query("UPDATE user_projects SET project_title=$3, project_url=$4, project_description=$5 WHERE user_id=$1 AND project_id=$2 RETURNING project_id", [req.user.user_id, project_id, project_title, project_url, project_description]);
        await client.query('DELETE FROM user_project_skills WHERE project_id = $2 AND EXISTS (SELECT 1 FROM user_projects WHERE user_id=$1 AND project_id=$2)', [req.user.user_id, project_id]);
        await client.query(`INSERT INTO user_project_skills (project_id, skill_id) SELECT $1, unnest($2::int[])`, [project_id, skills]);        

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

    res.status(201).json({
        status: "success"
    });
});

export const getProfile = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    let user_id = +req.params.id;
    if (!isInteger(user_id)) throw new AppError("Invalid Request", 400);
    
    const user_type = (await pool.query("SELECT role FROM users WHERE user_id=$1", [user_id])).rows[0]?.role;
    if (!user_type) throw new AppError("Invalid Request", 400);

    const user = await (user_type === "ALUMNUS" ? fetchAlumnusProfile(user_id) : fetchStudentProfile(user_id));

    res.status(200).json({
        status: "success",
        data: user
    });
});

const fetchUserEducation = async (user_id: number) => {
    return (await pool.query("SELECT education_id, degree_title, education_level, grade, user_education.description AS education_description, start_date::TEXT, end_date::TEXT, study_fields.name AS study_field, universities.name AS university, city_name, country_name FROM user_education INNER JOIN study_fields ON study_fields.field_id = user_education.field_id INNER JOIN universities ON universities.university_id = user_education.university_id INNER JOIN cities ON cities.city_id = universities.city_id INNER JOIN countries ON countries.country_id = cities.country_id WHERE user_id=$1 ORDER BY start_date DESC", [user_id])).rows;
}
const fetchUserSkills = async (user_id: number) => {
    return (await pool.query("SELECT skill_name FROM skills s JOIN user_skills us ON s.skill_id = us.skill_id WHERE us.user_id = $1;", [user_id])).rows.map(obj => obj.skill_name);
}
const fetchUserExperience = async (user_id: number) => {
    return (await pool.query("SELECT experience_id, job_title, company, city_name, country_name, description, start_date::TEXT, CASE WHEN end_date IS NOT NULL THEN end_date::TEXT ELSE NULL END AS end_date FROM user_experiences INNER JOIN cities ON cities.city_id = user_experiences.city_id INNER JOIN countries ON countries.country_id = cities.country_id WHERE user_id = $1 ORDER BY start_date DESC", [user_id])).rows;
}
const fetchUserLinks = async (user_id: number) => {
    return (await pool.query("SELECT link_title, url FROM user_links WHERE user_id = $1;", [user_id])).rows;
}
const fetchUserProjects = async (user_id: number) => {
    return (await pool.query("SELECT up.project_id, up.project_description, up.project_url, array_agg(s.skill_name) as skills FROM user_projects up LEFT JOIN user_project_skills ups ON up.project_id = ups.project_id LEFT JOIN skills s ON ups.skill_id = s.skill_id WHERE up.user_id = $1 GROUP BY up.project_id, up.project_description, up.project_url;", [user_id])).rows;
}
const fetchUserSocieties = async (user_id: number) => {
    return (await pool.query("SELECT s.society_name, us.role_title FROM societies s JOIN user_societies us ON s.society_id = us.society_id WHERE us.user_id = $1;", [user_id])).rows;
}

const fetchStudentProfile = async (user_id: number) => {
    let user = (await pool.query("SELECT u.user_id, u.name, u.headline, u.profile_url, u.about, d.dept_name, u.graduation_year, u.gpa FROM users u JOIN departments d ON u.department_id = d.department_id WHERE u.user_id = $1", [user_id])).rows[0];
    
    [user.skills, user.experience, user.links, user.projects, user.societies] = await Promise.all([
        fetchUserSkills(user_id),
        fetchUserExperience(user_id),
        fetchUserLinks(user_id),
        fetchUserProjects(user_id),
        fetchUserSocieties(user_id)
    ]);

    return user;
}
const fetchAlumnusProfile = async (user_id: number) => {
    let user = (await pool.query("SELECT user_id, name, headline, profile_url, about, role FROM users WHERE user_id=$1", [user_id])).rows[0];

    [user.skills, user.experience, user.links, user.education] = await Promise.all([
        fetchUserSkills(user_id),
        fetchUserExperience(user_id),
        fetchUserLinks(user_id),
        fetchUserEducation(user_id)
    ]);        

    return user;
}
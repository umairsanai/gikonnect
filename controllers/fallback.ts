import { NextFunction, Request, Response } from "express";
import pool from "../database.js";
import { AppError, handleAsyncError } from "../error.js";
import { isInteger, isString } from "../helpers.js";

export const getDepartments = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT * FROM departments ORDER BY dept_name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getSocieties = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT society_id, society_name FROM societies ORDER BY society_name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getSkills = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT skill_id, skill_name FROM skills ORDER BY skill_name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getCountries = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT country_id, country_name FROM countries ORDER BY country_name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getUniversities = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT university_id, name FROM universities ORDER BY name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getStudyFields = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rows } = await pool.query("SELECT field_id, name FROM study_fields ORDER BY name");

    res.status(200).json({
        status: "success",
        data: rows
    });
});

export const getCitiesForCountry = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) throw new AppError("Invalid request", 400);

    const country_id = parseInt(req.params.id, 10);
    if (!isInteger(country_id)) throw new AppError("Invalid country ID", 400);

    const { rows } = await pool.query("SELECT city_id, city_name FROM cities WHERE country_id=$1", [country_id]);

    res.status(200).json({
        status: "success",
        data: rows
    });
});


// TODO: Complete this route!
// PROBLEM: 20208-1997 != Batch 34 !!! 3 Batches are missing! How?? Which batches??? Adjust the query w.r.t that!

export const getBatchesPerDepartment = handleAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!isString(req.params.id)) throw new AppError("Invalid request", 400);

    const department_id = parseInt(req.params.id, 10);
    if (!isInteger(department_id)) throw new AppError("Invalid department id", 400);

    const { rows } = await pool.query("", [department_id]);
    
    res.status(200).json({
        status: "success",
        data: rows
    });
});
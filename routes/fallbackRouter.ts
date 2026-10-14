import express from "express";
import { getBatchesPerDepartment, getCitiesForCountry, getCountries, getDepartments, getSkills, getSocieties, getStudyFields, getUniversities } from "../controllers/fallback.js";

const router = express.Router();

router.get("/universities", getUniversities);
router.get("/departments", getDepartments);
router.get("/departments/:id/batches", getBatchesPerDepartment);
router.get("/societies", getSocieties);
router.get("/skills", getSkills);


router.get("/study-fields", getStudyFields); // Computer Science, Data Science etc...
router.get("/countries", getCountries);
router.get("/countries/:id/cities", getCitiesForCountry);

export default router;
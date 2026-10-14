import express from "express";
import { protect } from "../controllers/auth.js";
import { addEducation, addExperience, addProject, addSkill, addSociety, getConnections, getMe, getProfile, removeSkill, removeSociety, updateEducation, updateExperience, updateProfile, updateProfilePicture, updateProject, updateSociety } from "../controllers/user.js";
import { declineRequest, getIncomingRequests, getOutgoingRequests, sendRequest, deleteRequest, acceptRequest } from "../controllers/request.js";

const router = express.Router();

// ROUTES
router.get("/me", protect, getMe);
router.get("/connections/", protect, getConnections);

router.get("/:id/profile", protect, getProfile);

router.patch("/profile/", protect, updateProfile);
router.patch("/profile/photo", protect, updateProfilePicture);

router.post("/experience", protect, addExperience);
router.patch("/experience/:id", protect, updateExperience);

router.post("/education", protect, addEducation);
router.patch("/education/:id", protect, updateEducation);

router.post("/projects/", protect, addProject);
router.patch("/projects/:id", protect, updateProject);

router.post("/skills/:id", protect, addSkill);
router.delete("/skills/:id", protect, removeSkill);

router.post("/societies/", protect, addSociety);
router.patch("/societies/:id", protect, updateSociety);
router.delete("/societies/:id", protect, removeSociety);

router.get("/requests/incoming", protect, getIncomingRequests);
router.get("/requests/outgoing", protect, getOutgoingRequests);
router.delete("/requests/:id", protect, deleteRequest);
router.post("/requests/send", protect, sendRequest);
router.post("/requests/accept/:id", protect, acceptRequest);
router.patch("/requests/decline/:id", protect, declineRequest);


export default router;
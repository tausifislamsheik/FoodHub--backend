import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validation.middleware";
import { registerSchema, loginSchema, updateProfileSchema } from "./auth.validation";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

// Protected routes
router.use(authenticate);
router.post("/logout", authController.logout);
router.get("/profile", authController.getProfile);
router.patch("/profile", validate(updateProfileSchema), authController.updateProfile);

export default router;
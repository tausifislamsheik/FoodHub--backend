import { Router } from "express";
import { AdminController } from "./admin.controller";
import { validate } from "../../middleware/validation.middleware";
import { approveProviderSchema, updateUserStatusSchema } from "./admin.validation";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router: Router = Router();
const adminController = new AdminController();

// All routes require admin authentication
router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", adminController.getDashboardStats);
router.get("/users", adminController.getAllUsers);
router.get("/providers/pending", adminController.getPendingProvider);
router.patch(
  "/providers/:providerId/approve",
  validate(approveProviderSchema),
  adminController.approveProvider
);
router.patch(
  "/users/:userId/status",
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);
router.delete("/users/:userId", adminController.deleteUser);

export default router;
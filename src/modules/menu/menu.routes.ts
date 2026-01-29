import { Router } from "express";
import { MenuController } from "./menu.controller";
import { validate } from "../../middleware/validation.middleware";
import { createMenuSchema, updateMenuSchema, getMenusByProviderSchema } from "./menu.validation";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router: Router = Router();
const menuController = new MenuController();

// Public routes
router.get("/", menuController.getAllMenus);
router.get("/:id", menuController.getMenuById);
router.get("/provider/:providerId", validate(getMenusByProviderSchema), menuController.getMenusByProvider);

// Provider routes
router.use(authenticate);
router.get("/my/menus", authorize("PROVIDER"), menuController.getMyMenus);
router.post("/", authorize("PROVIDER"), validate(createMenuSchema), menuController.createMenu);
router.patch("/:id", authorize("PROVIDER"), validate(updateMenuSchema), menuController.updateMenu);
router.delete("/:id", authorize("PROVIDER"), menuController.deleteMenu);

export default router;
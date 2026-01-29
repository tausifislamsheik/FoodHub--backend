import { Router } from "express";
import { OrderController } from "./order.controller";
import { validate } from "../../middleware/validation.middleware";
import { createOrderSchema, updateOrderStatusSchema } from "./order.validation";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post("/", authorize("CUSTOMER"), validate(createOrderSchema), orderController.createOrder);
router.post("/:id/cancel", authorize("CUSTOMER"), orderController.cancelOrder);

// Common routes
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);

// Vendor routes
router.patch(
  "/:id/status",
  authorize("VENDOR"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

export default router;
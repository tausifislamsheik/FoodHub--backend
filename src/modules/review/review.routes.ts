import { Router } from "express";
import { ReviewController } from "./review.controller";
import { validate } from "../../middleware/validation.middleware";
import { createReviewSchema, updateReviewSchema } from "./review.validation";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router: Router = Router();
const reviewController = new ReviewController();

// Public routes
router.get("/provider/:providerId", reviewController.getProviderReviews);

// Customer routes
router.use(authenticate);
router.post("/", authorize("CUSTOMER"), validate(createReviewSchema), reviewController.createReview);
router.get("/my-reviews", authorize("CUSTOMER"), reviewController.getMyReviews);
router.patch("/:id", authorize("CUSTOMER"), validate(updateReviewSchema), reviewController.updateReview);
router.delete("/:id", authorize("CUSTOMER"), reviewController.deleteReview);

export default router;
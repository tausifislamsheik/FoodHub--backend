import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { sendSuccess } from "../../utils/response";

const adminService = new AdminService();

export class AdminController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getAllUsers(req.query);
      sendSuccess(res, users, "Users retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getPendingProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await adminService.getPendingProviders();
      sendSuccess(res, providers, "Pending providers retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async approveProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      const { isApproved } = req.body;
      const provider = await adminService.approveProvider(providerId, isApproved);
      sendSuccess(
        res,
        provider,
        `Provider ${isApproved ? "approved" : "rejected"} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const user = await adminService.updateUserStatus(userId, isActive);
      sendSuccess(
        res,
        user,
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, stats, "Dashboard stats retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(userId);
      sendSuccess(res, result, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
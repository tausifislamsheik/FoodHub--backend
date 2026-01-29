import { Request, Response, NextFunction } from "express";
import { MenuService } from "./menu.service";
import { sendSuccess } from "../../utils/response";
import prisma from "../../config/database";
import { AppError } from "../../utils/error";

const menuService = new MenuService();

export class MenuController {
  async createMenu(req: Request, res: Response, next: NextFunction) {
    try {
      // Get provider ID from user
      const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id },
      });

      if (!provider) {
        throw new AppError("Provider profile not found", 404);
      }

      const menu = await menuService.createMenu(provider.id, req.body);
      sendSuccess(res, menu, "Menu item created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMenusByProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      const menus = await menuService.getMenusByProvider(providerId, req.query);
      sendSuccess(res, menus, "Menus retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMenuById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const menu = await menuService.getMenuById(id);
      sendSuccess(res, menu, "Menu item retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id },
      });

      if (!provider) {
        throw new AppError("Provider profile not found", 404);
      }

      const menu = await menuService.updateMenu(id, provider.id, req.body);
      sendSuccess(res, menu, "Menu item updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id },
      });

      if (!provider) {
        throw new AppError("Provider profile not found", 404);
      }

      const result = await menuService.deleteMenu(id, provider.id);
      sendSuccess(res, result, "Menu item deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const menus = await menuService.getAllMenus(req.query);
      sendSuccess(res, menus, "All menus retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMyMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const menus = await menuService.getProviderMenu(req.user!.id);
      sendSuccess(res, menus, "Your menus retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}
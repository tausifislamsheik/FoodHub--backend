import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { sendSuccess } from "../../utils/response";
import prisma from "../../config/database";
import { AppError } from "../../utils/error";
import { OrderStatus } from "@prisma/client";

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const order = await orderService.createOrder(customer.id, req.body);
      sendSuccess(res, order, "Order created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      // Verify access
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.id },
      });

      const isCustomerOrder = customer && order.customerId === customer.id;
      const isVendorOrder = vendor && order.vendorId === vendor.id;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isCustomerOrder && !isVendorOrder && !isAdmin) {
        throw new AppError("You don't have access to this order", 403);
      }

      sendSuccess(res, order, "Order retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  

  

  
}
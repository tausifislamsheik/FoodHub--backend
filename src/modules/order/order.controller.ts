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
      const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id },
      });

      const isCustomerOrder = customer && order.customerId === customer.id;
      const isProviderOrder = provider && order.providerId === provider.id;
      const isAdmin = req.user!.role === "ADMIN";

      if (!isCustomerOrder && !isProviderOrder && !isAdmin) {
        throw new AppError("You don't have access to this order", 403);
      }

      sendSuccess(res, order, "Order retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role === "CUSTOMER") {
        const customer = await prisma.customer.findUnique({
          where: { userId: req.user!.id },
        });

        if (!customer) {
          throw new AppError("Customer profile not found", 404);
        }

        const orders = await orderService.getCustomerOrders(customer.id);
        sendSuccess(res, orders, "Your orders retrieved successfully");
      } else if (req.user!.role === "PROVIDER") {
        const provider = await prisma.provider.findUnique({
          where: { userId: req.user!.id },
        });

        if (!provider) {
          throw new AppError("Provider profile not found", 404);
        }

        const status = req.query.status as OrderStatus | undefined;
        const orders = await orderService.getProviderOrders(provider.id, status);
        sendSuccess(res, orders, "Orders retrieved successfully");
      } else {
        throw new AppError("Invalid user role", 400);
      }
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(
        id,
        status,
        req.user!.id,
        req.user!.role
      );

      sendSuccess(res, order, "Order status updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.id },
      });

      if (!customer) {
        throw new AppError("Customer profile not found", 404);
      }

      const order = await orderService.cancelOrder(id, customer.id);
      sendSuccess(res, order, "Order cancelled successfully");
    } catch (error) {
      next(error);
    }
  }
}
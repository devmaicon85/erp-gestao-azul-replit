import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertContactSchema, 
  insertProductSchema, 
  insertOrderSchema 
} from "@shared/schema";
import { z } from "zod";

// Helper to validate req.params.id and req.user.organizationId for route handlers
function withOrgValidation(handler: (req: Request, res: Response, id: string, organizationId: string) => Promise<any>) {
  return async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).send("Missing ID parameter");
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(403).send("Invalid organization");
    }

    await handler(req, res, id, organizationId);
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Organization
  app.get("/api/organization", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const organization = await storage.getOrganization(req.user!.organizationId);
      if (!organization) {
        return res.status(404).send("Organization not found");
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Contacts
  app.get("/api/contacts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const type = req.query.type as string | undefined;
      const status = req.query.status ? parseInt(req.query.status as string) : 1;
      const contacts = await storage.getContacts(req.user!.organizationId, type, status);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/contacts/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const contact = await storage.getContact(id, organizationId);
      if (!contact) {
        return res.status(404).send("Contact not found");
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.post("/api/contacts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const contactData = insertContactSchema.parse({
        ...req.body,
        organizationId: req.user!.organizationId
      });
      
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.put("/api/contacts/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      // First check if contact exists and belongs to organization
      const existingContact = await storage.getContact(id, organizationId);
      if (!existingContact) {
        return res.status(404).send("Contact not found");
      }

      const updatedContact = await storage.updateContact(id, req.body);
      res.json(updatedContact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.delete("/api/contacts/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const success = await storage.deleteContact(id, organizationId);
      if (!success) {
        return res.status(404).send("Contact not found or already deleted");
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).send("Internal server error");
    }
  }));

  // Products
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const status = req.query.status ? parseInt(req.query.status as string) : 1;
      const products = await storage.getProducts(req.user!.organizationId, status);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/products/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const product = await storage.getProduct(id, organizationId);
      if (!product) {
        return res.status(404).send("Product not found");
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        organizationId: req.user!.organizationId
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.put("/api/products/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      // First check if product exists and belongs to organization
      const existingProduct = await storage.getProduct(id, organizationId);
      if (!existingProduct) {
        return res.status(404).send("Product not found");
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.delete("/api/products/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const success = await storage.deleteProduct(id, organizationId);
      if (!success) {
        return res.status(404).send("Product not found or already deleted");
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).send("Internal server error");
    }
  }));

  // Orders
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const status = req.query.status as string | undefined;
      const orders = await storage.getOrders(req.user!.organizationId, status);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/orders/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const order = await storage.getOrder(id, organizationId);
      if (!order) {
        return res.status(404).send("Order not found");
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        organizationId: req.user!.organizationId
      });
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.put("/api/orders/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      // First check if order exists and belongs to organization
      const existingOrder = await storage.getOrder(id, organizationId);
      if (!existingOrder) {
        return res.status(404).send("Order not found");
      }

      const updatedOrder = await storage.updateOrder(id, req.body);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).send("Internal server error");
    }
  }));

  app.delete("/api/orders/:id", withOrgValidation(async (req, res, id, organizationId) => {
    try {
      const success = await storage.deleteOrder(id, organizationId);
      if (!success) {
        return res.status(404).send("Order not found or already deleted");
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).send("Internal server error");
    }
  }));

  const httpServer = createServer(app);

  return httpServer;
}

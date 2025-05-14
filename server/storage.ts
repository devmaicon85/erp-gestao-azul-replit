import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users, organizations, contacts, phones, addresses,
  products, priceTables, priceItems, orders, orderItems,
  paymentMethods, orderPayments, deliveries, receivables,
  receivablePayments, cashRegisters, cashMovements,
  type User, type InsertUser, type Organization, type InsertOrganization,
  type Contact, type InsertContact, type Product, type InsertProduct,
  type Order, type InsertOrder
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { randomUUID } from "crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Organization
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Contacts
  getContacts(organizationId: string, type?: string, status?: number): Promise<Contact[]>;
  getContact(id: string, organizationId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string, organizationId: string): Promise<boolean>;
  
  // Products
  getProducts(organizationId: string, status?: number): Promise<Product[]>;
  getProduct(id: string, organizationId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string, organizationId: string): Promise<boolean>;
  
  // Orders
  getOrders(organizationId: string, status?: string): Promise<Order[]>;
  getOrder(id: string, organizationId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string, organizationId: string): Promise<boolean>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Organization
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values({
      ...organization,
      id: randomUUID()
    }).returning();
    return org;
  }

  // Contacts
  async getContacts(organizationId: string, type?: string, status: number = 1): Promise<Contact[]> {
    let query = db.select().from(contacts).where(
      and(
        eq(contacts.organizationId, organizationId),
        eq(contacts.status, status)
      )
    );
    
    if (type) {
      query = query.where(eq(contacts.type, type as any));
    }
    
    return await query;
  }

  async getContact(id: string, organizationId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(
      and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId)
      )
    );
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values({
      ...contact,
      id: randomUUID()
    }).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts)
      .set({
        ...contact,
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string, organizationId: string): Promise<boolean> {
    // Soft delete - set status to 0
    const [updated] = await db.update(contacts)
      .set({ 
        status: 0,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.organizationId, organizationId)
        )
      )
      .returning();
    
    return !!updated;
  }

  // Products
  async getProducts(organizationId: string, status: number = 1): Promise<Product[]> {
    return await db.select().from(products).where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.status, status)
      )
    );
  }

  async getProduct(id: string, organizationId: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(
      and(
        eq(products.id, id),
        eq(products.organizationId, organizationId)
      )
    );
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      ...product,
      id: randomUUID()
    }).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string, organizationId: string): Promise<boolean> {
    // Soft delete - set status to 0
    const [updated] = await db.update(products)
      .set({ 
        status: 0,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(products.id, id),
          eq(products.organizationId, organizationId)
        )
      )
      .returning();
    
    return !!updated;
  }

  // Orders
  async getOrders(organizationId: string, status?: string): Promise<Order[]> {
    let query = db.select().from(orders).where(eq(orders.organizationId, organizationId));
    
    if (status) {
      query = query.where(eq(orders.status, status as any));
    }
    
    return await query;
  }

  async getOrder(id: string, organizationId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(
      and(
        eq(orders.id, id),
        eq(orders.organizationId, organizationId)
      )
    );
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values({
      ...order,
      id: randomUUID()
    }).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        ...order,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: string, organizationId: string): Promise<boolean> {
    // Change status to CANCELED
    const [updated] = await db.update(orders)
      .set({ 
        status: 'CANCELED',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(orders.id, id),
          eq(orders.organizationId, organizationId)
        )
      )
      .returning();
    
    return !!updated;
  }
}

export const storage = new DatabaseStorage();

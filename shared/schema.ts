import { pgTable, text, serial, integer, boolean, timestamp, numeric, foreignKey, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const contactTypeEnum = pgEnum('contact_type', ['CLIENT', 'SUPPLIER', 'EMPLOYEE', 'CARRIER', 'CONTACT']);
export const productTypeEnum = pgEnum('product_type', ['SIMPLE', 'CONTAINER', 'WITH_CONTAINER_RETURN']);
export const orderStatusEnum = pgEnum('order_status', ['NEW', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELED', 'OPEN']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'TRANSFER', 'CHECK', 'RECEIVABLE', 'OTHER']);
export const receivableStatusEnum = pgEnum('receivable_status', ['OPEN', 'PARTIAL_RECEIVED', 'RECEIVED', 'OVERDUE']);
export const cashMovementTypeEnum = pgEnum('cash_movement_type', ['SALE', 'RECEIVABLE_PAYMENT', 'WITHDRAWAL', 'DEPOSIT', 'ADJUSTMENT']);

// Users and authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  timezone: text('timezone').default('America/Sao_Paulo').notNull(),
  active: boolean('active').default(true).notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  cashRegisters: many(cashRegisters),
  deliveries: many(deliveries),
  cashMovements: many(cashMovements),
}));

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  contacts: many(contacts),
  products: many(products),
  orders: many(orders),
  paymentMethods: many(paymentMethods),
  receivables: many(receivables),
  cashRegisters: many(cashRegisters),
  priceTables: many(priceTables),
}));

// Contacts
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: contactTypeEnum('type').notNull(),
  document: text('document'),
  email: text('email'),
  birthDate: timestamp('birth_date'),
  observation: text('observation'),
  isDeliveryPerson: boolean('is_delivery_person').default(false).notNull(),
  status: integer('status').default(1).notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  phones: many(phones),
  addresses: many(addresses),
  asClient: many(orders),
  deliveries: many(deliveries),
  receivables: many(receivables),
}));

export const phones = pgTable('phones', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: text('number').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  contactId: uuid('contact_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const phonesRelations = relations(phones, ({ one }) => ({
  contact: one(contacts, {
    fields: [phones.contactId],
    references: [contacts.id],
    relationName: 'phone_contact',
  }),
}));

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').default('Endereço 01').notNull(),
  zipCode: text('zip_code'),
  street: text('street').notNull(),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood'),
  city: text('city'),
  state: text('state'),
  reference: text('reference'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  contactId: uuid('contact_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [addresses.contactId],
    references: [contacts.id],
    relationName: 'address_contact',
  }),
  deliveryAddress: many(orders),
}));

// Products
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  internalCode: text('internal_code').notNull(),
  barCode: text('bar_code'),
  name: text('name').notNull(),
  type: productTypeEnum('type').default('SIMPLE').notNull(),
  costValue: numeric('cost_value', { precision: 10, scale: 2 }).default('0').notNull(),
  currentStock: integer('current_stock').default(0).notNull(),
  minimumStock: integer('minimum_stock').default(0).notNull(),
  imageUrl: text('image_url'),
  status: integer('status').default(1).notNull(),
  organizationId: uuid('organization_id').notNull(),
  containerProductId: uuid('container_product_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  containerProduct: one(products, {
    fields: [products.containerProductId],
    references: [products.id],
    relationName: 'product_to_container',
  }),
  productsWithContainer: many(products, { relationName: 'product_to_container' }),
  priceItems: many(priceItems),
  orderItems: many(orderItems),
}));

export const priceTables = pgTable('price_tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const priceTablesRelations = relations(priceTables, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [priceTables.organizationId],
    references: [organizations.id],
  }),
  priceItems: many(priceItems),
  orders: many(orders),
}));

export const priceItems = pgTable('price_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  priceTableId: uuid('price_table_id').notNull(),
  productId: uuid('product_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const priceItemsRelations = relations(priceItems, ({ one }) => ({
  priceTable: one(priceTables, {
    fields: [priceItems.priceTableId],
    references: [priceTables.id],
  }),
  product: one(products, {
    fields: [priceItems.productId],
    references: [products.id],
  }),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  status: orderStatusEnum('status').default('NEW').notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('0').notNull(),
  totalValue: numeric('total_value', { precision: 10, scale: 2 }).notNull(),
  organizationId: uuid('organization_id').notNull(),
  clientId: uuid('client_id').notNull(),
  addressId: uuid('address_id').notNull(),
  priceTableId: uuid('price_table_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  client: one(contacts, {
    fields: [orders.clientId],
    references: [contacts.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  priceTable: one(priceTables, {
    fields: [orders.priceTableId],
    references: [priceTables.id],
  }),
  items: many(orderItems),
  payments: many(orderPayments),
  delivery: one(deliveries),
  receivables: many(receivables),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  orderId: uuid('order_id').notNull(),
  productId: uuid('product_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: paymentMethodTypeEnum('type').notNull(),
  dueDays: integer('due_days').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [paymentMethods.organizationId],
    references: [organizations.id],
  }),
  orderPayments: many(orderPayments),
  cashMovements: many(cashMovements),
}));

export const orderPayments = pgTable('order_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  change: numeric('change', { precision: 10, scale: 2 }).default('0').notNull(),
  orderId: uuid('order_id').notNull(),
  paymentMethodId: uuid('payment_method_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, {
    fields: [orderPayments.orderId],
    references: [orders.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orderPayments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  departureDateTime: timestamp('departure_date_time'),
  deliveryDateTime: timestamp('delivery_date_time'),
  orderId: uuid('order_id').notNull().unique(),
  deliveryPersonId: uuid('delivery_person_id'),
  assignedById: integer('assigned_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  deliveryPerson: one(contacts, {
    fields: [deliveries.deliveryPersonId],
    references: [contacts.id],
  }),
  assignedBy: one(users, {
    fields: [deliveries.assignedById],
    references: [users.id],
  }),
}));

// Financial
export const receivables = pgTable('receivables', {
  id: uuid('id').defaultRandom().primaryKey(),
  dueDate: timestamp('due_date').notNull(),
  totalValue: numeric('total_value', { precision: 10, scale: 2 }).notNull(),
  receivedValue: numeric('received_value', { precision: 10, scale: 2 }).default('0').notNull(),
  status: receivableStatusEnum('status').default('OPEN').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id').notNull(),
  clientId: uuid('client_id').notNull(),
  orderId: uuid('order_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const receivablesRelations = relations(receivables, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [receivables.organizationId],
    references: [organizations.id],
  }),
  client: one(contacts, {
    fields: [receivables.clientId],
    references: [contacts.id],
  }),
  order: one(orders, {
    fields: [receivables.orderId],
    references: [orders.id],
  }),
  payments: many(receivablePayments),
}));

export const receivablePayments = pgTable('receivable_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentDate: timestamp('payment_date').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  observation: text('observation'),
  receivableId: uuid('receivable_id').notNull(),
  cashRegisterId: uuid('cash_register_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const receivablePaymentsRelations = relations(receivablePayments, ({ one }) => ({
  receivable: one(receivables, {
    fields: [receivablePayments.receivableId],
    references: [receivables.id],
  }),
  cashRegister: one(cashRegisters, {
    fields: [receivablePayments.cashRegisterId],
    references: [cashRegisters.id],
  }),
}));

export const cashRegisters = pgTable('cash_registers', {
  id: uuid('id').defaultRandom().primaryKey(),
  openingDate: timestamp('opening_date').defaultNow().notNull(),
  closingDate: timestamp('closing_date'),
  initialAmount: numeric('initial_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }),
  status: text('status').default('OPEN').notNull(),
  organizationId: uuid('organization_id').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashRegistersRelations = relations(cashRegisters, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cashRegisters.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [cashRegisters.userId],
    references: [users.id],
  }),
  movements: many(cashMovements),
  receivablePayments: many(receivablePayments),
}));

export const cashMovements = pgTable('cash_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: cashMovementTypeEnum('type').notNull(),
  description: text('description').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  movementDate: timestamp('movement_date').defaultNow().notNull(),
  cashRegisterId: uuid('cash_register_id').notNull(),
  paymentMethodId: uuid('payment_method_id'),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  cashRegister: one(cashRegisters, {
    fields: [cashMovements.cashRegisterId],
    references: [cashRegisters.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [cashMovements.paymentMethodId],
    references: [paymentMethods.id],
  }),
  user: one(users, {
    fields: [cashMovements.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  password: true,
  organizationId: true,
})
.extend({
  // Campo adicional para uso no frontend durante o registro
  organizationName: z.string().optional(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  type: true,
  document: true,
  email: true,
  birthDate: true,
  observation: true,
  isDeliveryPerson: true,
  organizationId: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  internalCode: true,
  barCode: true,
  name: true,
  type: true,
  costValue: true,
  currentStock: true,
  minimumStock: true,
  imageUrl: true,
  containerProductId: true,
  organizationId: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderDate: true,
  status: true,
  deliveryFee: true,
  totalValue: true,
  clientId: true,
  addressId: true,
  priceTableId: true,
  organizationId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Phone = typeof phones.$inferSelect;
export type Address = typeof addresses.$inferSelect;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type PriceTable = typeof priceTables.$inferSelect;
export type PriceItem = typeof priceItems.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type OrderPayment = typeof orderPayments.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;

export type Receivable = typeof receivables.$inferSelect;
export type ReceivablePayment = typeof receivablePayments.$inferSelect;

export type CashRegister = typeof cashRegisters.$inferSelect;
export type CashMovement = typeof cashMovements.$inferSelect;

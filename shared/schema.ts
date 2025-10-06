import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const dermaliftProtocolEnum = pgEnum("dermalift_protocol", ["sustentacao", "estruturacao", "embelezamento", "revitalizacao"]);
export const dermaliftProtocols = ["sustentacao", "estruturacao", "embelezamento", "revitalizacao"] as const;
export type DermaliftProtocol = typeof dermaliftProtocols[number];

export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  protocol: dermaliftProtocolEnum("protocol").notNull(),
  category: text("category"),
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
}).extend({
  protocol: z.enum(dermaliftProtocols),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()),
});

export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Procedure = typeof procedures.$inferSelect;

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  cpf: text("cpf"),
  birthDate: text("birth_date"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  origin: text("origin"),
  tags: text("tags").array(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  procedureIds: text("procedure_ids").array().notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  notes: text("notes"),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
}).extend({
  total: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()),
  discount: z.union([z.string(), z.number()]).pipe(z.coerce.number()).optional(),
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

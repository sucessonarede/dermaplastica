import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

export const dermaliftProtocolEnum = pgEnum("dermalift_protocol", ["sustentacao", "estruturacao", "embelezamento", "revitalizacao", "alem_da_face"]);
export const dermaliftProtocols = ["sustentacao", "estruturacao", "embelezamento", "revitalizacao", "alem_da_face"] as const;
export type DermaliftProtocol = typeof dermaliftProtocols[number];

export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  mlPrice: decimal("ml_price", { precision: 10, scale: 2 }),
  minMl: decimal("min_ml", { precision: 10, scale: 2 }),
  maxMl: decimal("max_ml", { precision: 10, scale: 2 }),
  protocol: dermaliftProtocolEnum("protocol").notNull(),
  category: text("category"),
  displayOrder: integer("display_order").notNull().default(0),
});

const optionalPositiveNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    // Keep undefined as undefined (field not sent)
    if (val === undefined) return undefined;
    // Convert empty string or explicit null to null (field cleared)
    if (val === "" || val === null) return null;
    // Parse and validate numbers
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num as number)) {
      throw new Error("Deve ser um número válido");
    }
    return num;
  })
  .refine((val) => val === undefined || val === null || (typeof val === 'number' && val > 0), {
    message: "Número deve ser maior que 0",
  });

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
}).extend({
  protocol: z.enum(dermaliftProtocols),
  price: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive("Preço deve ser maior que 0")),
  discountedPrice: optionalPositiveNumber,
  mlPrice: optionalPositiveNumber,
  minMl: optionalPositiveNumber,
  maxMl: optionalPositiveNumber,
  displayOrder: z.union([z.string(), z.number()]).pipe(z.coerce.number().int()).optional(),
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
  complaints: text("complaints"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const patientPhotos = pgTable("patient_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPatientPhotoSchema = createInsertSchema(patientPhotos).omit({
  id: true,
  uploadedAt: true,
}).extend({
  photoUrl: z.string().min(1, "URL da foto é obrigatória"),
});

export type InsertPatientPhoto = z.infer<typeof insertPatientPhotoSchema>;
export type PatientPhoto = typeof patientPhotos.$inferSelect;

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  installments: integer("installments").default(1),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }),
  bonusList: text("bonus_list").array(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  notes: text("notes"),
});

export const quoteItems = pgTable("quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  procedureId: varchar("procedure_id").notNull().references(() => procedures.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
}).extend({
  total: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()),
  discount: z.union([z.string(), z.number()]).pipe(z.coerce.number()).optional(),
  discountPercentage: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0).max(100)).optional(),
  installments: z.number().int().min(1).optional(),
  downPayment: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0)).optional(),
  bonusList: z.array(z.string()).optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
}).extend({
  quantity: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()),
  customPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()).optional(),
  subtotal: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive()),
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

export const clinicSettings = pgTable("clinic_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicName: text("clinic_name").notNull(),
  cnpj: text("cnpj"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  monthlyGoal: decimal("monthly_goal", { precision: 10, scale: 2 }),
  conversionGoal: decimal("conversion_goal", { precision: 5, scale: 2 }),
  newPatientsGoal: integer("new_patients_goal"),
});

export const insertClinicSettingsSchema = createInsertSchema(clinicSettings).omit({
  id: true,
}).extend({
  clinicName: z.string().min(1, "Nome da clínica é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  monthlyGoal: optionalPositiveNumber,
  conversionGoal: optionalPositiveNumber,
  newPatientsGoal: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().positive()).optional(),
});

export type InsertClinicSettings = z.infer<typeof insertClinicSettingsSchema>;
export type ClinicSettings = typeof clinicSettings.$inferSelect;

export interface PatientWithStats extends Patient {
  quoteCount: number;
  totalBudget: number;
  acceptedBudget: number;
  lastQuoteDate?: string;
}

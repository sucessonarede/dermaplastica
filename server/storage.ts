import { 
  type User, 
  type InsertUser, 
  type Quote,
  type InsertQuote,
  type QuoteItem,
  type InsertQuoteItem,
  type Patient,
  type Procedure,
  type InsertProcedure,
  type ClinicSettings,
  type InsertClinicSettings
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, quotes, quoteItems, patients, procedures, clinicSettings } from "@shared/schema";
import { eq, and, gte, sql, desc, count, inArray } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface QuoteWithDetails extends Quote {
  patient: Patient;
  items: Array<QuoteItem & { procedure: Procedure }>;
}

// Type for creating quote items without quoteId (will be added by createQuote)
export type CreateQuoteItem = Omit<InsertQuoteItem, 'quoteId'>;

export interface DashboardStats {
  activePatientsCount: number;
  quotesThisMonth: number;
  quotesLastMonth: number;
  averageTicket: number;
  conversionRate: number;
  acceptedQuotes: number;
}

export interface TopProcedure {
  name: string;
  sales: number;
  revenue: number;
}

export interface ReportsMetrics {
  averageTicket: number;
  averageDiscount: number;
  conversionRate: number;
  acceptedQuotes: number;
  quotesThisMonth: number;
  topProcedures: TopProcedure[];
}

export interface PatientFilters {
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  minBudget?: number;
  maxBudget?: number;
  origins?: string[];
  cities?: string[];
  tags?: string[];
  hasQuotes?: boolean;
}

export interface PatientWithStats extends Patient {
  quoteCount: number;
  totalBudget: number;
  acceptedBudget: number;
  lastQuoteDate?: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  
  // Quote methods
  createQuote(quote: InsertQuote, items: CreateQuoteItem[]): Promise<Quote>;
  getQuotes(): Promise<QuoteWithDetails[]>;
  getQuoteById(id: string): Promise<QuoteWithDetails | undefined>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  updateQuoteItems(quoteId: string, items: CreateQuoteItem[]): Promise<void>;
  deleteQuote(id: string): Promise<boolean>;
  
  // Dashboard methods
  getDashboardStats(): Promise<DashboardStats>;
  getRecentQuotes(limit?: number): Promise<QuoteWithDetails[]>;
  
  // Reports methods
  getReportsMetrics(): Promise<ReportsMetrics>;
  
  // Patient methods
  getPatients(filters?: PatientFilters): Promise<PatientWithStats[]>;
  createPatient(patient: Partial<Omit<Patient, 'id'>> & { name: string }): Promise<Patient>;
  updatePatient(id: string, patient: Partial<Omit<Patient, 'id'>>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Procedure methods
  getProcedures(): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: string, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined>;
  deleteProcedure(id: string): Promise<boolean>;
  
  // Clinic Settings methods
  getClinicSettings(): Promise<ClinicSettings | undefined>;
  updateClinicSettings(settings: InsertClinicSettings): Promise<ClinicSettings>;
}

export class MemStorage implements IStorage {
  constructor() {
    // All operations now use the database
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  // Quote methods - using database directly
  async createQuote(insertQuote: InsertQuote, items: CreateQuoteItem[]): Promise<Quote> {
    // Wrap in transaction for atomicity
    return await db.transaction(async (tx) => {
      // Convert numbers to strings for decimal fields
      const quoteData = {
        ...insertQuote,
        total: insertQuote.total.toString(),
        discount: insertQuote.discount?.toString(),
        discountPercentage: insertQuote.discountPercentage?.toString(),
        downPayment: insertQuote.downPayment?.toString(),
      };
      
      // Create quote
      const [quote] = await tx.insert(quotes).values(quoteData).returning();
      
      // Create quote items with the quote ID
      if (items.length > 0) {
        const itemsWithQuoteId = items.map(item => ({
          ...item,
          quoteId: quote.id,
          quantity: item.quantity.toString(),
          subtotal: item.subtotal.toString(),
          customPrice: item.customPrice?.toString(),
        }));
        await tx.insert(quoteItems).values(itemsWithQuoteId);
      }
      
      return quote;
    });
  }

  async getQuotes(): Promise<QuoteWithDetails[]> {
    // Get all quotes with their patients
    const allQuotes = await db
      .select()
      .from(quotes)
      .leftJoin(patients, eq(quotes.patientId, patients.id))
      .orderBy(quotes.createdAt);

    if (allQuotes.length === 0) {
      return [];
    }

    // Get all items for all quotes in one query (optimized)
    const quoteIds = allQuotes.map(q => q.quotes.id);
    const allItems = await db
      .select()
      .from(quoteItems)
      .leftJoin(procedures, eq(quoteItems.procedureId, procedures.id));

    // Group items by quote
    const itemsByQuote = new Map<string, Array<QuoteItem & { procedure: Procedure }>>();
    
    for (const item of allItems) {
      if (!itemsByQuote.has(item.quote_items.quoteId)) {
        itemsByQuote.set(item.quote_items.quoteId, []);
      }
      itemsByQuote.get(item.quote_items.quoteId)!.push({
        ...item.quote_items,
        procedure: item.procedures!
      });
    }

    // Combine everything
    return allQuotes.map(q => ({
      ...q.quotes,
      patient: q.patients!,
      items: itemsByQuote.get(q.quotes.id) || []
    }));
  }

  async getQuoteById(id: string): Promise<QuoteWithDetails | undefined> {
    // Get quote with patient
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(patients, eq(quotes.patientId, patients.id))
      .where(eq(quotes.id, id))
      .limit(1);

    if (result.length === 0) {
      return undefined;
    }

    const quote = result[0];

    // Get quote items with procedures
    const items = await db
      .select()
      .from(quoteItems)
      .leftJoin(procedures, eq(quoteItems.procedureId, procedures.id))
      .where(eq(quoteItems.quoteId, id));

    return {
      ...quote.quotes,
      patient: quote.patients!,
      items: items.map(item => ({
        ...item.quote_items,
        procedure: item.procedures!
      }))
    };
  }

  async updateQuote(id: string, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    // Convert numbers to strings for decimal fields
    const dbData: any = { ...updateData };
    if (dbData.total !== undefined) {
      dbData.total = dbData.total.toString();
    }
    if (dbData.discount !== undefined) {
      dbData.discount = dbData.discount.toString();
    }
    
    const [updated] = await db
      .update(quotes)
      .set(dbData)
      .where(eq(quotes.id, id))
      .returning();
    
    return updated;
  }

  async updateQuoteItems(quoteId: string, items: CreateQuoteItem[]): Promise<void> {
    // Wrap in transaction for atomicity
    await db.transaction(async (tx) => {
      // Delete existing items
      await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
      
      // Insert new items
      if (items.length > 0) {
        const itemsWithQuoteId = items.map(item => ({
          ...item,
          quoteId: quoteId,
          quantity: item.quantity.toString(),
          subtotal: item.subtotal.toString(),
          customPrice: item.customPrice?.toString(),
        }));
        await tx.insert(quoteItems).values(itemsWithQuoteId);
      }
    });
  }

  async deleteQuote(id: string): Promise<boolean> {
    // Delete quote items first (foreign key constraint)
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    
    // Delete quote
    const result = await db.delete(quotes).where(eq(quotes.id, id)).returning();
    
    return result.length > 0;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // Get current and last month date ranges
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const firstDayThisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count active patients (all patients in the system)
    const patientsCount = await db
      .select({ count: count() })
      .from(patients);
    
    const activePatientsCount = Number(patientsCount[0]?.count || 0);
    
    // Count quotes this month
    const quotesThisMonthResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(gte(quotes.createdAt, firstDayThisMonth));
    
    const quotesThisMonth = Number(quotesThisMonthResult[0]?.count || 0);
    
    // Count quotes last month
    const quotesLastMonthResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          gte(quotes.createdAt, firstDayLastMonth),
          sql`${quotes.createdAt} < ${firstDayThisMonth}`
        )
      );
    
    const quotesLastMonth = Number(quotesLastMonthResult[0]?.count || 0);
    
    // Calculate average ticket for this month
    const avgTicketResult = await db
      .select({ avg: sql<string>`AVG(CAST(${quotes.total} AS DECIMAL))` })
      .from(quotes)
      .where(gte(quotes.createdAt, firstDayThisMonth));
    
    const averageTicket = Number(avgTicketResult[0]?.avg || 0);
    
    // Calculate conversion rate (accepted quotes / total quotes this month)
    const acceptedQuotesResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          gte(quotes.createdAt, firstDayThisMonth),
          eq(quotes.status, "accepted")
        )
      );
    
    const acceptedQuotes = Number(acceptedQuotesResult[0]?.count || 0);
    const conversionRate = quotesThisMonth > 0 
      ? (acceptedQuotes / quotesThisMonth) * 100 
      : 0;
    
    return {
      activePatientsCount,
      quotesThisMonth,
      quotesLastMonth,
      averageTicket,
      conversionRate,
      acceptedQuotes,
    };
  }

  async getRecentQuotes(limit: number = 5): Promise<QuoteWithDetails[]> {
    // Get recent quotes with their patients
    const recentQuotesData = await db
      .select()
      .from(quotes)
      .leftJoin(patients, eq(quotes.patientId, patients.id))
      .orderBy(desc(quotes.createdAt))
      .limit(limit);

    if (recentQuotesData.length === 0) {
      return [];
    }

    // Get all items for these quotes
    const quoteIds = recentQuotesData.map(q => q.quotes.id);
    const allItems = await db
      .select()
      .from(quoteItems)
      .leftJoin(procedures, eq(quoteItems.procedureId, procedures.id))
      .where(inArray(quoteItems.quoteId, quoteIds));

    // Group items by quote
    const itemsByQuote = new Map<string, Array<QuoteItem & { procedure: Procedure }>>();
    
    for (const item of allItems) {
      if (!itemsByQuote.has(item.quote_items.quoteId)) {
        itemsByQuote.set(item.quote_items.quoteId, []);
      }
      itemsByQuote.get(item.quote_items.quoteId)!.push({
        ...item.quote_items,
        procedure: item.procedures!
      });
    }

    // Combine everything
    return recentQuotesData.map(q => ({
      ...q.quotes,
      patient: q.patients!,
      items: itemsByQuote.get(q.quotes.id) || []
    }));
  }

  async getReportsMetrics(): Promise<ReportsMetrics> {
    // Get current month date range
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Calculate average ticket for this month
    const avgTicketResult = await db
      .select({ avg: sql<string>`AVG(CAST(${quotes.total} AS DECIMAL))` })
      .from(quotes)
      .where(gte(quotes.createdAt, firstDayThisMonth));
    
    const averageTicket = Number(avgTicketResult[0]?.avg || 0);
    
    // Calculate average discount for this month (including quotes with 0 discount)
    const avgDiscountResult = await db
      .select({ avg: sql<string>`AVG(CAST(${quotes.discount} AS DECIMAL))` })
      .from(quotes)
      .where(gte(quotes.createdAt, firstDayThisMonth));
    
    const averageDiscount = Number(avgDiscountResult[0]?.avg || 0);
    
    // Count quotes this month
    const quotesThisMonthResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(gte(quotes.createdAt, firstDayThisMonth));
    
    const quotesThisMonth = Number(quotesThisMonthResult[0]?.count || 0);
    
    // Count accepted quotes this month
    const acceptedQuotesResult = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          gte(quotes.createdAt, firstDayThisMonth),
          eq(quotes.status, 'accepted')
        )
      );
    
    const acceptedQuotes = Number(acceptedQuotesResult[0]?.count || 0);
    
    // Calculate conversion rate
    const conversionRate = quotesThisMonth > 0 
      ? (acceptedQuotes / quotesThisMonth) * 100 
      : 0;
    
    // Get top procedures by sales count and revenue
    const topProceduresResult = await db
      .select({
        procedureId: quoteItems.procedureId,
        sales: sql<number>`COUNT(${quoteItems.id})::int`,
        revenue: sql<string>`SUM(CAST(${quoteItems.subtotal} AS DECIMAL))`,
      })
      .from(quoteItems)
      .leftJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(gte(quotes.createdAt, firstDayThisMonth))
      .groupBy(quoteItems.procedureId)
      .orderBy(sql`COUNT(${quoteItems.id}) DESC`)
      .limit(5);
    
    // Get procedure names
    const topProcedures: TopProcedure[] = [];
    for (const item of topProceduresResult) {
      const procedure = await db
        .select()
        .from(procedures)
        .where(eq(procedures.id, item.procedureId))
        .limit(1);
      
      if (procedure[0]) {
        topProcedures.push({
          name: procedure[0].name,
          sales: item.sales,
          revenue: Number(item.revenue || 0),
        });
      }
    }
    
    return {
      averageTicket,
      averageDiscount,
      conversionRate,
      acceptedQuotes,
      quotesThisMonth,
      topProcedures,
    };
  }

  async getPatients(filters?: PatientFilters): Promise<PatientWithStats[]> {
    // Build base query with aggregations
    const baseQuery = db
      .select({
        id: patients.id,
        name: patients.name,
        phone: patients.phone,
        email: patients.email,
        cpf: patients.cpf,
        birthDate: patients.birthDate,
        address: patients.address,
        city: patients.city,
        state: patients.state,
        origin: patients.origin,
        tags: patients.tags,
        createdAt: patients.createdAt,
        quoteCount: sql<number>`CAST(COUNT(DISTINCT ${quotes.id}) AS INTEGER)`,
        totalBudget: sql<number>`COALESCE(SUM(CAST(${quotes.total} AS DECIMAL)), 0)`,
        acceptedBudget: sql<number>`COALESCE(SUM(CASE WHEN ${quotes.status} = 'accepted' THEN CAST(${quotes.total} AS DECIMAL) ELSE 0 END), 0)`,
        lastQuoteDate: sql<string>`MAX(${quotes.createdAt})`,
      })
      .from(patients)
      .leftJoin(quotes, eq(patients.id, quotes.patientId))
      .groupBy(
        patients.id,
        patients.name,
        patients.phone,
        patients.email,
        patients.cpf,
        patients.birthDate,
        patients.address,
        patients.city,
        patients.state,
        patients.origin,
        patients.tags,
        patients.createdAt
      );

    // Apply filters if provided
    const conditions: any[] = [];

    if (filters?.search) {
      conditions.push(sql`${patients.name} ILIKE ${`%${filters.search}%`}`);
    }

    if (filters?.createdFrom) {
      conditions.push(gte(patients.createdAt, filters.createdFrom));
    }

    if (filters?.createdTo) {
      const toDate = new Date(filters.createdTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(sql`${patients.createdAt} <= ${toDate.toISOString()}`);
    }

    if (filters?.origins && filters.origins.length > 0) {
      conditions.push(inArray(patients.origin, filters.origins));
    }

    if (filters?.cities && filters.cities.length > 0) {
      conditions.push(inArray(patients.city, filters.cities));
    }

    if (filters?.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => sql`${patients.tags} @> ARRAY[${tag}]::text[]`);
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }

    // Execute query with conditions
    let query = baseQuery;
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(patients.createdAt));

    // Apply budget and quote filters after aggregation
    let filteredResults = results.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      cpf: r.cpf,
      birthDate: r.birthDate,
      address: r.address,
      city: r.city,
      state: r.state,
      origin: r.origin,
      tags: r.tags,
      createdAt: r.createdAt,
      quoteCount: Number(r.quoteCount),
      totalBudget: Number(r.totalBudget),
      acceptedBudget: Number(r.acceptedBudget),
      lastQuoteDate: r.lastQuoteDate,
    }));

    if (filters?.minBudget !== undefined && filters.minBudget > 0) {
      filteredResults = filteredResults.filter(p => p.totalBudget >= filters.minBudget!);
    }

    if (filters?.maxBudget !== undefined && filters.maxBudget > 0) {
      filteredResults = filteredResults.filter(p => p.totalBudget <= filters.maxBudget!);
    }

    if (filters?.hasQuotes !== undefined) {
      filteredResults = filteredResults.filter(p => filters.hasQuotes ? p.quoteCount > 0 : p.quoteCount === 0);
    }

    return filteredResults;
  }

  async createPatient(insertPatient: Partial<Omit<Patient, 'id'>> & { name: string }): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<Omit<Patient, 'id'>>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getProcedures(): Promise<Procedure[]> {
    return await db.select().from(procedures).orderBy(procedures.displayOrder, procedures.name);
  }

  async createProcedure(insertProcedure: InsertProcedure): Promise<Procedure> {
    const [procedure] = await db.insert(procedures).values({
      ...insertProcedure,
      price: insertProcedure.price.toString(),
      discountedPrice: insertProcedure.discountedPrice?.toString(),
      mlPrice: insertProcedure.mlPrice?.toString(),
      minMl: insertProcedure.minMl?.toString(),
      maxMl: insertProcedure.maxMl?.toString(),
    }).returning();
    return procedure;
  }

  async updateProcedure(id: string, updateData: Partial<InsertProcedure>): Promise<Procedure | undefined> {
    const dbData: any = { ...updateData };
    if (dbData.price !== undefined && dbData.price !== null) {
      dbData.price = dbData.price.toString();
    }
    if (dbData.discountedPrice !== undefined) {
      dbData.discountedPrice = dbData.discountedPrice !== null ? dbData.discountedPrice.toString() : null;
    }
    if (dbData.mlPrice !== undefined) {
      dbData.mlPrice = dbData.mlPrice !== null ? dbData.mlPrice.toString() : null;
    }
    if (dbData.minMl !== undefined) {
      dbData.minMl = dbData.minMl !== null ? dbData.minMl.toString() : null;
    }
    if (dbData.maxMl !== undefined) {
      dbData.maxMl = dbData.maxMl !== null ? dbData.maxMl.toString() : null;
    }
    
    const [updated] = await db
      .update(procedures)
      .set(dbData)
      .where(eq(procedures.id, id))
      .returning();
    
    return updated;
  }

  async deleteProcedure(id: string): Promise<boolean> {
    const result = await db.delete(procedures).where(eq(procedures.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getClinicSettings(): Promise<ClinicSettings | undefined> {
    const [settings] = await db.select().from(clinicSettings).limit(1);
    return settings;
  }

  async updateClinicSettings(insertSettings: InsertClinicSettings): Promise<ClinicSettings> {
    // Check if settings exist
    const existing = await this.getClinicSettings();
    
    const dbData: any = {
      ...insertSettings,
      monthlyGoal: insertSettings.monthlyGoal?.toString(),
      conversionGoal: insertSettings.conversionGoal?.toString(),
    };

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(clinicSettings)
        .set(dbData)
        .where(eq(clinicSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(clinicSettings)
        .values(dbData)
        .returning();
      return created;
    }
  }
}

export const storage = new MemStorage();

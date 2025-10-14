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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quote methods
  createQuote(quote: InsertQuote, items: CreateQuoteItem[]): Promise<Quote>;
  getQuotes(): Promise<QuoteWithDetails[]>;
  getQuoteById(id: string): Promise<QuoteWithDetails | undefined>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<boolean>;
  
  // Dashboard methods
  getDashboardStats(): Promise<DashboardStats>;
  getRecentQuotes(limit?: number): Promise<QuoteWithDetails[]>;
  
  // Patient methods
  getPatients(): Promise<Patient[]>;
  createPatient(patient: Partial<Omit<Patient, 'id'>> & { name: string }): Promise<Patient>;
  
  // Procedure methods
  getProcedures(): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: string, procedure: Partial<InsertProcedure>): Promise<Procedure | undefined>;
  
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

  // Quote methods - using database directly
  async createQuote(insertQuote: InsertQuote, items: CreateQuoteItem[]): Promise<Quote> {
    // Wrap in transaction for atomicity
    return await db.transaction(async (tx) => {
      // Convert numbers to strings for decimal fields
      const quoteData = {
        ...insertQuote,
        total: insertQuote.total.toString(),
        discount: insertQuote.discount?.toString(),
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

  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(patients.name);
  }

  async createPatient(insertPatient: Partial<Omit<Patient, 'id'>> & { name: string }): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async getProcedures(): Promise<Procedure[]> {
    return await db.select().from(procedures).orderBy(procedures.name);
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
    if (dbData.price !== undefined) {
      dbData.price = dbData.price.toString();
    }
    if (dbData.discountedPrice !== undefined) {
      dbData.discountedPrice = dbData.discountedPrice.toString();
    }
    if (dbData.mlPrice !== undefined) {
      dbData.mlPrice = dbData.mlPrice.toString();
    }
    if (dbData.minMl !== undefined) {
      dbData.minMl = dbData.minMl.toString();
    }
    if (dbData.maxMl !== undefined) {
      dbData.maxMl = dbData.maxMl.toString();
    }
    
    const [updated] = await db
      .update(procedures)
      .set(dbData)
      .where(eq(procedures.id, id))
      .returning();
    
    return updated;
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

import { 
  type User, 
  type InsertUser, 
  type Quote,
  type InsertQuote,
  type QuoteItem,
  type InsertQuoteItem,
  type Patient,
  type Procedure
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { quotes, quoteItems, patients, procedures } from "@shared/schema";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface QuoteWithDetails extends Quote {
  patient: Patient;
  items: Array<QuoteItem & { procedure: Procedure }>;
}

// Type for creating quote items without quoteId (will be added by createQuote)
export type CreateQuoteItem = Omit<InsertQuoteItem, 'quoteId'>;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quote methods
  createQuote(quote: InsertQuote, items: CreateQuoteItem[]): Promise<Quote>;
  getQuotes(): Promise<QuoteWithDetails[]>;
  getQuoteById(id: string): Promise<QuoteWithDetails | undefined>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
}

export const storage = new MemStorage();

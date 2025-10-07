import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteSchema, insertQuoteItemSchema } from "@shared/schema";
import { z } from "zod";

// Schema for creating a quote with items
const createQuoteBodySchema = z.object({
  patientId: z.string(),
  total: z.number().positive(),
  discount: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    procedureId: z.string(),
    quantity: z.number().positive(),
    customPrice: z.number().positive().optional(),
    subtotal: z.number().positive(),
  })).min(1, "At least one item is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api

  // Create a quote with items
  app.post("/api/quotes", async (req: Request, res: Response) => {
    try {
      const body = createQuoteBodySchema.parse(req.body);
      
      const quoteData = {
        patientId: body.patientId,
        total: body.total,
        discount: body.discount,
        status: body.status || "pending",
        notes: body.notes,
      };
      
      const quote = await storage.createQuote(quoteData, body.items);
      
      res.status(201).json(quote);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error creating quote:", error);
        res.status(500).json({ error: "Failed to create quote" });
      }
    }
  });

  // Get all quotes with details
  app.get("/api/quotes", async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Get a specific quote by ID with details
  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      
      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  // Update a quote
  app.put("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const updateData = insertQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateQuote(req.params.id, updateData);
      
      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }
      
      res.json(quote);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error updating quote:", error);
        res.status(500).json({ error: "Failed to update quote" });
      }
    }
  });

  // Delete a quote
  app.delete("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteQuote(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

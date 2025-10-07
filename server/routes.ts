import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteSchema, insertQuoteItemSchema, insertUserSchema, loginUserSchema, insertPatientSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

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

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const body = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        res.status(400).json({ error: "Email já cadastrado" });
        return;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      // Create user
      const user = await storage.createUser({
        name: body.name,
        email: body.email,
        password: hashedPassword,
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Erro ao criar usuário" });
      }
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const body = loginUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(body.email);
      if (!user) {
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(body.password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Erro ao fazer login" });
      }
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(401).json({ error: "Usuário não encontrado" });
        return;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error logging out:", err);
        res.status(500).json({ error: "Erro ao fazer logout" });
      } else {
        res.status(204).send();
      }
    });
  });

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

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-quotes", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentQuotes = await storage.getRecentQuotes(limit);
      res.json(recentQuotes);
    } catch (error) {
      console.error("Error fetching recent quotes:", error);
      res.status(500).json({ error: "Failed to fetch recent quotes" });
    }
  });

  // Patient routes
  app.get("/api/patients", async (req: Request, res: Response) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Erro ao buscar pacientes" });
    }
  });

  app.post("/api/patients", async (req: Request, res: Response) => {
    try {
      const body = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(body);
      res.status(201).json(patient);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error creating patient:", error);
        res.status(500).json({ error: "Erro ao criar paciente" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

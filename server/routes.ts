import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteSchema, insertQuoteItemSchema, insertUserSchema, loginUserSchema, insertPatientSchema, insertProcedureSchema, insertClinicSettingsSchema, insertPatientPhotoSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import { ObjectStorageService, objectStorageClient, parseObjectPath } from "./objectStorage";

// Schema for creating a quote with items
const createQuoteBodySchema = z.object({
  patientId: z.string(),
  total: z.number().positive(),
  discount: z.number().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  installments: z.number().int().min(1).optional(),
  downPayment: z.number().min(0).optional().refine((val) => val === undefined || val === 0 || !isNaN(val), {
    message: "Down payment must be a valid number"
  }),
  bonusList: z.array(z.string()).optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    procedureId: z.string(),
    quantity: z.number().positive(),
    customPrice: z.number().positive().optional(),
    subtotal: z.number().positive(),
    note: z.string().optional(),
  })).min(1, "At least one item is required"),
});

// Schema for updating a quote with items
const updateQuoteBodySchema = createQuoteBodySchema.partial();

// Schema for changing password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

// Schema for patient filters query parameters
const patientsQuerySchema = z.object({
  search: z.string().optional(),
  createdFrom: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Data inicial inválida"
  }),
  createdTo: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Data final inválida"
  }),
  minBudget: z.union([z.string(), z.number()]).pipe(z.coerce.number()).optional(),
  maxBudget: z.union([z.string(), z.number()]).pipe(z.coerce.number()).optional(),
  origins: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val : val ? [val] : undefined
  ).optional(),
  cities: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val : val ? [val] : undefined
  ).optional(),
  tags: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val : val ? [val] : undefined
  ).optional(),
  hasQuotes: z.union([z.string(), z.boolean()]).transform(val => 
    typeof val === 'string' ? val === 'true' : val
  ).optional(),
}).refine(data => {
  if (data.minBudget !== undefined && data.maxBudget !== undefined) {
    return data.minBudget <= data.maxBudget;
  }
  return true;
}, {
  message: "minBudget deve ser menor ou igual a maxBudget",
  path: ["minBudget"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api

  // Configure multer for file uploads (memory storage)
  const upload = multer({ storage: multer.memoryStorage() });

  // Initialize Object Storage Service
  const objectStorageService = new ObjectStorageService();

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

  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const body = changePasswordSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(body.currentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Senha atual incorreta" });
        return;
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Erro ao alterar senha" });
      }
    }
  });

  // Create a quote with items
  app.post("/api/quotes", async (req: Request, res: Response) => {
    try {
      const body = createQuoteBodySchema.parse(req.body);
      
      // Validate downPayment does not exceed total
      if (body.downPayment !== undefined && body.downPayment > body.total) {
        res.status(400).json({ error: "Valor de entrada não pode exceder o total" });
        return;
      }
      
      const quoteData = {
        patientId: body.patientId,
        total: body.total,
        discount: body.discount,
        discountPercentage: body.discountPercentage !== undefined ? body.discountPercentage : undefined,
        installments: body.installments || 1,
        downPayment: body.downPayment,
        bonusList: body.bonusList || [],
        status: (body.status || "pending") as "pending" | "accepted" | "rejected",
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
      const body = updateQuoteBodySchema.parse(req.body);
      
      // Validate downPayment does not exceed total
      if (body.downPayment !== undefined) {
        // Get existing quote to check total
        const existingQuote = await storage.getQuoteById(req.params.id);
        if (!existingQuote) {
          res.status(404).json({ error: "Quote not found" });
          return;
        }
        
        const totalToCheck = body.total !== undefined 
          ? body.total 
          : parseFloat(existingQuote.total);
        
        if (body.downPayment > totalToCheck) {
          res.status(400).json({ error: "Valor de entrada não pode exceder o total" });
          return;
        }
      }
      
      // Extract items from body
      const { items, ...quoteData } = body;
      
      // Cast status to proper type if present
      const updateData: any = { ...quoteData };
      if (updateData.status) {
        updateData.status = updateData.status as "pending" | "accepted" | "rejected";
      }
      
      // Update quote data
      const quote = await storage.updateQuote(req.params.id, updateData);
      
      if (!quote) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }
      
      // If items are provided, update them
      if (items && items.length > 0) {
        await storage.updateQuoteItems(req.params.id, items);
      }
      
      // Return updated quote with items
      const updatedQuote = await storage.getQuoteById(req.params.id);
      res.json(updatedQuote);
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

  // Reports endpoints
  app.get("/api/reports/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getReportsMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching reports metrics:", error);
      res.status(500).json({ error: "Failed to fetch reports metrics" });
    }
  });

  // Patient routes
  app.get("/api/patients", async (req: Request, res: Response) => {
    try {
      // Parse and validate query parameters
      const filters = patientsQuerySchema.parse(req.query);
      
      // Get patients with applied filters
      const patients = await storage.getPatients(filters);
      
      res.json(patients);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Parâmetros de filtro inválidos", details: error.errors });
        return;
      }
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

  app.patch("/api/patients/:id", async (req: Request, res: Response) => {
    try {
      const updateData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, updateData);
      
      if (!patient) {
        res.status(404).json({ error: "Paciente não encontrado" });
        return;
      }
      
      res.json(patient);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error updating patient:", error);
        res.status(500).json({ error: "Erro ao atualizar paciente" });
      }
    }
  });

  app.delete("/api/patients/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deletePatient(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: "Paciente não encontrado" });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting patient:", error);
      
      // Check for foreign key constraint violation
      if (error.code === '23503') {
        res.status(400).json({ 
          error: "Não é possível excluir este paciente pois ele possui orçamentos associados. Exclua os orçamentos primeiro." 
        });
        return;
      }
      
      res.status(500).json({ error: "Erro ao excluir paciente" });
    }
  });

  // Patient photo routes
  app.post("/api/patients/:id/photos", upload.single("photo"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhuma foto enviada" });
        return;
      }

      const patientId = req.params.id;
      const caption = req.body.caption || "";
      
      console.log("📸 [UPLOAD PHOTO] Request body:", req.body);
      console.log("📸 [UPLOAD PHOTO] Caption value:", caption);
      console.log("📸 [UPLOAD PHOTO] Caption type:", typeof caption);
      console.log("📸 [UPLOAD PHOTO] Caption length:", caption.length);
      
      // Generate unique filename using PRIVATE_OBJECT_DIR
      const timestamp = Date.now();
      const extension = req.file.originalname.split('.').pop();
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/patient-photos/${patientId}/${timestamp}.${extension}`;
      const publicUrl = `/patient-photos/${patientId}/${timestamp}.${extension}`;
      
      // Upload to object storage
      await objectStorageService.uploadFromBytes(fullPath, req.file.buffer);
      
      // Create photo record in database
      const photo = await storage.createPatientPhoto({
        patientId,
        photoUrl: publicUrl,
        caption,
      });
      
      console.log("💾 [UPLOAD PHOTO] Saved photo:", JSON.stringify(photo, null, 2));
      
      res.status(201).json(photo);
    } catch (error: any) {
      console.error("Error uploading patient photo:", error);
      res.status(500).json({ error: "Erro ao fazer upload da foto" });
    }
  });

  app.get("/api/patients/:id/photos", async (req: Request, res: Response) => {
    try {
      const patientId = req.params.id;
      const photos = await storage.getPatientPhotos(patientId);
      res.json(photos);
    } catch (error: any) {
      console.error("Error fetching patient photos:", error);
      res.status(500).json({ error: "Erro ao buscar fotos" });
    }
  });

  // Serve patient photos
  app.get("/patient-photos/*", async (req: Request, res: Response) => {
    try {
      const photoPath = req.path.replace("/patient-photos/", "");
      const privateDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateDir}/patient-photos/${photoPath}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "Foto não encontrada" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      console.error("Error serving patient photo:", error);
      res.status(500).json({ error: "Erro ao carregar foto" });
    }
  });

  app.delete("/api/patient-photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = req.params.id;
      
      // Get photo to delete file from storage
      const photos = await storage.getPatientPhotos("");
      const photo = photos.find(p => p.id === photoId);
      
      if (photo) {
        // Delete from object storage
        try {
          // Convert public URL back to full path
          const photoPath = photo.photoUrl.replace("/patient-photos/", "");
          const privateDir = objectStorageService.getPrivateObjectDir();
          const fullPath = `${privateDir}/patient-photos/${photoPath}`;
          
          await objectStorageService.deleteObject(fullPath);
        } catch (err) {
          console.error("Error deleting file from object storage:", err);
        }
      }
      
      // Delete from database
      const success = await storage.deletePatientPhoto(photoId);
      
      if (!success) {
        res.status(404).json({ error: "Foto não encontrada" });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting patient photo:", error);
      res.status(500).json({ error: "Erro ao excluir foto" });
    }
  });

  // Procedure routes
  app.get("/api/procedures", async (req: Request, res: Response) => {
    try {
      const procedures = await storage.getProcedures();
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ error: "Erro ao buscar procedimentos" });
    }
  });

  app.post("/api/procedures", async (req: Request, res: Response) => {
    try {
      const body = insertProcedureSchema.parse(req.body);
      const procedure = await storage.createProcedure(body);
      res.status(201).json(procedure);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error creating procedure:", error);
        res.status(500).json({ error: "Erro ao criar procedimento" });
      }
    }
  });

  app.put("/api/procedures/:id", async (req: Request, res: Response) => {
    try {
      console.log("RAW BODY:", JSON.stringify(req.body, null, 2));
      const updateData = insertProcedureSchema.partial().parse(req.body);
      console.log("PARSED DATA:", JSON.stringify(updateData, null, 2));
      const procedure = await storage.updateProcedure(req.params.id, updateData);
      console.log("RETURNED PROCEDURE:", JSON.stringify(procedure, null, 2));
      
      if (!procedure) {
        res.status(404).json({ error: "Procedimento não encontrado" });
        return;
      }
      
      res.json(procedure);
    } catch (error: any) {
      if (error.name === "ZodError") {
        console.log("ZOD ERROR:", error.errors);
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error updating procedure:", error);
        res.status(500).json({ error: "Erro ao atualizar procedimento" });
      }
    }
  });

  app.delete("/api/procedures/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteProcedure(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: "Procedimento não encontrado" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting procedure:", error);
      res.status(500).json({ error: "Erro ao excluir procedimento" });
    }
  });

  // Clinic Settings routes
  app.get("/api/clinic-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getClinicSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching clinic settings:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.put("/api/clinic-settings", async (req: Request, res: Response) => {
    try {
      const body = insertClinicSettingsSchema.parse(req.body);
      const settings = await storage.updateClinicSettings(body);
      res.json(settings);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
      } else {
        console.error("Error updating clinic settings:", error);
        res.status(500).json({ error: "Erro ao atualizar configurações" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

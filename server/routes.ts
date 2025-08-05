import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema, insertLocationSchema, insertUpgradeRecommendationSchema } from "@shared/schema";
import { calculateEnergyPerformance } from "../client/src/lib/calculation-engine";

export async function registerRoutes(app: Express): Promise<Server> {
  // Assessment routes
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(validatedData);
      
      // Calculate performance metrics
      const location = assessment.locationId ? await storage.getLocation(assessment.locationId) : null;
      const results = calculateEnergyPerformance(assessment, location);
      
      // Update assessment with calculated results
      const updatedAssessment = await storage.updateAssessment(assessment.id, {
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
      });

      res.json(updatedAssessment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create assessment" });
      }
    }
  });

  app.put("/api/assessments/:id", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateAssessment(req.params.id, validatedData);
      
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Recalculate performance metrics
      const location = assessment.locationId ? await storage.getLocation(assessment.locationId) : null;
      const results = calculateEnergyPerformance(assessment, location);
      
      // Update assessment with recalculated results
      const updatedAssessment = await storage.updateAssessment(assessment.id, {
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
      });

      res.json(updatedAssessment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update assessment" });
      }
    }
  });

  app.delete("/api/assessments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAssessment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete assessment" });
    }
  });

  // Location routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      res.json(location);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create location" });
      }
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(req.params.id, validatedData);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update location" });
      }
    }
  });

  // Upgrade recommendations routes
  app.get("/api/assessments/:id/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getUpgradeRecommendations(req.params.id);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upgrade recommendations" });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const validatedData = insertUpgradeRecommendationSchema.parse(req.body);
      const recommendation = await storage.createUpgradeRecommendation(validatedData);
      res.json(recommendation);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create upgrade recommendation" });
      }
    }
  });

  // Calculate performance endpoint
  app.post("/api/calculate", async (req, res) => {
    try {
      const assessment = req.body.assessment;
      const location = req.body.locationId ? await storage.getLocation(req.body.locationId) : null;
      const results = calculateEnergyPerformance(assessment, location);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

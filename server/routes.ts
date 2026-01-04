import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema, insertLocationSchema, insertUpgradeRecommendationSchema, calculationOptionsSchema } from "@shared/schema";
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
      
      // Calculate performance metrics with future year projection if specified
      const location = assessment.locationId ? await storage.getLocation(assessment.locationId) : null;
      const options = assessment.futureYear ? { futureYear: assessment.futureYear } : undefined;
      const results = calculateEnergyPerformance(assessment, location, options);
      
      // Update assessment with calculated results by directly modifying the assessment object
      assessment.energyDemand = results.energyDemand;
      assessment.carbonEmissions = results.carbonEmissions;
      assessment.annualCost = results.annualCost;
      assessment.eiScore = results.eiScore;

      res.json({ ...assessment, formFactor: results.formFactor, projectedYear: results.projectedYear, adjustedElectricityCarbon: results.adjustedElectricityCarbon });
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

      // Recalculate performance metrics with future year projection if specified
      const location = assessment.locationId ? await storage.getLocation(assessment.locationId) : null;
      const options = assessment.futureYear ? { futureYear: assessment.futureYear } : undefined;
      const results = calculateEnergyPerformance(assessment, location, options);
      
      // Update assessment with recalculated results
      assessment.energyDemand = results.energyDemand;
      assessment.carbonEmissions = results.carbonEmissions;
      assessment.annualCost = results.annualCost;
      assessment.eiScore = results.eiScore;

      res.json({ ...assessment, formFactor: results.formFactor, projectedYear: results.projectedYear, adjustedElectricityCarbon: results.adjustedElectricityCarbon });
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

  // Clone assessment endpoint
  app.post("/api/assessments/:id/clone", async (req, res) => {
    try {
      const original = await storage.getAssessment(req.params.id);
      if (!original) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const cloneName = req.body.name || `${original.name} (Copy)`;
      
      // Build clone data from original, using defaults for null values
      const cloneData = {
        name: cloneName,
        version: original.version || 1,
        insulation: original.insulation ?? "standard",
        airChanges: original.airChanges ?? "standard",
        capacity: original.capacity ?? "high",
        exposure: original.exposure ?? "detached",
        shape: original.shape ?? "2-storey",
        windowSize: original.windowSize ?? "standard",
        heatingFuel: original.heatingFuel ?? "main_gas",
        heatingType: original.heatingType ?? "boiler_h_eff",
        hotWaterType: original.hotWaterType ?? "main_tank",
        controls: Array.isArray(original.controls) ? original.controls : [],
        lightingType: original.lightingType ?? "0% lel",
        ventilationType: original.ventilationType ?? "nat / wet ext",
        renewables: original.renewables ?? "none",
        climate: original.climate ?? "UK std",
        heatingDemand: original.heatingDemand ?? "Scot std",
        hotWaterDemand: original.hotWaterDemand ?? "Scot std",
        appliances: original.appliances ?? "standard",
        gridIntensity: original.gridIntensity ?? "UK std",
        tariff: original.tariff ?? "standard",
        capital: original.capital ?? "standard",
        futureYear: original.futureYear,
        locationId: original.locationId,
      };

      // Validate through schema
      const validatedData = insertAssessmentSchema.parse(cloneData);
      
      // Create the cloned assessment (does not mutate original)
      const clonedAssessment = await storage.createAssessment(validatedData);
      
      // Calculate performance metrics for the new assessment
      const location = clonedAssessment.locationId ? await storage.getLocation(clonedAssessment.locationId) : null;
      const options = clonedAssessment.futureYear ? { futureYear: clonedAssessment.futureYear } : undefined;
      const results = calculateEnergyPerformance(clonedAssessment, location, options);

      // Persist calculated results to the cloned assessment
      clonedAssessment.energyDemand = results.energyDemand;
      clonedAssessment.carbonEmissions = results.carbonEmissions;
      clonedAssessment.annualCost = results.annualCost;
      clonedAssessment.eiScore = results.eiScore;

      res.json({
        ...clonedAssessment,
        formFactor: results.formFactor,
        projectedYear: results.projectedYear,
        adjustedElectricityCarbon: results.adjustedElectricityCarbon,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to clone assessment" });
      }
    }
  });

  // Compare assessments endpoint - returns typed DTO for comparison
  app.post("/api/assessments/compare", async (req, res) => {
    try {
      const { baselineId, upgradeId } = req.body;
      
      const baseline = await storage.getAssessment(baselineId);
      const upgrade = await storage.getAssessment(upgradeId);
      
      if (!baseline || !upgrade) {
        return res.status(404).json({ error: "One or both assessments not found" });
      }

      const baselineLocation = baseline.locationId ? await storage.getLocation(baseline.locationId) : null;
      const upgradeLocation = upgrade.locationId ? await storage.getLocation(upgrade.locationId) : null;

      // Calculate fresh results from sanitized assessment data
      const baselineResults = calculateEnergyPerformance(baseline, baselineLocation);
      const upgradeResults = calculateEnergyPerformance(upgrade, upgradeLocation);

      // Calculate differences using freshly calculated results
      const energySavings = baselineResults.energyDemand - upgradeResults.energyDemand;
      const costSavings = baselineResults.annualCost - upgradeResults.annualCost;
      const carbonSavings = baselineResults.carbonEmissions - upgradeResults.carbonEmissions;
      const eiImprovement = upgradeResults.eiScore - baselineResults.eiScore;

      // Return typed comparison DTO
      res.json({
        baseline: {
          id: baseline.id,
          name: baseline.name,
          results: {
            energyDemand: baselineResults.energyDemand,
            carbonEmissions: baselineResults.carbonEmissions,
            annualCost: baselineResults.annualCost,
            eiScore: baselineResults.eiScore,
          }
        },
        upgrade: {
          id: upgrade.id,
          name: upgrade.name,
          results: {
            energyDemand: upgradeResults.energyDemand,
            carbonEmissions: upgradeResults.carbonEmissions,
            annualCost: upgradeResults.annualCost,
            eiScore: upgradeResults.eiScore,
          }
        },
        comparison: {
          energySavings,
          costSavings,
          carbonSavings,
          eiImprovement,
          energySavingsPercent: baselineResults.energyDemand > 0 
            ? Math.round((energySavings / baselineResults.energyDemand) * 100) 
            : 0,
          costSavingsPercent: baselineResults.annualCost > 0 
            ? Math.round((costSavings / baselineResults.annualCost) * 100) 
            : 0,
          carbonSavingsPercent: baselineResults.carbonEmissions > 0 
            ? Math.round((carbonSavings / baselineResults.carbonEmissions) * 100) 
            : 0,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to compare assessments" });
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

  // Calculate performance endpoint with optional future year projection
  app.post("/api/calculate", async (req, res) => {
    try {
      const assessment = req.body.assessment;
      const locationId = req.body.locationId;
      const rawOptions = req.body.options;
      
      // Validate calculation options if provided
      const options = rawOptions ? calculationOptionsSchema.parse(rawOptions) : undefined;
      
      const location = locationId ? await storage.getLocation(locationId) : null;
      const results = calculateEnergyPerformance(assessment, location, options);
      res.json(results);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to calculate performance" });
      }
    }
  });

  // Degree Days Calculator API endpoint
  app.post("/api/calculate-degree-days", async (req, res) => {
    try {
      const { dailyHighs, dailyLows, baseTemp = 18.3 } = req.body;
      
      if (!Array.isArray(dailyHighs) || !Array.isArray(dailyLows)) {
        return res.status(400).json({ error: "dailyHighs and dailyLows must be arrays" });
      }
      
      if (dailyHighs.length !== dailyLows.length) {
        return res.status(400).json({ error: "dailyHighs and dailyLows arrays must have the same length" });
      }
      
      // Calculate degree days using weather.gov methodology
      let heatingDD = 0;
      let coolingDD = 0;
      
      for (let i = 0; i < dailyHighs.length; i++) {
        const dailyMean = (dailyHighs[i] + dailyLows[i]) / 2;
        
        if (dailyMean < baseTemp) {
          heatingDD += baseTemp - dailyMean;
        } else if (dailyMean > baseTemp) {
          coolingDD += dailyMean - baseTemp;
        }
      }
      
      res.json({
        heatingDegreeDays: Math.round(heatingDD),
        coolingDegreeDays: Math.round(coolingDD),
        daysCalculated: dailyHighs.length,
        baseTemperature: baseTemp
      });
    } catch (error) {
      console.error('Degree days calculation error:', error);
      res.status(500).json({ error: "Failed to calculate degree days" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

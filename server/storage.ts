import { type Assessment, type InsertAssessment, type Location, type InsertLocation, type UpgradeRecommendation, type InsertUpgradeRecommendation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Assessment operations
  getAssessment(id: string): Promise<Assessment | null>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, assessment: Partial<InsertAssessment>): Promise<Assessment | null>;
  deleteAssessment(id: string): Promise<boolean>;
  
  // Location operations
  getLocation(id: string): Promise<Location | null>;
  getAllLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | null>;
  deleteLocation(id: string): Promise<boolean>;
  
  // Upgrade recommendation operations
  getUpgradeRecommendations(assessmentId: string): Promise<UpgradeRecommendation[]>;
  createUpgradeRecommendation(recommendation: InsertUpgradeRecommendation): Promise<UpgradeRecommendation>;
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;
  private locations: Map<string, Location>;
  private upgradeRecommendations: Map<string, UpgradeRecommendation>;

  constructor() {
    this.assessments = new Map();
    this.locations = new Map();
    this.upgradeRecommendations = new Map();
    
    // Initialize with default locations
    this.initializeDefaultLocations();
  }

  private initializeDefaultLocations() {
    const defaultLocations: Location[] = [
      {
        id: randomUUID(),
        name: "Glasgow, Scotland",
        country: "Scotland",
        region: "Central Belt",
        heatingDegreeDays: 2650,
        coolingDegreeDays: 20,
        solarRadiation: 950,
        averageTemp: 8.5,
        windSpeed: 4.4,
        gasCost: 7.2,
        electricityCost: 28.5,
        oilCost: 85,
        woodCost: 290,
        gasCarbon: 0.184,
        electricityCarbon: 0.233,
        oilCarbon: 2.52,
        woodCarbon: 0.025,
        buildingStandards: {
          wallUValue: 0.30,
          roofUValue: 0.16,
          floorUValue: 0.22,
          windowUValue: 1.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "London, England",
        country: "England",
        region: "South East",
        heatingDegreeDays: 2280,
        coolingDegreeDays: 85,
        solarRadiation: 1100,
        averageTemp: 11.2,
        windSpeed: 3.8,
        gasCost: 7.5,
        electricityCost: 30.2,
        oilCost: 88,
        woodCost: 310,
        gasCarbon: 0.184,
        electricityCarbon: 0.233,
        oilCarbon: 2.52,
        woodCarbon: 0.025,
        buildingStandards: {
          wallUValue: 0.28,
          roofUValue: 0.16,
          floorUValue: 0.22,
          windowUValue: 1.6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultLocations.forEach(location => {
      this.locations.set(location.id, location);
    });
  }

  // Assessment operations
  async getAssessment(id: string): Promise<Assessment | null> {
    return this.assessments.get(id) ?? null;
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = randomUUID();
    const assessment: Assessment = {
      id,
      name: insertAssessment.name,
      version: insertAssessment.version ?? 1,
      insulation: insertAssessment.insulation ?? "standard",
      airChanges: insertAssessment.airChanges ?? "standard",
      capacity: insertAssessment.capacity ?? "high",
      exposure: insertAssessment.exposure ?? "detached",
      shape: insertAssessment.shape ?? "2-storey",
      windowSize: insertAssessment.windowSize ?? "standard",
      heatingFuel: insertAssessment.heatingFuel ?? "main_gas",
      heatingType: insertAssessment.heatingType ?? "boiler_h_eff",
      hotWaterType: insertAssessment.hotWaterType ?? "main_tank",
      controls: insertAssessment.controls ?? [],
      lightingType: insertAssessment.lightingType ?? "0% lel",
      ventilationType: insertAssessment.ventilationType ?? "nat / wet ext",
      renewables: insertAssessment.renewables ?? "none",
      climate: insertAssessment.climate ?? "UK std",
      heatingDemand: insertAssessment.heatingDemand ?? "Scot std",
      hotWaterDemand: insertAssessment.hotWaterDemand ?? "Scot std",
      appliances: insertAssessment.appliances ?? "standard",
      gridIntensity: insertAssessment.gridIntensity ?? "UK std",
      tariff: insertAssessment.tariff ?? "standard",
      capital: insertAssessment.capital ?? "standard",
      futureYear: insertAssessment.futureYear ?? null,
      locationId: insertAssessment.locationId ?? null,
      energyDemand: null,
      carbonEmissions: null,
      annualCost: null,
      eiScore: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assessments.set(id, assessment);
    return assessment;
  }

  async updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment | null> {
    const existing = this.assessments.get(id);
    if (!existing) return null;

    const updated: Assessment = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.assessments.set(id, updated);
    return updated;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    return this.assessments.delete(id);
  }

  // Location operations
  async getLocation(id: string): Promise<Location | null> {
    return this.locations.get(id) ?? null;
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = {
      id,
      name: insertLocation.name,
      country: insertLocation.country,
      region: insertLocation.region ?? null,
      heatingDegreeDays: insertLocation.heatingDegreeDays,
      coolingDegreeDays: insertLocation.coolingDegreeDays ?? 0,
      solarRadiation: insertLocation.solarRadiation,
      averageTemp: insertLocation.averageTemp,
      windSpeed: insertLocation.windSpeed ?? 4.4,
      gasCost: insertLocation.gasCost,
      electricityCost: insertLocation.electricityCost,
      oilCost: insertLocation.oilCost,
      woodCost: insertLocation.woodCost,
      gasCarbon: insertLocation.gasCarbon,
      electricityCarbon: insertLocation.electricityCarbon,
      oilCarbon: insertLocation.oilCarbon,
      woodCarbon: insertLocation.woodCarbon,
      buildingStandards: insertLocation.buildingStandards ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location | null> {
    const existing = this.locations.get(id);
    if (!existing) return null;

    const updated: Location = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: string): Promise<boolean> {
    return this.locations.delete(id);
  }

  // Upgrade recommendation operations
  async getUpgradeRecommendations(assessmentId: string): Promise<UpgradeRecommendation[]> {
    return Array.from(this.upgradeRecommendations.values()).filter(
      rec => rec.assessmentId === assessmentId
    );
  }

  async createUpgradeRecommendation(insertRecommendation: InsertUpgradeRecommendation): Promise<UpgradeRecommendation> {
    const id = randomUUID();
    const recommendation: UpgradeRecommendation = {
      ...insertRecommendation,
      id,
    };
    this.upgradeRecommendations.set(id, recommendation);
    return recommendation;
  }
}

export const storage = new MemStorage();

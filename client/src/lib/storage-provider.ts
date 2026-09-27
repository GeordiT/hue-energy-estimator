import type { Assessment, InsertAssessment, Location, InsertLocation, UpgradeRecommendation, InsertUpgradeRecommendation } from "@shared/schema";

function generateId(): string {
  return crypto.randomUUID();
}

const STORAGE_KEYS = {
  assessments: "hue_assessments",
  currentAssessment: "hue_current_assessment",
  locations: "hue_locations",
  recommendations: "hue_recommendations",
  initialized: "hue_initialized",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readStore<T>(key: string): T[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    throw new Error(`Unable to read ${key} from browser storage: ${getErrorMessage(error)}`);
  }

  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Saved ${key} data is invalid JSON: ${getErrorMessage(error)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Saved ${key} data is invalid: expected an array.`);
  }

  return parsed as T[];
}

function writeStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    throw new Error(`Unable to save ${key} to browser storage: ${getErrorMessage(error)}`);
  }
}

function readCurrentAssessment(): Assessment | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.currentAssessment);
  } catch (error) {
    throw new Error(`Unable to read the current assessment from browser storage: ${getErrorMessage(error)}`);
  }

  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Saved current assessment data is invalid JSON: ${getErrorMessage(error)}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved current assessment data is invalid.");
  }

  const saved = parsed as Record<string, unknown>;
  if (typeof saved.id !== "string" || typeof saved.name !== "string") {
    throw new Error("Saved current assessment data is missing required fields.");
  }

  const parseDate = (value: unknown, field: string): Date => {
    const date = value instanceof Date
      ? new Date(value.getTime())
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
    if (!date || Number.isNaN(date.getTime())) {
      throw new Error(`Saved current assessment has an invalid ${field} value.`);
    }
    return date;
  };

  return {
    ...(saved as unknown as Assessment),
    createdAt: parseDate(saved.createdAt, "createdAt"),
    updatedAt: parseDate(saved.updatedAt, "updatedAt"),
  };
}

function writeCurrentAssessment(assessment: Assessment): void {
  try {
    localStorage.setItem(STORAGE_KEYS.currentAssessment, JSON.stringify(assessment));
  } catch (error) {
    throw new Error(`Unable to save the current assessment to browser storage: ${getErrorMessage(error)}`);
  }
}

function initializeDefaults(): void {
  try {
    if (localStorage.getItem(STORAGE_KEYS.initialized)) return;

    const defaultLocations: Location[] = [
      {
        id: generateId(),
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
        id: generateId(),
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

    // Seed only keys that are absent; an interrupted prior initialization must
    // not replace data that is already present in the browser.
    if (localStorage.getItem(STORAGE_KEYS.locations) === null) {
      writeStore(STORAGE_KEYS.locations, defaultLocations);
    }
    if (localStorage.getItem(STORAGE_KEYS.assessments) === null) {
      writeStore(STORAGE_KEYS.assessments, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.recommendations) === null) {
      writeStore(STORAGE_KEYS.recommendations, []);
    }
    localStorage.setItem(STORAGE_KEYS.initialized, "true");
  } catch (error) {
    throw new Error(`Unable to initialize browser storage: ${getErrorMessage(error)}`);
  }
}

export const storage = {
  getCurrentAssessment(): Assessment | null {
    return readCurrentAssessment();
  },

  saveCurrentAssessment(assessment: Assessment): void {
    writeCurrentAssessment(assessment);
  },

  getAssessment(id: string): Assessment | null {
    const all = readStore<Assessment>(STORAGE_KEYS.assessments);
    return all.find(a => a.id === id) ?? null;
  },

  getAllAssessments(): Assessment[] {
    initializeDefaults();
    return readStore<Assessment>(STORAGE_KEYS.assessments);
  },

  createAssessment(data: InsertAssessment): Assessment {
    const all = readStore<Assessment>(STORAGE_KEYS.assessments);
    const assessment: Assessment = {
      id: generateId(),
      name: data.name,
      version: data.version ?? 1,
      insulation: data.insulation ?? "standard",
      airChanges: data.airChanges ?? "standard",
      capacity: data.capacity ?? "high",
      exposure: data.exposure ?? "detached",
      shape: data.shape ?? "2-storey",
      windowSize: data.windowSize ?? "standard",
      heatingFuel: data.heatingFuel ?? "main_gas",
      heatingType: data.heatingType ?? "boiler_h_eff",
      hotWaterType: data.hotWaterType ?? "main_tank",
      controls: data.controls ?? [],
      lightingType: data.lightingType ?? "0% lel",
      ventilationType: data.ventilationType ?? "nat / wet ext",
      renewables: data.renewables ?? "none",
      climate: data.climate ?? "UK std",
      heatingDemand: data.heatingDemand ?? "Scot std",
      hotWaterDemand: data.hotWaterDemand ?? "Scot std",
      appliances: data.appliances ?? "standard",
      gridIntensity: data.gridIntensity ?? "UK std",
      tariff: data.tariff ?? "standard",
      capital: data.capital ?? "standard",
      futureYear: data.futureYear ?? null,
      locationId: data.locationId ?? null,
      energyDemand: null,
      carbonEmissions: null,
      annualCost: null,
      eiScore: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    all.push(assessment);
    writeStore(STORAGE_KEYS.assessments, all);
    return assessment;
  },

  updateAssessment(id: string, updates: Partial<InsertAssessment>): Assessment | null {
    const all = readStore<Assessment>(STORAGE_KEYS.assessments);
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return null;
    const updated: Assessment = {
      ...all[index],
      ...updates,
      updatedAt: new Date(),
    };
    all[index] = updated;
    writeStore(STORAGE_KEYS.assessments, all);
    return updated;
  },

  saveAssessmentResults(id: string, results: { energyDemand: number; carbonEmissions: number; annualCost: number; eiScore: number }): Assessment | null {
    const all = readStore<Assessment>(STORAGE_KEYS.assessments);
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return null;
    all[index] = {
      ...all[index],
      ...results,
      updatedAt: new Date(),
    };
    writeStore(STORAGE_KEYS.assessments, all);
    return all[index];
  },

  deleteAssessment(id: string): boolean {
    const all = readStore<Assessment>(STORAGE_KEYS.assessments);
    const filtered = all.filter(a => a.id !== id);
    if (filtered.length === all.length) return false;
    writeStore(STORAGE_KEYS.assessments, filtered);
    return true;
  },

  getLocation(id: string): Location | null {
    const all = readStore<Location>(STORAGE_KEYS.locations);
    return all.find(l => l.id === id) ?? null;
  },

  getAllLocations(): Location[] {
    initializeDefaults();
    return readStore<Location>(STORAGE_KEYS.locations);
  },

  createLocation(data: InsertLocation): Location {
    const all = readStore<Location>(STORAGE_KEYS.locations);
    const location: Location = {
      id: generateId(),
      name: data.name,
      country: data.country,
      region: data.region ?? null,
      heatingDegreeDays: data.heatingDegreeDays,
      coolingDegreeDays: data.coolingDegreeDays ?? 0,
      solarRadiation: data.solarRadiation,
      averageTemp: data.averageTemp,
      windSpeed: data.windSpeed ?? 4.4,
      gasCost: data.gasCost,
      electricityCost: data.electricityCost,
      oilCost: data.oilCost,
      woodCost: data.woodCost,
      gasCarbon: data.gasCarbon,
      electricityCarbon: data.electricityCarbon,
      oilCarbon: data.oilCarbon,
      woodCarbon: data.woodCarbon,
      buildingStandards: data.buildingStandards ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    all.push(location);
    writeStore(STORAGE_KEYS.locations, all);
    return location;
  },

  updateLocation(id: string, updates: Partial<InsertLocation>): Location | null {
    const all = readStore<Location>(STORAGE_KEYS.locations);
    const index = all.findIndex(l => l.id === id);
    if (index === -1) return null;
    const updated: Location = {
      ...all[index],
      ...updates,
      updatedAt: new Date(),
    };
    all[index] = updated;
    writeStore(STORAGE_KEYS.locations, all);
    return updated;
  },

  deleteLocation(id: string): boolean {
    const all = readStore<Location>(STORAGE_KEYS.locations);
    const filtered = all.filter(l => l.id !== id);
    if (filtered.length === all.length) return false;
    writeStore(STORAGE_KEYS.locations, filtered);
    return true;
  },

  getUpgradeRecommendations(assessmentId: string): UpgradeRecommendation[] {
    const all = readStore<UpgradeRecommendation>(STORAGE_KEYS.recommendations);
    return all.filter(r => r.assessmentId === assessmentId);
  },

  createUpgradeRecommendation(data: InsertUpgradeRecommendation): UpgradeRecommendation {
    const all = readStore<UpgradeRecommendation>(STORAGE_KEYS.recommendations);
    const recommendation: UpgradeRecommendation = {
      ...data,
      id: generateId(),
    };
    all.push(recommendation);
    writeStore(STORAGE_KEYS.recommendations, all);
    return recommendation;
  },
};

import { z } from "zod";

export interface Assessment {
  id: string;
  name: string;
  version: number;
  insulation: string;
  airChanges: string;
  capacity: string;
  exposure: string;
  shape: string;
  windowSize: string;
  heatingFuel: string;
  heatingType: string;
  hotWaterType: string;
  controls: string[];
  lightingType: string;
  ventilationType: string;
  renewables: string;
  climate: string;
  heatingDemand: string;
  hotWaterDemand: string;
  appliances: string;
  gridIntensity: string;
  tariff: string;
  capital: string;
  futureYear: number | null;
  locationId: string | null;
  energyDemand: number | null;
  carbonEmissions: number | null;
  annualCost: number | null;
  eiScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  country: string;
  region: string | null;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  solarRadiation: number;
  averageTemp: number;
  windSpeed: number;
  gasCost: number;
  electricityCost: number;
  oilCost: number;
  woodCost: number;
  gasCarbon: number;
  electricityCarbon: number;
  oilCarbon: number;
  woodCarbon: number;
  buildingStandards: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpgradeRecommendation {
  id: string;
  assessmentId: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  cost: number;
  annualSavings: number;
  carbonSavings: number;
  paybackYears: number;
  energySavings: number;
}

export const insertAssessmentSchema = z.object({
  name: z.string().min(1),
  version: z.number().int().min(1).default(1),
  insulation: z.string().default("standard"),
  airChanges: z.string().default("standard"),
  capacity: z.string().default("high"),
  exposure: z.string().default("detached"),
  shape: z.string().default("2-storey"),
  windowSize: z.string().default("standard"),
  heatingFuel: z.string().default("main_gas"),
  heatingType: z.string().default("boiler_h_eff"),
  hotWaterType: z.string().default("main_tank"),
  controls: z.array(z.string()).default([]),
  lightingType: z.string().default("0% lel"),
  ventilationType: z.string().default("nat / wet ext"),
  renewables: z.string().default("none"),
  climate: z.string().default("UK std"),
  heatingDemand: z.string().default("Scot std"),
  hotWaterDemand: z.string().default("Scot std"),
  appliances: z.string().default("standard"),
  gridIntensity: z.string().default("UK std"),
  tariff: z.string().default("standard"),
  capital: z.string().default("standard"),
  futureYear: z.number().int().min(2024).max(2100).optional().nullable(),
  locationId: z.string().optional().nullable(),
});

export const insertLocationSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  region: z.string().optional().nullable(),
  heatingDegreeDays: z.number()
    .min(0, "Heating degree days cannot be negative")
    .max(10000, "Heating degree days cannot exceed 10,000 (extreme arctic)")
    .refine(v => Number.isFinite(v), "Must be a valid number"),
  coolingDegreeDays: z.number()
    .min(0, "Cooling degree days cannot be negative")
    .max(5000, "Cooling degree days cannot exceed 5,000 (extreme tropical)")
    .default(0),
  solarRadiation: z.number()
    .min(200, "Solar radiation must be at least 200 kWh/m²/year")
    .max(2500, "Solar radiation cannot exceed 2,500 kWh/m²/year"),
  averageTemp: z.number()
    .min(-30, "Average temperature cannot be below -30°C")
    .max(45, "Average temperature cannot exceed 45°C"),
  windSpeed: z.number()
    .min(0, "Wind speed cannot be negative")
    .max(30, "Wind speed cannot exceed 30 m/s")
    .default(4.4),
  gasCost: z.number()
    .min(0, "Gas cost cannot be negative")
    .max(100, "Gas cost cannot exceed 100 p/kWh"),
  electricityCost: z.number()
    .min(0, "Electricity cost cannot be negative")
    .max(200, "Electricity cost cannot exceed 200 p/kWh"),
  oilCost: z.number()
    .min(0, "Oil cost cannot be negative")
    .max(500, "Oil cost cannot exceed 500 p/litre"),
  woodCost: z.number()
    .min(0, "Wood cost cannot be negative")
    .max(1000, "Wood cost cannot exceed £1000/tonne"),
  gasCarbon: z.number()
    .min(0, "Carbon factor cannot be negative")
    .max(1, "Gas carbon factor cannot exceed 1 kgCO2/kWh"),
  electricityCarbon: z.number()
    .min(0, "Carbon factor cannot be negative")
    .max(2, "Electricity carbon factor cannot exceed 2 kgCO2/kWh"),
  oilCarbon: z.number()
    .min(0, "Carbon factor cannot be negative")
    .max(5, "Oil carbon factor cannot exceed 5 kgCO2/litre"),
  woodCarbon: z.number()
    .min(0, "Carbon factor cannot be negative")
    .max(1, "Wood carbon factor cannot exceed 1 kgCO2/kg"),
  buildingStandards: z.record(z.number()).default({}),
});

export const insertUpgradeRecommendationSchema = z.object({
  assessmentId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priority: z.string().min(1),
  cost: z.number().min(0),
  annualSavings: z.number(),
  carbonSavings: z.number(),
  paybackYears: z.number().min(0),
  energySavings: z.number(),
});

export const calculationOptionsSchema = z.object({
  futureYear: z.number().int().min(2024).max(2100).optional(),
  baseYear: z.number().int().min(1990).max(2030).default(2024).optional(),
  decarbonizationRate: z.number().min(0).max(0.2).default(0.03).optional(),
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertUpgradeRecommendation = z.infer<typeof insertUpgradeRecommendationSchema>;
export type CalculationOptions = z.infer<typeof calculationOptionsSchema>;

export const insulationOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "poor", label: "Poor (pre-83)", description: "Building standards prior to 1981" },
  { value: "standard", label: "Standard (83-02)", description: "1981 Scottish building regulations" },
  { value: "medium", label: "Medium (03-07)", description: "2002 Scottish building regulations" },
  { value: "good", label: "Good (post-07)", description: "2007 Scottish building regulations" },
  { value: "super", label: "Super (Passivhaus)", description: "AECB Gold and Passivhaus guidelines" },
];

export const airChangesOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "poor", label: "Poor (1.5 ac/h)", description: "Single glazing without draught proofing" },
  { value: "standard", label: "Standard (0.85 ac/h)", description: "Double glazing or draught proofed single glazing" },
  { value: "tight", label: "Tight (0.6 ac/h)", description: "2007 standards with extensive draught proofing" },
];

export const capacityOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "high", label: "High (Heavy construction)", description: "High thermal mass available to occupied space" },
  { value: "low", label: "Low (Light construction)", description: "Low thermal mass or not available to occupied space" },
];

export const exposureOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "detached", label: "Detached", description: "All 4 sides exposed" },
  { value: "semi-detached", label: "Semi-detached", description: "3 sides exposed" },
  { value: "mid-terrace", label: "Mid-terrace", description: "2 sides exposed" },
  { value: "flat-g", label: "Flat (ground)", description: "3 sides exposed, roof not exposed" },
  { value: "flat-t", label: "Flat (top)", description: "3 sides exposed, floor not exposed" },
  { value: "flat-m", label: "Flat (mid)", description: "3 sides exposed, roof and floor not exposed" },
];

export const shapeOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "1-storey", label: "1-storey", description: "Single storey dwelling" },
  { value: "2-storey", label: "2-storey", description: "Two storey dwelling" },
];

export const heatingFuelOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "main_gas", label: "Main gas", description: "Mains gas supply" },
  { value: "electricity", label: "Electricity", description: "Grid electricity" },
  { value: "wood_bio", label: "Wood / Bio", description: "Wood or biomass fuel" },
  { value: "lpg", label: "LPG / Bottled gas", description: "LPG or bottled gas" },
  { value: "oil", label: "Oil", description: "Heating oil" },
  { value: "coal", label: "Coal / Solid fuel", description: "Coal or processed solid fuel" },
];

export const heatingTypeOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "fires", label: "Fires (room heaters)", description: "Individual room heaters" },
  { value: "boiler_l_eff", label: "Boiler (low efficiency)", description: "Low efficiency boiler" },
  { value: "boiler_m_eff", label: "Boiler (medium efficiency)", description: "Medium efficiency boiler" },
  { value: "boiler_h_eff", label: "Boiler (high efficiency)", description: "High efficiency non-condensing boiler" },
  { value: "boiler_cond", label: "Boiler (condensing)", description: "Condensing boiler" },
  { value: "u_chp", label: "Micro CHP", description: "Stirling engine type individual dwelling CHP" },
  { value: "com_chp", label: "Community CHP", description: "Reciprocating type community CHP system" },
  { value: "ashp", label: "Air source heat pump", description: "Air source heat pump feeding wet heating system" },
  { value: "gshp", label: "Ground source heat pump", description: "Ground source heat pump feeding wet heating system" },
  { value: "storage", label: "Storage heaters", description: "Individual storage type heaters" },
];

export const windowSizeOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "small", label: "Small (15%)", description: "Less than 15% glazing" },
  { value: "standard", label: "Standard (25%)", description: "Around 25% glazing" },
  { value: "large", label: "Large (35%)", description: "More than 35% glazing" },
];

export const hotWaterOptions = [
  { value: "none", label: "None", description: "Not factored into calculation" },
  { value: "main_tank", label: "Main tank (integrated)", description: "Main heating source heats hot water in tank" },
  { value: "main_combi", label: "Main combi", description: "Main heating source provides instant hot water" },
  { value: "elec_immer", label: "Electric immersion", description: "Separate electric immersion heater" },
  { value: "inst_gas", label: "Instant gas", description: "Separate gas instant heater" },
  { value: "inst_elec", label: "Instant electric", description: "Separate electric instant heater" },
];

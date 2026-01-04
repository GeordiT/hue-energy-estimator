import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: integer("version").default(1).notNull(), // Schema version for migrations
  
  // Fabric determinants
  insulation: text("insulation").default("standard"),
  airChanges: text("air_changes").default("standard"),
  capacity: text("capacity").default("high"),
  exposure: text("exposure").default("detached"),
  shape: text("shape").default("2-storey"),
  windowSize: text("window_size").default("standard"),
  
  // System determinants
  heatingFuel: text("heating_fuel").default("main_gas"),
  heatingType: text("heating_type").default("boiler_h_eff"),
  hotWaterType: text("hot_water_type").default("main_tank"),
  controls: jsonb("controls").default("[]"),
  lightingType: text("lighting_type").default("0% lel"),
  ventilationType: text("ventilation_type").default("nat / wet ext"),
  renewables: text("renewables").default("none"),
  
  // Context determinants
  climate: text("climate").default("UK std"),
  heatingDemand: text("heating_demand").default("Scot std"),
  hotWaterDemand: text("hot_water_demand").default("Scot std"),
  appliances: text("appliances").default("standard"),
  gridIntensity: text("grid_intensity").default("UK std"),
  tariff: text("tariff").default("standard"),
  capital: text("capital").default("standard"),
  
  // Future projection
  futureYear: integer("future_year"), // Optional year for grid decarbonization projection
  
  // Location-specific data
  locationId: varchar("location_id"),
  
  // Results (calculated)
  energyDemand: real("energy_demand"),
  carbonEmissions: real("carbon_emissions"),
  annualCost: real("annual_cost"),
  eiScore: integer("ei_score"),
  
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  
  // Climate data
  heatingDegreeDays: real("heating_degree_days").notNull(),
  coolingDegreeDays: real("cooling_degree_days").notNull().default(0),
  solarRadiation: real("solar_radiation").notNull(),
  averageTemp: real("average_temp").notNull(),
  windSpeed: real("wind_speed").notNull().default(4.4),
  
  // Cost parameters
  gasCost: real("gas_cost").notNull(), // p/kWh
  electricityCost: real("electricity_cost").notNull(), // p/kWh
  oilCost: real("oil_cost").notNull(), // p/litre
  woodCost: real("wood_cost").notNull(), // £/tonne
  
  // Carbon factors
  gasCarbon: real("gas_carbon").notNull(), // kgCO2/kWh
  electricityCarbon: real("electricity_carbon").notNull(), // kgCO2/kWh
  oilCarbon: real("oil_carbon").notNull(), // kgCO2/litre
  woodCarbon: real("wood_carbon").notNull(), // kgCO2/kg
  
  // Regulatory standards
  buildingStandards: jsonb("building_standards").default("{}"),
  
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const upgradeRecommendations = pgTable("upgrade_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // fabric, system, renewable
  priority: text("priority").notNull(), // high, medium, low
  cost: real("cost").notNull(),
  annualSavings: real("annual_savings").notNull(),
  carbonSavings: real("carbon_savings").notNull(),
  paybackYears: real("payback_years").notNull(),
  energySavings: real("energy_savings").notNull(),
});

// Base insert schema for assessments
const baseInsertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  energyDemand: true,
  carbonEmissions: true,
  annualCost: true,
  eiScore: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced assessment schema with validation
export const insertAssessmentSchema = baseInsertAssessmentSchema.extend({
  futureYear: z.number().int().min(2024).max(2100).optional().nullable(),
  version: z.number().int().min(1).default(1),
});

// Base insert schema for locations
const baseInsertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced location schema with strict climate data and cost validation
export const insertLocationSchema = baseInsertLocationSchema.extend({
  // Climate data validation with realistic ranges
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
  
  // Energy cost validation (pence/kWh or £/unit)
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
  
  // Carbon factor validation (kgCO2/kWh or per unit)
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
});

export const insertUpgradeRecommendationSchema = createInsertSchema(upgradeRecommendations).omit({
  id: true,
});

// Validation schema for calculation options
export const calculationOptionsSchema = z.object({
  futureYear: z.number().int().min(2024).max(2100).optional(),
  baseYear: z.number().int().min(1990).max(2030).default(2024).optional(),
  decarbonizationRate: z.number().min(0).max(0.2).default(0.03).optional(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpgradeRecommendation = typeof upgradeRecommendations.$inferSelect;
export type InsertUpgradeRecommendation = z.infer<typeof insertUpgradeRecommendationSchema>;
export type CalculationOptions = z.infer<typeof calculationOptionsSchema>;

// Fabric determinant options
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

// Additional options for hot water and window size
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

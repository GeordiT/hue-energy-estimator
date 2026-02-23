import { Assessment, Location } from "@shared/schema";

export interface CalculationOptions {
  futureYear?: number; // Year for grid decarbonization projection
  baseYear?: number; // Reference year for carbon factors (default 2024)
  decarbonizationRate?: number; // Annual reduction rate (default 0.03 = 3%)
}

export interface CalculationResults {
  energyDemand: number;
  carbonEmissions: number;
  annualCost: number;
  eiScore: number;
  spaceHeating: number;
  hotWater: number;
  cooling: number;
  lighting: number;
  appliances: number;
  breakdown: {
    spaceHeating: number;
    hotWater: number;
    cooling: number;
    lighting: number;
    appliances: number;
  };
  formFactor?: number; // Exposed for debugging/display
  projectedYear?: number; // If future year calculation was used
  adjustedElectricityCarbon?: number; // Adjusted carbon factor if future year
}

// U-value lookup tables based on insulation level
const insulationUValues = {
  poor: { wall: 1.5, roof: 0.6, floor: 0.8, glazing: 5.0 },
  standard: { wall: 0.45, roof: 0.25, floor: 0.30, glazing: 2.8 },
  medium: { wall: 0.35, roof: 0.20, floor: 0.25, glazing: 2.0 },
  good: { wall: 0.30, roof: 0.16, floor: 0.22, glazing: 1.6 },
  super: { wall: 0.15, roof: 0.10, floor: 0.15, glazing: 0.8 },
};

// Air change rates
const airChangeRates = {
  poor: 1.5,
  standard: 0.85,
  tight: 0.6,
};

// Heating system efficiencies
const heatingEfficiencies = {
  fires: 65,
  boiler_l_eff: 72,
  boiler_m_eff: 78,
  boiler_h_eff: 85,
  boiler_cond: 92,
  u_chp: 85,
  com_chp: 80,
  ashp: 280, // COP of 2.8
  gshp: 320, // COP of 3.2
  storage: 95,
};

// Floor areas by type and shape
const floorAreas = {
  house: { "1-storey": 94, "2-storey": 94 },
  flat: { "1-storey": 71, "2-storey": 71 },
};

// Form Factor coefficients for heat loss surface area calculation
// Based on building geometry: ratio of heat loss surface to floor area
const shapeFormFactors = {
  "1-storey": 1.8,  // Bungalow: larger roof area relative to floor
  "2-storey": 1.4,  // Standard 2-storey: more compact form
  "3-storey": 1.2,  // 3-storey: even more compact
  "none": 1.5,      // Default mid-range
};

// Exposure adjustment multipliers (percentage of envelope exposed)
const exposureFormAdjustments = {
  detached: 1.0,        // 100% - all surfaces exposed
  "semi-detached": 0.82, // ~82% - one party wall
  "mid-terrace": 0.65,   // ~65% - two party walls
  "flat-g": 0.55,        // Ground flat: no roof exposure, floor exposed
  "flat-t": 0.55,        // Top flat: roof exposed, no floor exposure
  "flat-m": 0.40,        // Mid flat: no roof or floor exposure
  "none": 0.85,          // Default mid-range
};

// Calculate adjusted electricity carbon factor for future year projections
export function calculateFutureElectricityCarbon(
  baseCarbon: number,
  options?: CalculationOptions
): number {
  if (!options?.futureYear) return baseCarbon;
  
  const baseYear = options.baseYear || 2024;
  const decarbRate = options.decarbonizationRate || 0.03; // 3% per year default
  const yearsFromBase = Math.max(0, options.futureYear - baseYear);
  
  // Linear decarbonization: reduce by rate per year
  const reductionFactor = Math.max(0.1, 1 - (decarbRate * yearsFromBase)); // Floor at 10%
  return baseCarbon * reductionFactor;
}

// Calculate the effective Form Factor based on shape and exposure
export function calculateFormFactor(shape: string, exposure: string): number {
  const shapeFactor = shapeFormFactors[shape as keyof typeof shapeFormFactors] || shapeFormFactors["none"];
  const exposureAdj = exposureFormAdjustments[exposure as keyof typeof exposureFormAdjustments] || exposureFormAdjustments["none"];
  
  return shapeFactor * exposureAdj;
}

export function calculateEnergyPerformance(
  assessment: Assessment, 
  location: Location | null,
  options?: CalculationOptions
): CalculationResults {
  // Get basic parameters, handle "none" values
  const uValues = assessment.insulation && assessment.insulation !== "none" 
    ? insulationUValues[assessment.insulation as keyof typeof insulationUValues]
    : { wall: 0, roof: 0, floor: 0, glazing: 0 };
  
  const airChangeRate = assessment.airChanges && assessment.airChanges !== "none" 
    ? airChangeRates[assessment.airChanges as keyof typeof airChangeRates] 
    : 0;
  
  const heatingEff = assessment.heatingType && assessment.heatingType !== "none" 
    ? heatingEfficiencies[assessment.heatingType as keyof typeof heatingEfficiencies] 
    : 100; // Default efficiency if no heating type specified
  
  // Determine dwelling type and floor area, handle "none" values
  const isDwellingFlat = assessment.exposure && assessment.exposure !== "none" ? assessment.exposure.startsWith("flat") : false;
  const dwellingType = isDwellingFlat ? "flat" : "house";
  const shapeKey = assessment.shape && assessment.shape !== "none" ? assessment.shape : "2-storey";
  const floorArea = floorAreas[dwellingType][shapeKey as keyof typeof floorAreas[typeof dwellingType]];
  
  // Calculate Form Factor for heat loss surface area
  const exposureKey = assessment.exposure && assessment.exposure !== "none" ? assessment.exposure : "none";
  const formFactor = calculateFormFactor(shapeKey, exposureKey);
  
  // Effective heat loss surface area using Form Factor approach
  // Form Factor = heat loss surface area / floor area
  const effectiveHeatLossSurface = floorArea * formFactor;
  
  // Calculate average U-value for the envelope
  const windowFraction = assessment.windowSize === "large" ? 0.35 : 
                         assessment.windowSize === "small" ? 0.15 : 0.25;
  const opaqueFraction = 1 - windowFraction;
  
  // Weighted average U-value for opaque elements (walls, roof, floor)
  const avgOpaqueU = (uValues.wall * 0.5 + uValues.roof * 0.25 + uValues.floor * 0.25);
  const avgEnvelopeU = (avgOpaqueU * opaqueFraction) + (uValues.glazing * windowFraction);
  
  // Fabric heat loss using Form Factor (W/K)
  const fabricLoss = assessment.insulation !== "none" ? effectiveHeatLossSurface * avgEnvelopeU : 0;
  
  // Ventilation heat loss (W/K) = Volume × Air change rate × specific heat capacity of air
  const volume = floorArea * 2.5; // Assume 2.5m ceiling height
  const ventilationLoss = assessment.airChanges !== "none" ? volume * airChangeRate * 0.33 : 0;
  
  const totalHeatLoss = fabricLoss + ventilationLoss;
  
  // Use location heating degree days or default
  const heatingDegreeDays = location?.heatingDegreeDays || 2650;
  
  // Calculate space heating demand (kWh/year)
  const spaceHeating = (totalHeatLoss * heatingDegreeDays * 24) / 1000; // Convert W to kWh
  
  // Cooling demand calculation based on cooling degree days
  const coolingDegreeDays = location?.coolingDegreeDays || 0;
  const coolingDemand = coolingDegreeDays > 0 ? (coolingDegreeDays * floorArea * 0.025) : 0; // kWh/year
  
  // Hot water demand (simplified calculation)
  const hotWater = floorArea * 25; // ~25 kWh/m²/year for hot water
  
  // Lighting demand
  const lightingDemand = assessment.lightingType === "100% lel" ? 
    floorArea * 8 : // LED lighting
    floorArea * 18; // Incandescent lighting
  
  // Appliances demand
  const appliancesDemand = floorArea * 12; // ~12 kWh/m²/year for appliances
  
  // Apply heating system efficiency - only if heating type is specified
  const adjustedSpaceHeating = assessment.heatingType !== "none" ? (spaceHeating * 100) / heatingEff : spaceHeating;
  const adjustedHotWater = assessment.heatingType !== "none" ? (hotWater * 100) / heatingEff : hotWater;
  
  // Total energy demand (including cooling)
  const energyDemand = adjustedSpaceHeating + adjustedHotWater + coolingDemand + lightingDemand + appliancesDemand;
  
  // Carbon emissions calculation - only if heating fuel is specified
  let carbonEmissions: number = 0;
  const baseElectricityCarbon = location?.electricityCarbon || 0.233;
  
  // Apply future year decarbonization projection if specified
  const adjustedElectricityCarbon = calculateFutureElectricityCarbon(baseElectricityCarbon, options);
  
  if (assessment.heatingFuel && assessment.heatingFuel !== "none") {
    const carbonFactor = location?.gasCarbon || 0.184; // Default to gas carbon factor
    
    if (assessment.heatingFuel === "electricity") {
      carbonEmissions = energyDemand * adjustedElectricityCarbon;
    } else if (assessment.heatingFuel === "oil") {
      const oilCarbon = location?.oilCarbon || 2.52;
      carbonEmissions = energyDemand * oilCarbon / 10; // Rough conversion
    } else {
      carbonEmissions = energyDemand * carbonFactor;
    }
  }
  
  // Cost calculation - only if heating fuel is specified
  let annualCost: number = 0;
  
  if (assessment.heatingFuel && assessment.heatingFuel !== "none") {
    const energyCost = location?.gasCost || 7.2; // Default gas cost in p/kWh
    const electricityCost = location?.electricityCost || 28.5;
    
    if (assessment.heatingFuel === "electricity") {
      annualCost = (energyDemand * electricityCost) / 100; // Convert pence to pounds
    } else {
      annualCost = (energyDemand * energyCost) / 100; // Convert pence to pounds
    }
  }
  
  // EI Score calculation (simplified SAP-based calculation)
  const carbonEmissionsPerM2 = carbonEmissions / floorArea;
  const eiScore = Math.max(1, Math.min(100, 100 - (carbonEmissionsPerM2 * 2.5)));
  
  return {
    energyDemand: Math.round(energyDemand),
    carbonEmissions: Math.round(carbonEmissions),
    annualCost: Math.round(annualCost),
    eiScore: Math.round(eiScore),
    spaceHeating: Math.round(adjustedSpaceHeating),
    hotWater: Math.round(adjustedHotWater),
    cooling: Math.round(coolingDemand),
    lighting: Math.round(lightingDemand),
    appliances: Math.round(appliancesDemand),
    breakdown: {
      spaceHeating: Math.round(adjustedSpaceHeating),
      hotWater: Math.round(adjustedHotWater),
      cooling: Math.round(coolingDemand),
      lighting: Math.round(lightingDemand),
      appliances: Math.round(appliancesDemand),
    },
    formFactor: Math.round(formFactor * 100) / 100,
    projectedYear: options?.futureYear,
    adjustedElectricityCarbon: options?.futureYear 
      ? Math.round(adjustedElectricityCarbon * 1000) / 1000 
      : undefined,
  };
}

export function generateUpgradeRecommendations(assessment: Assessment, location: Location | null) {
  const recommendations = [];
  const currentResults = calculateEnergyPerformance(assessment, location);
  
  // Wall insulation upgrade
  if (assessment.insulation === "poor" || assessment.insulation === "standard") {
    const upgradedAssessment = { ...assessment, insulation: "good" };
    const upgradedResults = calculateEnergyPerformance(upgradedAssessment, location);
    const savings = currentResults.annualCost - upgradedResults.annualCost;
    const carbonSavings = currentResults.carbonEmissions - upgradedResults.carbonEmissions;
    
    recommendations.push({
      name: "Improve Wall Insulation",
      description: "Upgrade to modern insulation standards",
      category: "fabric",
      priority: savings > 200 ? "high" : "medium",
      cost: 4500,
      annualSavings: savings,
      carbonSavings,
      paybackYears: Math.round(4500 / Math.max(1, savings)),
      energySavings: currentResults.energyDemand - upgradedResults.energyDemand,
    });
  }
  
  // Boiler upgrade
  if (assessment.heatingType === "boiler_l_eff" || assessment.heatingType === "boiler_m_eff") {
    const upgradedAssessment = { ...assessment, heatingType: "boiler_cond" };
    const upgradedResults = calculateEnergyPerformance(upgradedAssessment, location);
    const savings = currentResults.annualCost - upgradedResults.annualCost;
    const carbonSavings = currentResults.carbonEmissions - upgradedResults.carbonEmissions;
    
    recommendations.push({
      name: "Upgrade Boiler",
      description: "Install condensing boiler",
      category: "system",
      priority: savings > 100 ? "medium" : "low",
      cost: 3200,
      annualSavings: savings,
      carbonSavings,
      paybackYears: Math.round(3200 / Math.max(1, savings)),
      energySavings: currentResults.energyDemand - upgradedResults.energyDemand,
    });
  }
  
  // Window upgrade
  if (assessment.insulation === "poor" || assessment.insulation === "standard") {
    const savings = currentResults.annualCost * 0.08; // Approximate 8% savings from windows
    const carbonSavings = currentResults.carbonEmissions * 0.08;
    
    recommendations.push({
      name: "Double Glazing",
      description: "Replace single glazing",
      category: "fabric",
      priority: "low",
      cost: 6800,
      annualSavings: savings,
      carbonSavings,
      paybackYears: Math.round(6800 / Math.max(1, savings)),
      energySavings: currentResults.energyDemand * 0.08,
    });
  }
  
  return recommendations;
}

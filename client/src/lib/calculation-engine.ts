import { Assessment, Location } from "@shared/schema";

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

// Exposure factors for heat loss
const exposureFactors = {
  detached: 1.0,
  "semi-detached": 0.85,
  "mid-terrace": 0.7,
  "flat-g": 0.8,
  "flat-t": 0.8,
  "flat-m": 0.6,
};

export function calculateEnergyPerformance(assessment: Assessment, location: Location | null): CalculationResults {
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
  
  // Heat loss calculation, handle "none" exposure
  const exposureFactor = assessment.exposure && assessment.exposure !== "none" 
    ? exposureFactors[assessment.exposure as keyof typeof exposureFactors] 
    : 1.0;
  
  // Simplified heat loss calculation (W/K) - only calculate if parameters are available
  const storeys = shapeKey === "2-storey" ? 2 : 1;
  const wallArea = Math.sqrt(floorArea) * 2.5 * storeys * exposureFactor;
  const roofArea = isDwellingFlat ? 0 : floorArea;
  const floorAreaLoss = isDwellingFlat && assessment.exposure !== "flat-g" ? 0 : floorArea;
  const windowArea = floorArea * 0.175; // 17.5% of floor area
  
  // Calculate losses only if U-values are available (not "none")
  const wallLoss = assessment.insulation !== "none" ? wallArea * uValues.wall : 0;
  const roofLoss = assessment.insulation !== "none" ? roofArea * uValues.roof : 0;
  const floorLoss = assessment.insulation !== "none" ? floorAreaLoss * uValues.floor : 0;
  const windowLoss = assessment.insulation !== "none" ? windowArea * uValues.glazing : 0;
  const ventilationLoss = assessment.airChanges !== "none" ? floorArea * 2.5 * airChangeRate * 0.33 : 0;
  
  const totalHeatLoss = wallLoss + roofLoss + floorLoss + windowLoss + ventilationLoss;
  
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
  
  if (assessment.heatingFuel && assessment.heatingFuel !== "none") {
    const carbonFactor = location?.gasCarbon || 0.184; // Default to gas carbon factor
    const electricityCarbon = location?.electricityCarbon || 0.233;
    
    if (assessment.heatingFuel === "electricity") {
      carbonEmissions = energyDemand * electricityCarbon;
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

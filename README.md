# EDEM - Housing Upgrade Estimator

A comprehensive energy assessment application for residential buildings. The system enables users to evaluate building energy performance through detailed fabric, system, and contextual assessments.

## Purpose

EDEM helps users:
- Assess the energy performance of residential buildings
- Calculate energy demand, carbon emissions, and annual costs
- Generate energy efficiency ratings (A-G scale)
- Identify upgrade opportunities to improve building performance
- Manage location-specific climate and cost data

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| State Management | TanStack Query v5 |
| Routing | Wouter |
| Backend | Node.js, Express.js |
| Validation | Zod schemas |
| Storage | In-memory (with database interface ready) |

## Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── fabric-determinants.tsx    # Building fabric inputs (insulation, windows, etc.)
│   │   ├── system-determinants.tsx    # Building systems (heating, lighting, etc.)
│   │   ├── context-determinants.tsx   # Location and demand context
│   │   ├── results-analysis.tsx       # Energy calculation results display
│   │   ├── location-editor.tsx        # Location management interface
│   │   ├── degree-days-calculator.tsx # HDD/CDD calculator component
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── calculation-engine.ts      # Core energy calculation algorithms
│   │   └── queryClient.ts             # TanStack Query configuration
│   ├── pages/
│   │   └── home.tsx                   # Main application page
│   └── App.tsx                        # Application router
├── server/
│   ├── routes.ts                      # API endpoints
│   ├── storage.ts                     # Data storage interface
│   └── index.ts                       # Express server setup
└── shared/
    └── schema.ts                      # Shared TypeScript types and Zod schemas
```

## Key Features

### 1. Determinants Interface
The application uses a three-panel determinant system:

- **Fabric Determinants**: Building envelope properties (insulation level, air tightness, thermal capacity, exposure, shape, window size)
- **System Determinants**: Mechanical systems (heating fuel/type, hot water, controls, lighting, ventilation, renewables)
- **Context Determinants**: Location and usage patterns (climate, heating/cooling demand, appliances, grid intensity, tariffs)

All inputs support a "None" option for flexibility.

### 2. Calculation Engine (`client/src/lib/calculation-engine.ts`)

The calculation engine performs real building physics calculations:

```typescript
// Key calculations performed:
- Space heating demand (based on degree days, U-values, air changes)
- Space cooling demand (based on cooling degree days)
- Hot water demand
- Lighting energy use
- Appliance energy use
- Carbon emissions (using fuel-specific factors)
- Annual energy costs
- Energy Index (EI) score and rating
```

**Important formulas:**
- Heat loss = Floor area × U-value × Heating Degree Days × 24 / 1000
- Cooling load = Floor area × 2.35 × Cooling Degree Days / 1000
- Carbon emissions = Energy demand × Carbon intensity factor

### 3. Location Management

Locations store climate and cost data:
- Heating Degree Days (HDD) and Cooling Degree Days (CDD)
- Solar radiation, average temperature, wind speed
- Energy costs (gas, electricity, oil, wood)
- Carbon factors for each fuel type
- Regional building standards

**Pre-configured templates:** UK, Northern Europe, Southern Europe

### 4. Degree Days Calculator

Calculates HDD and CDD from temperature data using weather.gov methodology:
- Input: Array of daily high/low temperatures
- Output: Heating and cooling degree days
- Base temperature: Configurable (default 18.3°C / 65°F)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List all assessments |
| POST | `/api/assessments` | Create new assessment |
| GET | `/api/assessments/:id` | Get single assessment |
| PATCH | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Delete assessment |
| GET | `/api/locations` | List all locations |
| POST | `/api/locations` | Create new location |
| PATCH | `/api/locations/:id` | Update location |
| DELETE | `/api/locations/:id` | Delete location |
| POST | `/api/calculate` | Perform energy calculations |
| POST | `/api/calculate-degree-days` | Calculate HDD/CDD from temperatures |

## Data Models

### Assessment
```typescript
{
  id: string;
  name: string;
  // Fabric
  insulation: string;      // 'well' | 'standard' | 'poor' | 'none'
  airChanges: string;      // 'v_low' | 'low' | 'standard' | 'high' | 'none'
  capacity: string;        // 'high' | 'medium' | 'low' | 'none'
  exposure: string;        // 'detached' | 'semi' | 'terrace' | 'flat' | 'none'
  shape: string;           // 'bungalow' | '2-storey' | '3-storey' | 'none'
  windowSize: string;      // 'small' | 'standard' | 'large' | 'none'
  // System
  heatingFuel: string;
  heatingType: string;
  hotWaterType: string;
  controls: string[];
  lightingType: string;
  ventilationType: string;
  renewables: string;
  // Context
  climate: string;
  heatingDemand: string;
  hotWaterDemand: string;
  appliances: string;
  gridIntensity: string;
  tariff: string;
  capital: string;
  locationId: string | null;
}
```

### Location
```typescript
{
  id: string;
  name: string;
  country: string;
  region: string;
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
  buildingStandards: object;
}
```

## Running the Application

```bash
npm run dev
```

This starts both the Express backend and Vite frontend on port 5000.

## Key Implementation Notes

1. **Calculation Engine Location**: The main calculation logic is in `client/src/lib/calculation-engine.ts` but is also mirrored in `server/routes.ts` for API calculations.

2. **State Management**: Form state is managed locally in components, while server data uses TanStack Query with cache invalidation.

3. **"None" Options**: All determinant inputs support "None" which tells the calculation engine to use baseline/default values.

4. **Location Integration**: When a location is selected, its climate data (HDD, CDD) and cost/carbon factors override the standard templates.

5. **Energy Index Scoring**: The EI score ranges from 1-7 (A-G rating), calculated from total energy demand relative to a reference building.

## Testing Calculations

Example API call to test cooling calculations:
```bash
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "assessment": {...},
    "locationId": "location-with-cooling-degree-days"
  }'
```

The response includes a breakdown with `cooling` field showing calculated cooling demand in kWh.

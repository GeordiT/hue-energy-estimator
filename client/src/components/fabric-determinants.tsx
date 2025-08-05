import { Assessment, insulationOptions, airChangesOptions, capacityOptions, exposureOptions, shapeOptions } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield, Wind, Thermometer, Building, Home, Square } from "lucide-react";

interface FabricDeterminantsProps {
  assessment: Assessment;
  onUpdate: (updates: Partial<Assessment>) => void;
}

// U-value lookup tables
const insulationUValues = {
  poor: { wall: 1.5, roof: 0.6, floor: 0.8, glazing: 5.0 },
  standard: { wall: 0.45, roof: 0.25, floor: 0.30, glazing: 2.8 },
  medium: { wall: 0.35, roof: 0.20, floor: 0.25, glazing: 2.0 },
  good: { wall: 0.30, roof: 0.16, floor: 0.22, glazing: 1.6 },
  super: { wall: 0.15, roof: 0.10, floor: 0.15, glazing: 0.8 },
};

const airChangeRates = {
  poor: 1.5,
  standard: 0.85,
  tight: 0.6,
};

const exposureWalls = {
  detached: 4,
  "semi-detached": 3,
  "mid-terrace": 2,
  "flat-g": 3,
  "flat-t": 3,
  "flat-m": 3,
};

export default function FabricDeterminants({ assessment, onUpdate }: FabricDeterminantsProps) {
  const currentUValues = insulationUValues[assessment.insulation as keyof typeof insulationUValues];
  const currentAirChangeRate = airChangeRates[assessment.airChanges as keyof typeof airChangeRates];
  const currentExtWalls = exposureWalls[assessment.exposure as keyof typeof exposureWalls];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Insulation Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Insulation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.insulation}
            onValueChange={(value) => onUpdate({ insulation: value })}
          >
            {insulationOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`insulation-${option.value}`} />
                <Label
                  htmlFor={`insulation-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Wall U:</span>
                <span className="font-mono font-medium ml-1">{currentUValues.wall}</span>
              </div>
              <div>
                <span className="text-gray-600">Roof U:</span>
                <span className="font-mono font-medium ml-1">{currentUValues.roof}</span>
              </div>
              <div>
                <span className="text-gray-600">Floor U:</span>
                <span className="font-mono font-medium ml-1">{currentUValues.floor}</span>
              </div>
              <div>
                <span className="text-gray-600">Glz U:</span>
                <span className="font-mono font-medium ml-1">{currentUValues.glazing}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Air Changes Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-primary" />
            <span>Air Changes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.airChanges}
            onValueChange={(value) => onUpdate({ airChanges: value })}
          >
            {airChangesOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`airchanges-${option.value}`} />
                <Label
                  htmlFor={`airchanges-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              <span>Current Rate:</span>
              <span className="font-mono font-medium ml-1">{currentAirChangeRate}</span>
              <span className="ml-1">ac/h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thermal Capacity Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <span>Thermal Capacity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.capacity}
            onValueChange={(value) => onUpdate({ capacity: value })}
          >
            {capacityOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`capacity-${option.value}`} />
                <Label
                  htmlFor={`capacity-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              <span>Position:</span>
              <span className="font-medium ml-1">Inside</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exposure Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Exposure</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.exposure}
            onValueChange={(value) => onUpdate({ exposure: value })}
          >
            {exposureOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`exposure-${option.value}`} />
                <Label
                  htmlFor={`exposure-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              <span>Ext. walls:</span>
              <span className="font-mono font-medium ml-1">{currentExtWalls}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shape Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Home className="w-5 h-5 text-primary" />
            <span>Shape</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.shape}
            onValueChange={(value) => onUpdate({ shape: value })}
          >
            {shapeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`shape-${option.value}`} />
                <Label
                  htmlFor={`shape-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Window Size Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Square className="w-5 h-5 text-primary" />
            <span>Window Size</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.windowSize}
            onValueChange={(value) => onUpdate({ windowSize: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standard" id="windows-standard" />
              <Label htmlFor="windows-standard" className="text-sm cursor-pointer">
                Standard (17.5% of floor area)
              </Label>
            </div>
          </RadioGroup>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              <span>TC ID:</span>
              <span className="font-mono font-medium ml-1">TC_2485</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

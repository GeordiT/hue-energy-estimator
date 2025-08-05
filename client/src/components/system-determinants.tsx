import { Assessment, heatingFuelOptions, heatingTypeOptions } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Fuel, Zap, Droplets, Settings } from "lucide-react";

interface SystemDeterminantsProps {
  assessment: Assessment;
  onUpdate: (updates: Partial<Assessment>) => void;
}

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

const hotWaterOptions = [
  { value: "main_tank", label: "Main tank (integrated)", description: "Main heating source heats hot water in tank" },
  { value: "main_combi", label: "Main combi", description: "Main heating source provides instant hot water" },
  { value: "elec_immer", label: "Electric immersion", description: "Separate electric immersion heater" },
  { value: "inst_gas", label: "Instant gas", description: "Separate gas instant heater" },
  { value: "inst_elec", label: "Instant electric", description: "Separate electric instant heater" },
];

const controlsOptions = [
  { value: "thermostatic_radiator_valves", label: "Thermostatic radiator valves" },
  { value: "room_thermostat", label: "Room thermostat" },
  { value: "time_control", label: "Time control" },
  { value: "zone_control", label: "Zone control" },
];

export default function SystemDeterminants({ assessment, onUpdate }: SystemDeterminantsProps) {
  const currentHeatingEff = heatingEfficiencies[assessment.heatingType as keyof typeof heatingEfficiencies];
  const adjustedEfficiency = Math.round(currentHeatingEff * 0.95); // Simplified adjustment for controls

  const handleControlsChange = (controlValue: string, checked: boolean) => {
    const currentControls = Array.isArray(assessment.controls) ? assessment.controls as string[] : [];
    let newControls: string[];
    
    if (checked) {
      newControls = [...currentControls, controlValue];
    } else {
      newControls = currentControls.filter(c => c !== controlValue);
    }
    
    onUpdate({ controls: newControls });
  };

  const currentControls = Array.isArray(assessment.controls) ? assessment.controls as string[] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Heating Fuel Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Fuel className="w-5 h-5 text-primary" />
            <span>Heating Fuel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.heatingFuel}
            onValueChange={(value) => onUpdate({ heatingFuel: value })}
          >
            {heatingFuelOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`fuel-${option.value}`} />
                <Label
                  htmlFor={`fuel-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Heating System Type Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Heating System Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.heatingType}
            onValueChange={(value) => onUpdate({ heatingType: value })}
          >
            {heatingTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`heating-${option.value}`} />
                <Label
                  htmlFor={`heating-${option.value}`}
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
                <span className="text-gray-600">Heff %:</span>
                <span className="font-mono font-medium ml-1">{currentHeatingEff}</span>
              </div>
              <div>
                <span className="text-gray-600">Heff Adj %:</span>
                <span className="font-mono font-medium ml-1">{adjustedEfficiency}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hot Water System Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span>Hot Water System</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.hotWaterType}
            onValueChange={(value) => onUpdate({ hotWaterType: value })}
          >
            {hotWaterOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`hotwater-${option.value}`} />
                <Label
                  htmlFor={`hotwater-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Controls Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {controlsOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`control-${option.value}`}
                checked={currentControls.includes(option.value)}
                onCheckedChange={(checked) => handleControlsChange(option.value, !!checked)}
              />
              <Label
                htmlFor={`control-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lighting Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Lighting</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.lightingType}
            onValueChange={(value) => onUpdate({ lightingType: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="100% lel" id="lighting-led" />
              <Label htmlFor="lighting-led" className="text-sm cursor-pointer">
                100% LED (Low energy lighting)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0% lel" id="lighting-incandescent" />
              <Label htmlFor="lighting-incandescent" className="text-sm cursor-pointer">
                0% LED (Incandescent lighting)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Ventilation/Cooling Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Ventilation / Cooling</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={assessment.ventilationType}
            onValueChange={(value) => onUpdate({ ventilationType: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nat / wet ext" id="vent-natural" />
              <Label htmlFor="vent-natural" className="text-sm cursor-pointer">
                Natural / Wet extract
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mvhr std" id="vent-mvhr-std" />
              <Label htmlFor="vent-mvhr-std" className="text-sm cursor-pointer">
                MVHR Standard (66% efficiency)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mvhr h.eff" id="vent-mvhr-high" />
              <Label htmlFor="vent-mvhr-high" className="text-sm cursor-pointer">
                MVHR High efficiency (85%)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mvhr super" id="vent-mvhr-super" />
              <Label htmlFor="vent-mvhr-super" className="text-sm cursor-pointer">
                MVHR Super (88% efficiency)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Air-cond" id="vent-aircon" />
              <Label htmlFor="vent-aircon" className="text-sm cursor-pointer">
                Air conditioning
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

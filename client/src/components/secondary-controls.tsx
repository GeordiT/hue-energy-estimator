import { Assessment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import LocationEditor from "./location-editor";

interface SecondaryControlsProps {
  assessment: Assessment;
  onUpdate: (updates: Partial<Assessment>) => void;
  onSaveCurrentSettings: () => void;
}

export default function SecondaryControls({ assessment, onUpdate, onSaveCurrentSettings }: SecondaryControlsProps) {
  // Calculate fabric quality score (0-100)
  const fabricScore = (() => {
    const insulationScore = {
      poor: 0,
      standard: 25,
      medium: 50,
      good: 75,
      super: 100,
    }[assessment.insulation] || 25;
    
    const airChangesScore = {
      poor: 0,
      standard: 50,
      tight: 100,
    }[assessment.airChanges] || 50;
    
    return Math.round((insulationScore + airChangesScore) / 2);
  })();

  // Calculate system efficiency score (0-100)
  const systemScore = (() => {
    const heatingScore = {
      fires: 30,
      boiler_l_eff: 40,
      boiler_m_eff: 50,
      boiler_h_eff: 70,
      boiler_cond: 90,
      u_chp: 85,
      com_chp: 80,
      ashp: 95,
      gshp: 100,
      storage: 60,
    }[assessment.heatingType] || 50;
    
    return Math.round(heatingScore);
  })();

  const handleFabricSliderChange = (value: number[]) => {
    const score = value[0];
    
    if (score < 20) {
      onUpdate({ insulation: "poor", airChanges: "poor" });
    } else if (score < 40) {
      onUpdate({ insulation: "standard", airChanges: "standard" });
    } else if (score < 60) {
      onUpdate({ insulation: "medium", airChanges: "standard" });
    } else if (score < 80) {
      onUpdate({ insulation: "good", airChanges: "tight" });
    } else {
      onUpdate({ insulation: "super", airChanges: "tight" });
    }
  };

  const handleSystemSliderChange = (value: number[]) => {
    const score = value[0];
    
    if (score < 20) {
      onUpdate({ heatingType: "fires" });
    } else if (score < 40) {
      onUpdate({ heatingType: "boiler_l_eff" });
    } else if (score < 60) {
      onUpdate({ heatingType: "boiler_m_eff" });
    } else if (score < 80) {
      onUpdate({ heatingType: "boiler_h_eff" });
    } else {
      onUpdate({ heatingType: "boiler_cond" });
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Secondary Controls</h2>
        
        {/* Fabric Slider */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Fabric Quality
          </Label>
          <div className="px-2">
            <Slider
              value={[fabricScore]}
              onValueChange={handleFabricSliderChange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        {/* System Slider */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            System Efficiency
          </Label>
          <div className="px-2">
            <Slider
              value={[systemScore]}
              onValueChange={handleSystemSliderChange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Basic</span>
              <span>High-Tech</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full text-primary border-primary hover:bg-blue-50">
            Load Preset Configuration
          </Button>
          <Button
            variant="outline"
            className="w-full text-secondary border-secondary hover:bg-green-50"
            onClick={onSaveCurrentSettings}
            title="Save the current assessment to this browser now. Edits are also saved automatically."
          >
            Save Current Settings
          </Button>
          <Button variant="outline" className="w-full">
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Detailed Inputs */}
      <div className="flex-1 p-6 overflow-auto">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Detailed Inputs</h3>
        
        <div className="space-y-4">
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Current Determinant Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Insulation:</span>
                <span className="font-medium capitalize">{assessment.insulation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Air changes:</span>
                <span className="font-medium capitalize">{assessment.airChanges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium capitalize">{assessment.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cap posn:</span>
                <span className="font-medium">Inside</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Window size:</span>
                <span className="font-medium">Standard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exposure:</span>
                <span className="font-medium capitalize">{assessment.exposure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shape:</span>
                <span className="font-medium">{assessment.shape}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Location Data Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LocationEditor 
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    Add New Location
                  </Button>
                }
              />
              <LocationEditor 
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Climate Parameters
                  </Button>
                }
              />
              <Button variant="outline" size="sm" className="w-full">
                Import Regional Template
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Export Location Data
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Advanced Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="future-climate" />
                <Label htmlFor="future-climate" className="text-sm">
                  Enable future climate scenarios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="renewables" defaultChecked />
                <Label htmlFor="renewables" className="text-sm">
                  Include renewable options
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cost-breakdown" />
                <Label htmlFor="cost-breakdown" className="text-sm">
                  Detailed cost breakdown
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="compliance" />
                <Label htmlFor="compliance" className="text-sm">
                  Regulatory compliance check
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}

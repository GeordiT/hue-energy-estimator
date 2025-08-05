import { Assessment, Location } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Users, DollarSign, Leaf, Plus, Edit } from "lucide-react";
import LocationEditor from "./location-editor";

interface ContextDeterminantsProps {
  assessment: Assessment;
  locations: Location[];
  onUpdate: (updates: Partial<Assessment>) => void;
}

export default function ContextDeterminants({ assessment, locations, onUpdate }: ContextDeterminantsProps) {
  const selectedLocation = locations.find(loc => loc.id === assessment.locationId);

  const occupancyTypes = [
    { value: "standard", label: "Standard" },
    { value: "high", label: "High occupancy" },
    { value: "low", label: "Low occupancy" },
    { value: "elderly", label: "Elderly/retired" },
    { value: "family", label: "Family with children" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Climate Settings Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>Climate Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Location</Label>
            <Select
              value={assessment.locationId || ""}
              onValueChange={(value) => onUpdate({ locationId: value || null })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedLocation && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Heating Degree Days</Label>
                  <Input
                    type="number"
                    value={selectedLocation.heatingDegreeDays}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Solar Radiation (kWh/m²)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.solarRadiation}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <LocationEditor 
                  location={selectedLocation} 
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Climate Data
                    </Button>
                  }
                />
                <LocationEditor 
                  onLocationCreated={(newLocation) => onUpdate({ locationId: newLocation.id })}
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      New Location
                    </Button>
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Occupancy Patterns Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Occupancy Patterns</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Occupancy Type</Label>
            <Select
              value={assessment.heatingDemand}
              onValueChange={(value) => onUpdate({ heatingDemand: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {occupancyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">Target Temperature (°C)</Label>
              <Input type="number" defaultValue="20" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1">Heating Hours/Day</Label>
              <Input type="number" defaultValue="12" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Parameters Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Cost Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLocation && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Gas (p/kWh)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.gasCost}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Electricity (p/kWh)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.electricityCost}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Oil (p/litre)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.oilCost}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Wood (£/tonne)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.woodCost}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </>
          )}
          <LocationEditor 
            location={selectedLocation}
            trigger={
              <Button variant="outline" className="w-full text-secondary border-secondary hover:bg-green-50">
                <Edit className="w-4 h-4 mr-2" />
                Edit Cost Parameters
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Carbon Factors Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span>Carbon Factors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLocation && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Gas (kgCO₂/kWh)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.gasCarbon}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Electricity (kgCO₂/kWh)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.electricityCarbon}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Oil (kgCO₂/litre)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.oilCarbon}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Wood (kgCO₂/kg)</Label>
                  <Input
                    type="number"
                    value={selectedLocation.woodCarbon}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

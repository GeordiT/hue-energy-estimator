import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Location, InsertLocation, insertLocationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Globe, Thermometer, DollarSign, Leaf, Plus, Edit, Calculator } from "lucide-react";
import DegreeDaysCalculator from "./degree-days-calculator";

interface LocationEditorProps {
  location?: Location;
  onLocationCreated?: (location: Location) => void;
  trigger?: React.ReactNode;
}

export default function LocationEditor({ location, onLocationCreated, trigger }: LocationEditorProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: location ? {
      name: location.name,
      country: location.country,
      region: location.region || "",
      heatingDegreeDays: location.heatingDegreeDays,
      solarRadiation: location.solarRadiation,
      averageTemp: location.averageTemp,
      windSpeed: location.windSpeed,
      gasCost: location.gasCost,
      electricityCost: location.electricityCost,
      oilCost: location.oilCost,
      woodCost: location.woodCost,
      gasCarbon: location.gasCarbon,
      electricityCarbon: location.electricityCarbon,
      oilCarbon: location.oilCarbon,
      woodCarbon: location.woodCarbon,
      buildingStandards: location.buildingStandards || {},
    } : {
      name: "",
      country: "",
      region: "",
      heatingDegreeDays: 2650,
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
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      const response = await apiRequest("POST", "/api/locations", data);
      return response.json();
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location created",
        description: `${newLocation.name} has been added successfully.`,
      });
      onLocationCreated?.(newLocation);
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      if (!location) throw new Error("No location to update");
      const response = await apiRequest("PUT", `/api/locations/${location.id}`, data);
      return response.json();
    },
    onSuccess: (updatedLocation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location updated",
        description: `${updatedLocation.name} has been updated successfully.`,
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLocation) => {
    if (location) {
      updateLocationMutation.mutate(data);
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const loadTemplate = (templateType: string) => {
    const templates = {
      uk: {
        heatingDegreeDays: 2650,
        coolingDegreeDays: 25,
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
      },
      northern_europe: {
        heatingDegreeDays: 3200,
        coolingDegreeDays: 10,
        solarRadiation: 850,
        averageTemp: 6.2,
        windSpeed: 5.1,
        gasCost: 8.5,
        electricityCost: 32.0,
        oilCost: 95,
        woodCost: 320,
        gasCarbon: 0.202,
        electricityCarbon: 0.280,
        oilCarbon: 2.65,
        woodCarbon: 0.025,
      },
      southern_europe: {
        heatingDegreeDays: 1800,
        coolingDegreeDays: 450,
        solarRadiation: 1400,
        averageTemp: 14.5,
        windSpeed: 3.2,
        gasCost: 9.2,
        electricityCost: 25.0,
        oilCost: 88,
        woodCost: 280,
        gasCarbon: 0.195,
        electricityCarbon: 0.185,
        oilCarbon: 2.48,
        woodCarbon: 0.025,
      },
    };

    const template = templates[templateType as keyof typeof templates];
    if (template) {
      Object.entries(template).forEach(([key, value]) => {
        form.setValue(key as keyof InsertLocation, value);
      });
      toast({
        title: "Template loaded",
        description: `${templateType.replace('_', ' ')} template values have been applied.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            {location ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {location ? "Edit Location" : "Add Location"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {location ? "Edit Location" : "Create New Location"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Edinburgh, Scotland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scotland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Central Belt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Climate Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="w-5 h-5 text-primary" />
                  <span>Climate Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="heatingDegreeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heating Degree Days</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coolingDegreeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooling Degree Days</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="solarRadiation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solar Radiation (kWh/m²)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="averageTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="windSpeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wind Speed (m/s)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => loadTemplate('uk')}>
                    Load UK Template
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => loadTemplate('northern_europe')}>
                    Load Northern Europe
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => loadTemplate('southern_europe')}>
                    Load Southern Europe
                  </Button>
                  <DegreeDaysCalculator 
                    onResult={(heatingDD, coolingDD) => {
                      form.setValue('heatingDegreeDays', heatingDD);
                      form.setValue('coolingDegreeDays', coolingDD);
                      toast({
                        title: "Degree days updated",
                        description: `HDD: ${heatingDD}, CDD: ${coolingDD}`,
                      });
                    }}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate from Temperature Data
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cost Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span>Energy Costs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="gasCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gas Cost (p/kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity Cost (p/kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oilCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oil Cost (p/litre)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="woodCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wood Cost (£/tonne)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Carbon Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-secondary" />
                  <span>Carbon Emission Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="gasCarbon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gas (kgCO₂/kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityCarbon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity (kgCO₂/kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oilCarbon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oil (kgCO₂/litre)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="woodCarbon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wood (kgCO₂/kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
              >
                {createLocationMutation.isPending || updateLocationMutation.isPending 
                  ? "Saving..." 
                  : location ? "Update Location" : "Create Location"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
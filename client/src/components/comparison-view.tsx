import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Assessment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/storage-provider";
import { calculateEnergyPerformance } from "@/lib/calculation-engine";
import { insertAssessmentSchema } from "@shared/schema";
import { Copy, ArrowRight, DollarSign, Leaf, Star, Zap, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";

interface ComparisonViewProps {
  currentAssessment: Assessment;
}

interface ComparisonScenario {
  id: string;
  name: string;
  results: {
    energyDemand: number;
    carbonEmissions: number;
    annualCost: number;
    eiScore: number;
  };
}

interface ComparisonResult {
  baseline: ComparisonScenario;
  upgrade: ComparisonScenario;
  comparison: {
    energySavings: number;
    costSavings: number;
    carbonSavings: number;
    eiImprovement: number;
    energySavingsPercent: number;
    costSavingsPercent: number;
    carbonSavingsPercent: number;
  };
}

const getRatingLetter = (score: number) => {
  if (score >= 92) return "A";
  if (score >= 81) return "B";
  if (score >= 69) return "C";
  if (score >= 55) return "D";
  if (score >= 39) return "E";
  if (score >= 21) return "F";
  return "G";
};

const getRatingColor = (score: number) => {
  if (score >= 92) return "#22c55e";
  if (score >= 81) return "#84cc16";
  if (score >= 69) return "#eab308";
  if (score >= 55) return "#f97316";
  if (score >= 39) return "#ef4444";
  if (score >= 21) return "#dc2626";
  return "#991b1b";
};

export default function ComparisonView({ currentAssessment }: ComparisonViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>("");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string>("");
  const [capitalCost, setCapitalCost] = useState<number>(0);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ["assessments"],
    queryFn: () => storage.getAllAssessments(),
  });

  const handleCloneForComparison = () => {
    if (!currentAssessment.id) {
      toast({
        title: "Save Assessment First",
        description: "Please save the current assessment before creating a comparison scenario.",
        variant: "destructive",
      });
      return;
    }

    setIsCloning(true);
    try {
      const original = storage.getAssessment(currentAssessment.id);
      if (!original) {
        toast({ title: "Error", description: "Assessment not found.", variant: "destructive" });
        return;
      }

      const cloneData = {
        name: `${original.name} (Upgrade Scenario)`,
        version: original.version || 1,
        insulation: original.insulation ?? "standard",
        airChanges: original.airChanges ?? "standard",
        capacity: original.capacity ?? "high",
        exposure: original.exposure ?? "detached",
        shape: original.shape ?? "2-storey",
        windowSize: original.windowSize ?? "standard",
        heatingFuel: original.heatingFuel ?? "main_gas",
        heatingType: original.heatingType ?? "boiler_h_eff",
        hotWaterType: original.hotWaterType ?? "main_tank",
        controls: Array.isArray(original.controls) ? original.controls : [],
        lightingType: original.lightingType ?? "0% lel",
        ventilationType: original.ventilationType ?? "nat / wet ext",
        renewables: original.renewables ?? "none",
        climate: original.climate ?? "UK std",
        heatingDemand: original.heatingDemand ?? "Scot std",
        hotWaterDemand: original.hotWaterDemand ?? "Scot std",
        appliances: original.appliances ?? "standard",
        gridIntensity: original.gridIntensity ?? "UK std",
        tariff: original.tariff ?? "standard",
        capital: original.capital ?? "standard",
        futureYear: original.futureYear,
        locationId: original.locationId,
      };

      const validated = insertAssessmentSchema.parse(cloneData);
      const cloned = storage.createAssessment(validated);

      const location = cloned.locationId ? storage.getLocation(cloned.locationId) : null;
      const options = cloned.futureYear ? { futureYear: cloned.futureYear } : undefined;
      const results = calculateEnergyPerformance(cloned, location, options);
      storage.saveAssessmentResults(cloned.id, {
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
      });

      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast({
        title: "Assessment Cloned",
        description: `Created "${cloned.name}" for scenario comparison.`,
      });
      setSelectedBaselineId(currentAssessment.id);
      setSelectedUpgradeId(cloned.id);
    } catch {
      toast({ title: "Clone Failed", description: "Failed to clone assessment.", variant: "destructive" });
    } finally {
      setIsCloning(false);
    }
  };

  const handleCompare = () => {
    if (!selectedBaselineId || !selectedUpgradeId) return;

    const baseline = storage.getAssessment(selectedBaselineId);
    const upgrade = storage.getAssessment(selectedUpgradeId);
    if (!baseline || !upgrade) {
      toast({ title: "Error", description: "One or both assessments not found.", variant: "destructive" });
      return;
    }

    const baselineLocation = baseline.locationId ? storage.getLocation(baseline.locationId) : null;
    const upgradeLocation = upgrade.locationId ? storage.getLocation(upgrade.locationId) : null;
    const baselineResults = calculateEnergyPerformance(baseline, baselineLocation);
    const upgradeResults = calculateEnergyPerformance(upgrade, upgradeLocation);

    const energySavings = baselineResults.energyDemand - upgradeResults.energyDemand;
    const costSavings = baselineResults.annualCost - upgradeResults.annualCost;
    const carbonSavings = baselineResults.carbonEmissions - upgradeResults.carbonEmissions;
    const eiImprovement = upgradeResults.eiScore - baselineResults.eiScore;

    setComparisonResult({
      baseline: {
        id: baseline.id,
        name: baseline.name,
        results: {
          energyDemand: baselineResults.energyDemand,
          carbonEmissions: baselineResults.carbonEmissions,
          annualCost: baselineResults.annualCost,
          eiScore: baselineResults.eiScore,
        },
      },
      upgrade: {
        id: upgrade.id,
        name: upgrade.name,
        results: {
          energyDemand: upgradeResults.energyDemand,
          carbonEmissions: upgradeResults.carbonEmissions,
          annualCost: upgradeResults.annualCost,
          eiScore: upgradeResults.eiScore,
        },
      },
      comparison: {
        energySavings,
        costSavings,
        carbonSavings,
        eiImprovement,
        energySavingsPercent: baselineResults.energyDemand > 0
          ? Math.round((energySavings / baselineResults.energyDemand) * 100)
          : 0,
        costSavingsPercent: baselineResults.annualCost > 0
          ? Math.round((costSavings / baselineResults.annualCost) * 100)
          : 0,
        carbonSavingsPercent: baselineResults.carbonEmissions > 0
          ? Math.round((carbonSavings / baselineResults.carbonEmissions) * 100)
          : 0,
      },
    });
  };

  const calculatePaybackPeriod = (): number | null => {
    if (!comparisonResult || capitalCost <= 0) return null;
    const annualSavings = comparisonResult.comparison.costSavings;
    if (annualSavings <= 0) return null;
    return Math.round((capitalCost / annualSavings) * 10) / 10;
  };

  const paybackYears = calculatePaybackPeriod();

  const chartData = comparisonResult ? [
    {
      metric: "Energy Cost",
      baseline: comparisonResult.baseline.results.annualCost,
      upgrade: comparisonResult.upgrade.results.annualCost,
      unit: "£/year",
    },
    {
      metric: "Carbon Emissions",
      baseline: comparisonResult.baseline.results.carbonEmissions,
      upgrade: comparisonResult.upgrade.results.carbonEmissions,
      unit: "kgCO₂/year",
    },
    {
      metric: "Energy Demand",
      baseline: comparisonResult.baseline.results.energyDemand,
      upgrade: comparisonResult.upgrade.results.energyDemand,
      unit: "kWh/year",
    },
  ] : [];

  const eiChartData = comparisonResult ? [
    {
      name: "Baseline",
      score: comparisonResult.baseline.results.eiScore,
      rating: getRatingLetter(comparisonResult.baseline.results.eiScore),
    },
    {
      name: "Upgrade",
      score: comparisonResult.upgrade.results.eiScore,
      rating: getRatingLetter(comparisonResult.upgrade.results.eiScore),
    },
  ] : [];

  const generateBreakevenData = () => {
    if (!comparisonResult || capitalCost <= 0) return [];
    const annualSavings = comparisonResult.comparison.costSavings;
    if (annualSavings <= 0) return [];

    const data = [];
    const maxYears = Math.min(Math.ceil(capitalCost / annualSavings) + 5, 30);
    
    for (let year = 0; year <= maxYears; year++) {
      const cumulativeSavings = year * annualSavings;
      const netPosition = cumulativeSavings - capitalCost;
      data.push({
        year,
        cumulativeSavings,
        capitalCost,
        netPosition,
      });
    }
    return data;
  };

  const breakevenData = generateBreakevenData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Scenario Comparison
          </CardTitle>
          <CardDescription>
            Compare baseline and upgrade scenarios to analyze energy, cost, and carbon savings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <Button
              onClick={handleCloneForComparison}
              disabled={!currentAssessment.id || isCloning}
              data-testid="button-clone-assessment"
            >
              <Copy className="w-4 h-4 mr-2" />
              {isCloning ? "Cloning..." : "Clone Current for Comparison"}
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Baseline Scenario</Label>
              <Select value={selectedBaselineId} onValueChange={setSelectedBaselineId}>
                <SelectTrigger data-testid="select-baseline">
                  <SelectValue placeholder="Select baseline assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Upgrade Scenario</Label>
              <Select value={selectedUpgradeId} onValueChange={setSelectedUpgradeId}>
                <SelectTrigger data-testid="select-upgrade">
                  <SelectValue placeholder="Select upgrade assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={!selectedBaselineId || !selectedUpgradeId}
            className="w-full"
            data-testid="button-compare"
          >
            Compare Scenarios
          </Button>
        </CardContent>
      </Card>

      {comparisonResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cost Savings</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-cost-savings">
                      £{comparisonResult.comparison.costSavings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{comparisonResult.comparison.costSavingsPercent}% reduction</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Carbon Reduction</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-carbon-savings">
                      {comparisonResult.comparison.carbonSavings.toLocaleString()} kg
                    </p>
                    <p className="text-xs text-gray-500">{comparisonResult.comparison.carbonSavingsPercent}% reduction</p>
                  </div>
                  <Leaf className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Energy Savings</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-energy-savings">
                      {comparisonResult.comparison.energySavings.toLocaleString()} kWh
                    </p>
                    <p className="text-xs text-gray-500">{comparisonResult.comparison.energySavingsPercent}% reduction</p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">EI Improvement</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-ei-improvement">
                      +{comparisonResult.comparison.eiImprovement} points
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRatingLetter(comparisonResult.baseline.results.eiScore)} → {getRatingLetter(comparisonResult.upgrade.results.eiScore)}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="metric" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === "baseline" ? "Baseline" : "Upgrade"
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" />
                    <Bar dataKey="upgrade" name="Upgrade" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy Rating Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eiChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} (${getRatingLetter(value)})`, "EI Score"]}
                    />
                    <Bar dataKey="score" name="EI Score">
                      {eiChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRatingColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                ROI & Payback Calculator
              </CardTitle>
              <CardDescription>
                Enter the capital cost of upgrades to calculate payback period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="capital-cost">Capital Cost (£)</Label>
                  <Input
                    id="capital-cost"
                    type="number"
                    min="0"
                    value={capitalCost}
                    onChange={(e) => setCapitalCost(parseFloat(e.target.value) || 0)}
                    placeholder="Enter upgrade cost"
                    data-testid="input-capital-cost"
                  />
                </div>
                <div className="flex-1">
                  <Label>Annual Savings</Label>
                  <div className="h-10 flex items-center text-lg font-semibold text-green-600">
                    £{comparisonResult.comparison.costSavings.toLocaleString()}/year
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Payback Period</Label>
                  <div className="h-10 flex items-center">
                    {paybackYears !== null ? (
                      <Badge variant={paybackYears <= 7 ? "default" : paybackYears <= 15 ? "secondary" : "destructive"}>
                        <span data-testid="text-payback-period">{paybackYears} years</span>
                      </Badge>
                    ) : (
                      <span className="text-gray-500">Enter capital cost</span>
                    )}
                  </div>
                </div>
              </div>

              {breakevenData.length > 0 && (
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Break-even Analysis</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={breakevenData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" label={{ value: 'Years', position: 'bottom' }} />
                      <YAxis 
                        tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                        label={{ value: '£', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `£${value.toLocaleString()}`,
                          name === "cumulativeSavings" ? "Cumulative Savings" : 
                          name === "capitalCost" ? "Capital Cost" : "Net Position"
                        ]}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeSavings" 
                        name="Cumulative Savings" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="capitalCost" 
                        name="Capital Cost" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="netPosition" 
                        name="Net Position" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {paybackYears && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Break-even point: <strong>{paybackYears} years</strong> — 
                      After this, cumulative savings exceed the initial investment.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

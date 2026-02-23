import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DegreeDaysCalculatorProps {
  onResult?: (heatingDD: number, coolingDD: number) => void;
  trigger?: React.ReactNode;
}

export default function DegreeDaysCalculator({ onResult, trigger }: DegreeDaysCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [dailyHighs, setDailyHighs] = useState("");
  const [dailyLows, setDailyLows] = useState("");
  const [baseTemp, setBaseTemp] = useState(18.3);
  const [result, setResult] = useState<null | {
    heatingDegreeDays: number;
    coolingDegreeDays: number;
    daysCalculated: number;
    baseTemperature: number;
  }>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const parseTemperatures = (input: string): number[] => {
    return input
      .split(/[,\s\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseFloat(s))
      .filter(n => !isNaN(n));
  };

  const handleCalculate = async () => {
    const highsArray = parseTemperatures(dailyHighs);
    const lowsArray = parseTemperatures(dailyLows);

    if (highsArray.length === 0 || lowsArray.length === 0) {
      toast({
        title: "Invalid input",
        description: "Please enter valid temperature data for both highs and lows.",
        variant: "destructive",
      });
      return;
    }

    if (highsArray.length !== lowsArray.length) {
      toast({
        title: "Mismatched data",
        description: "The number of high and low temperatures must match.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      const response = await apiRequest("POST", "/api/calculate-degree-days", {
        dailyHighs: highsArray,
        dailyLows: lowsArray,
        baseTemp,
      });
      
      const data = await response.json();

      setResult(data);
      
      if (onResult) {
        onResult(data.heatingDegreeDays, data.coolingDegreeDays);
      }

      toast({
        title: "Calculation complete",
        description: `Calculated degree days for ${data.daysCalculated} days.`,
      });
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "An error occurred while calculating degree days.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const loadExample = () => {
    // Example data for demonstration - typical UK summer/winter temperatures
    setDailyHighs("22, 25, 28, 26, 24, 21, 19, 23, 27, 29, 31, 28, 25, 22, 20");
    setDailyLows("12, 15, 18, 16, 14, 11, 9, 13, 17, 19, 21, 18, 15, 12, 10");
    toast({
      title: "Example loaded",
      description: "Sample temperature data has been loaded for demonstration.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Degree Days
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <span>Degree Days Calculator</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Based on Weather.gov Methodology</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p>Enter daily high and low temperatures to calculate heating and cooling degree days.</p>
              <p className="mt-2">
                <strong>Formula:</strong> Daily mean = (high + low) ÷ 2<br/>
                If mean &lt; base temp: Heating DD = base temp - mean<br/>
                If mean &gt; base temp: Cooling DD = mean - base temp
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Daily High Temperatures (°C)</Label>
              <Textarea
                placeholder="Enter daily highs, separated by commas or spaces..."
                value={dailyHighs}
                onChange={(e) => setDailyHighs(e.target.value)}
                className="mt-1 h-32"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Daily Low Temperatures (°C)</Label>
              <Textarea
                placeholder="Enter daily lows, separated by commas or spaces..."
                value={dailyLows}
                onChange={(e) => setDailyLows(e.target.value)}
                className="mt-1 h-32"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Base Temperature (°C)</Label>
            <Input
              type="number"
              step="0.1"
              value={baseTemp}
              onChange={(e) => setBaseTemp(parseFloat(e.target.value) || 18.3)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 18.3°C (65°F)</p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleCalculate} disabled={isCalculating} className="flex-1">
              {isCalculating ? "Calculating..." : "Calculate Degree Days"}
            </Button>
            <Button variant="outline" onClick={loadExample}>
              Load Example
            </Button>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Heating Degree Days</p>
                    <p className="text-2xl font-bold text-orange-600">{result.heatingDegreeDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cooling Degree Days</p>
                    <p className="text-2xl font-bold text-blue-600">{result.coolingDegreeDays}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Calculated from {result.daysCalculated} days using base temperature of {result.baseTemperature}°C
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
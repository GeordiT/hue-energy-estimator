import { Assessment, Location } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Leaf, DollarSign, Star, Printer, FileText } from "lucide-react";
import { generateUpgradeRecommendations } from "@/lib/calculation-engine";

interface ResultsAnalysisProps {
  assessment: Assessment;
  locations: Location[];
}

const getRatingColor = (score: number) => {
  if (score >= 92) return "bg-green-600";
  if (score >= 81) return "bg-green-500";
  if (score >= 69) return "bg-yellow-500";
  if (score >= 55) return "bg-orange-500";
  if (score >= 39) return "bg-red-500";
  if (score >= 21) return "bg-red-600";
  return "bg-red-700";
};

const getRatingLetter = (score: number) => {
  if (score >= 92) return "A";
  if (score >= 81) return "B";
  if (score >= 69) return "C";
  if (score >= 55) return "D";
  if (score >= 39) return "E";
  if (score >= 21) return "F";
  return "G";
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-green-500";
    case "medium": return "bg-blue-500";
    case "low": return "bg-orange-500";
    default: return "bg-gray-500";
  }
};

export default function ResultsAnalysis({ assessment, locations }: ResultsAnalysisProps) {
  const location = locations.find(loc => loc.id === assessment.locationId);
  const recommendations = generateUpgradeRecommendations(assessment, location || null);
  
  const eiScore = assessment.eiScore || 0;
  const ratingLetter = getRatingLetter(eiScore);
  const ratingColor = getRatingColor(eiScore);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 energy-passport">
      {/* Print Header - Only visible in print */}
      <div className="hidden print:block energy-passport-header">
        <h1>Energy Performance Certificate</h1>
        <p className="subtitle">
          Assessment: {assessment.name} | Generated: {currentDate}
        </p>
      </div>

      {/* Print Button - Hidden in print */}
      <div className="flex justify-end gap-2 no-print">
        <Button 
          onClick={handlePrint} 
          variant="outline"
          data-testid="button-print-passport"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Energy Passport
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energy Demand</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessment.energyDemand?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500">kWh/year</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Carbon Emissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessment.carbonEmissions?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500">kgCO₂/year</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annual Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{assessment.annualCost?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">EI Score</p>
                <p className="text-2xl font-bold text-gray-900">{eiScore}</p>
                <p className="text-xs text-gray-500">Rating: {ratingLetter}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Space Heating</span>
              <span className="font-mono font-medium">
                {Math.round((assessment.energyDemand || 0) * 0.45).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Hot Water</span>
              <span className="font-mono font-medium">
                {Math.round((assessment.energyDemand || 0) * 0.20).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Space Cooling</span>
              <span className="font-mono font-medium text-blue-600">
                {Math.round((assessment.energyDemand || 0) * 0.14).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Lighting</span>
              <span className="font-mono font-medium">
                {Math.round((assessment.energyDemand || 0) * 0.12).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Appliances</span>
              <span className="font-mono font-medium">
                {Math.round((assessment.energyDemand || 0) * 0.09).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 font-semibold">
              <span className="text-sm text-gray-900">Total</span>
              <span className="font-mono">{assessment.energyDemand?.toLocaleString() || "0"} kWh</span>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                rec.priority === "high" ? "bg-green-50 border-green-200" :
                rec.priority === "medium" ? "bg-blue-50 border-blue-200" :
                "bg-orange-50 border-orange-200"
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-medium ${
                    rec.priority === "high" ? "text-green-900" :
                    rec.priority === "medium" ? "text-blue-900" :
                    "text-orange-900"
                  }`}>
                    {rec.name}
                  </h4>
                  <Badge className={`${getPriorityColor(rec.priority)} text-white`}>
                    {rec.priority} Priority
                  </Badge>
                </div>
                <p className={`text-sm mb-2 ${
                  rec.priority === "high" ? "text-green-800" :
                  rec.priority === "medium" ? "text-blue-800" :
                  "text-orange-800"
                }`}>
                  {rec.description}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className={`${
                      rec.priority === "high" ? "text-green-600" :
                      rec.priority === "medium" ? "text-blue-600" :
                      "text-orange-600"
                    }`}>Cost:</span>
                    <span className="font-mono font-medium ml-1">
                      £{rec.cost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className={`${
                      rec.priority === "high" ? "text-green-600" :
                      rec.priority === "medium" ? "text-blue-600" :
                      "text-orange-600"
                    }`}>Savings:</span>
                    <span className="font-mono font-medium ml-1">
                      £{Math.round(rec.annualSavings)}/yr
                    </span>
                  </div>
                  <div>
                    <span className={`${
                      rec.priority === "high" ? "text-green-600" :
                      rec.priority === "medium" ? "text-blue-600" :
                      "text-orange-600"
                    }`}>Payback:</span>
                    <span className="font-mono font-medium ml-1">
                      {rec.paybackYears} years
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Energy Performance Rating Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Performance Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { letter: "A", range: "92-100", score: 96 },
              { letter: "B", range: "81-91", score: 86 },
              { letter: "C", range: "69-80", score: 75 },
              { letter: "D", range: "55-68", score: 62 },
              { letter: "E", range: "39-54", score: 47 },
              { letter: "F", range: "21-38", score: 30 },
              { letter: "G", range: "1-20", score: 10 },
            ].map((rating) => (
              <div key={rating.letter} className="flex items-center space-x-4">
                <div className={`w-12 h-8 ${getRatingColor(rating.score)} rounded flex items-center justify-center text-white font-bold text-sm`}>
                  {rating.letter}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                  {rating.letter === ratingLetter && (
                    <>
                      <div
                        className={`absolute inset-y-0 left-0 ${getRatingColor(eiScore)} rounded-full`}
                        style={{ width: `${Math.min(100, (eiScore / 100) * 100)}%` }}
                      ></div>
                      <div
                        className="absolute w-2 h-2 bg-red-600 rounded-full transform -translate-y-1/2"
                        style={{
                          left: `${Math.min(100, (eiScore / 100) * 100)}%`,
                          top: "50%",
                          transform: "translateY(-50%) translateX(-50%)",
                        }}
                      ></div>
                    </>
                  )}
                </div>
                <span className="text-sm text-gray-600 w-20">{rating.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current EI Score: {eiScore} (Rating {ratingLetter})</strong><br />
              {eiScore >= 70 
                ? "Your property performs well. Consider the recommended upgrades to further improve energy efficiency."
                : eiScore >= 55
                ? "Your property performs moderately well. Consider the recommended upgrades to improve energy efficiency and reduce running costs."
                : "Your property has significant potential for improvement. The recommended upgrades could substantially reduce energy costs and carbon emissions."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer - Only visible in print */}
      <div className="hidden print:block print-footer">
        <p>
          Energy Performance Certificate generated by HUE (Housing Upgrade Estimator)
        </p>
        <p>
          Developed by ESRU, University of Strathclyde | Assessment Date: {currentDate}
        </p>
        <p className="mt-2 text-xs">
          This certificate provides an assessment of the energy performance of this dwelling.
          It shows the current energy efficiency rating and potential improvements.
        </p>
      </div>
    </div>
  );
}

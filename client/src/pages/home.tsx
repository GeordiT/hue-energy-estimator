import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Assessment, Location } from "@shared/schema";
import { storage } from "@/lib/storage-provider";
import { calculateEnergyPerformance } from "@/lib/calculation-engine";
import Header from "@/components/header";
import FabricDeterminants from "@/components/fabric-determinants";
import SystemDeterminants from "@/components/system-determinants";
import ContextDeterminants from "@/components/context-determinants";
import ResultsAnalysis from "@/components/results-analysis";
import SecondaryControls from "@/components/secondary-controls";
import ComparisonView from "@/components/comparison-view";

type TabType = "fabric" | "system" | "context" | "results" | "compare";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("fabric");
  const [currentAssessment, setCurrentAssessment] = useState<Assessment>({
    id: "",
    name: "New Assessment",
    version: 1,
    insulation: "standard",
    airChanges: "standard",
    capacity: "high",
    exposure: "detached",
    shape: "2-storey",
    windowSize: "standard",
    heatingFuel: "main_gas",
    heatingType: "boiler_h_eff",
    hotWaterType: "main_tank",
    controls: [],
    lightingType: "0% lel",
    ventilationType: "nat / wet ext",
    renewables: "none",
    climate: "UK std",
    heatingDemand: "Scot std",
    hotWaterDemand: "Scot std",
    appliances: "standard",
    gridIntensity: "UK std",
    tariff: "standard",
    capital: "standard",
    futureYear: null,
    locationId: null,
    energyDemand: null,
    carbonEmissions: null,
    annualCost: null,
    eiScore: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const queryClient = useQueryClient();

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: () => storage.getAllLocations(),
  });

  const handleAssessmentChange = useCallback((updates: Partial<Assessment>) => {
    setCurrentAssessment(prev => {
      const updated = { ...prev, ...updates };
      const location = updated.locationId ? storage.getLocation(updated.locationId) : null;
      const options = updated.futureYear ? { futureYear: updated.futureYear } : undefined;
      const results = calculateEnergyPerformance(updated, location, options);

      return {
        ...updated,
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
      };
    });
  }, []);

  const tabs = [
    { key: "fabric" as TabType, label: "Fabric Determinants" },
    { key: "system" as TabType, label: "System Determinants" },
    { key: "context" as TabType, label: "Context Determinants" },
    { key: "results" as TabType, label: "Results & Analysis" },
    { key: "compare" as TabType, label: "Scenario Comparison" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-700 hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {activeTab === "fabric" && (
                <FabricDeterminants
                  assessment={currentAssessment}
                  onUpdate={handleAssessmentChange}
                />
              )}
              {activeTab === "system" && (
                <SystemDeterminants
                  assessment={currentAssessment}
                  onUpdate={handleAssessmentChange}
                />
              )}
              {activeTab === "context" && (
                <ContextDeterminants
                  assessment={currentAssessment}
                  locations={locations}
                  onUpdate={handleAssessmentChange}
                />
              )}
              {activeTab === "results" && (
                <ResultsAnalysis
                  assessment={currentAssessment}
                  locations={locations}
                />
              )}
              {activeTab === "compare" && (
                <ComparisonView
                  currentAssessment={currentAssessment}
                />
              )}
            </div>
          </div>
        </main>

        <SecondaryControls
          assessment={currentAssessment}
          onUpdate={handleAssessmentChange}
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Assessment, Location } from "@shared/schema";
import Header from "@/components/header";
import FabricDeterminants from "@/components/fabric-determinants";
import SystemDeterminants from "@/components/system-determinants";
import ContextDeterminants from "@/components/context-determinants";
import ResultsAnalysis from "@/components/results-analysis";
import SecondaryControls from "@/components/secondary-controls";

type TabType = "fabric" | "system" | "context" | "results";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("fabric");
  const [currentAssessment, setCurrentAssessment] = useState<Assessment>({
    id: "",
    name: "New Assessment",
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
    queryKey: ["/api/locations"],
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: { assessment: Assessment; locationId?: string }) => {
      const response = await apiRequest("POST", "/api/calculate", data);
      return response.json();
    },
    onSuccess: (results) => {
      setCurrentAssessment(prev => ({
        ...prev,
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
      }));
    },
  });

  const handleAssessmentChange = (updates: Partial<Assessment>) => {
    const updated = { ...currentAssessment, ...updates };
    setCurrentAssessment(updated);
    
    // Trigger recalculation
    calculateMutation.mutate({
      assessment: updated,
      locationId: updated.locationId || undefined,
    });
  };

  const tabs = [
    { key: "fabric" as TabType, label: "Fabric Determinants" },
    { key: "system" as TabType, label: "System Determinants" },
    { key: "context" as TabType, label: "Context Determinants" },
    { key: "results" as TabType, label: "Results & Analysis" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
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

          {/* Content Area */}
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
            </div>
          </div>
        </main>

        {/* Secondary Controls Sidebar */}
        <SecondaryControls
          assessment={currentAssessment}
          onUpdate={handleAssessmentChange}
        />
      </div>
    </div>
  );
}

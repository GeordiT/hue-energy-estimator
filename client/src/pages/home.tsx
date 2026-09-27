import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Assessment, Location } from "@shared/schema";
import { storage } from "@/lib/storage-provider";
import { calculateEnergyPerformance } from "@/lib/calculation-engine";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import FabricDeterminants from "@/components/fabric-determinants";
import SystemDeterminants from "@/components/system-determinants";
import ContextDeterminants from "@/components/context-determinants";
import ResultsAnalysis from "@/components/results-analysis";
import SecondaryControls from "@/components/secondary-controls";
import ComparisonView from "@/components/comparison-view";

type TabType = "fabric" | "system" | "context" | "results" | "compare";

function createDefaultAssessment(): Assessment {
  return {
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
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loadCurrentAssessment(): { assessment: Assessment; error: string | null } {
  try {
    return {
      assessment: storage.getCurrentAssessment() ?? createDefaultAssessment(),
      error: null,
    };
  } catch (error) {
    return {
      assessment: createDefaultAssessment(),
      error: getErrorMessage(error),
    };
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("fabric");
  const [initialAssessmentState] = useState(loadCurrentAssessment);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment>(initialAssessmentState.assessment);
  const [assessmentStorageReady] = useState(initialAssessmentState.error === null);
  const [assessmentStorageError, setAssessmentStorageError] = useState(initialAssessmentState.error);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: locations = [],
    isSuccess: locationsLoaded,
    error: locationsError,
  } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: () => storage.getAllLocations(),
  });

  const handleAssessmentChange = useCallback((updates: Partial<Assessment>) => {
    setCurrentAssessment(prev => {
      const updated = { ...prev, ...updates };
      const location = updated.locationId
        ? locations.find(loc => loc.id === updated.locationId) ?? null
        : null;
      const options = updated.futureYear ? { futureYear: updated.futureYear } : undefined;
      const results = calculateEnergyPerformance(updated, location, options);

      return {
        ...updated,
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
        updatedAt: new Date(),
      };
    });
  }, [locations]);

  useEffect(() => {
    if (!assessmentStorageReady) return;

    try {
      storage.saveCurrentAssessment(currentAssessment);
      setAssessmentStorageError(null);
    } catch (error) {
      setAssessmentStorageError(getErrorMessage(error));
    }
  }, [assessmentStorageReady, currentAssessment]);

  useEffect(() => {
    if (!locationsLoaded) return;

    const locationId = currentAssessment.locationId;
    const location = locationId ? locations.find(loc => loc.id === locationId) ?? null : null;
    setCurrentAssessment(previous => {
      if (previous.locationId !== locationId) return previous;

      const options = previous.futureYear ? { futureYear: previous.futureYear } : undefined;
      const results = calculateEnergyPerformance(previous, location, options);
      if (
        previous.energyDemand === results.energyDemand &&
        previous.carbonEmissions === results.carbonEmissions &&
        previous.annualCost === results.annualCost &&
        previous.eiScore === results.eiScore
      ) {
        return previous;
      }

      return {
        ...previous,
        energyDemand: results.energyDemand,
        carbonEmissions: results.carbonEmissions,
        annualCost: results.annualCost,
        eiScore: results.eiScore,
        updatedAt: new Date(),
      };
    });
  }, [currentAssessment.locationId, locations, locationsLoaded]);

  const handleSaveCurrentSettings = useCallback(() => {
    if (!assessmentStorageReady) {
      const message = assessmentStorageError ??
        "The saved assessment could not be loaded, so existing browser data was left untouched.";
      toast({
        title: "Unable to save current settings",
        description: message,
        variant: "destructive",
      });
      return;
    }

    try {
      storage.saveCurrentAssessment(currentAssessment);
      setAssessmentStorageError(null);
      toast({
        title: "Current settings saved",
        description: "This assessment is saved in this browser.",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setAssessmentStorageError(message);
      toast({
        title: "Unable to save current settings",
        description: message,
        variant: "destructive",
      });
    }
  }, [assessmentStorageReady, assessmentStorageError, currentAssessment, toast]);

  const tabs = [
    { key: "fabric" as TabType, label: "Fabric Determinants" },
    { key: "system" as TabType, label: "System Determinants" },
    { key: "context" as TabType, label: "Context Determinants" },
    { key: "results" as TabType, label: "Results & Analysis" },
    { key: "compare" as TabType, label: "Scenario Comparison" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header assessment={currentAssessment} locations={locations} />

      {(assessmentStorageError || locationsError) && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800">
          {assessmentStorageError && (
            <p>
              Assessment storage error: {assessmentStorageError}
              {!assessmentStorageReady && " The existing saved assessment was not overwritten."}
            </p>
          )}
          {locationsError && (
            <p>
              Unable to load saved locations: {getErrorMessage(locationsError)}
            </p>
          )}
        </div>
      )}
      
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
          onSaveCurrentSettings={handleSaveCurrentSettings}
        />
      </div>
    </div>
  );
}

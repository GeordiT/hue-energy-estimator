import { useState } from "react";
import type { Assessment, Location } from "@shared/schema";
import { Download, HandHelping, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAssessmentPdf } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  assessment: Assessment;
  locations: Location[];
}

export default function Header({ assessment, locations }: HeaderProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const location = locations.find(loc => loc.id === assessment.locationId) ?? null;
      await downloadAssessmentPdf(assessment, location);
    } catch (error) {
      toast({
        title: "Could not export report",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HUE</h1>
                <p className="text-xs text-gray-600">Housing Upgrade Estimator</p>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-300 mx-4"></div>
            <div className="hidden md:block">
              <p className="text-sm text-gray-600">Energy Assessment Tool</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <HandHelping className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              className="flex items-center space-x-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Generating PDF..." : "Export Report"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

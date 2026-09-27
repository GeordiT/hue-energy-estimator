import React from "react";
import type { Assessment, Location } from "@shared/schema";
import { generateUpgradeRecommendations } from "@/lib/calculation-engine";

export function hasCalculatedResults(assessment: Assessment): boolean {
  return assessment.energyDemand != null &&
    assessment.carbonEmissions != null &&
    assessment.annualCost != null &&
    assessment.eiScore != null;
}

export async function downloadAssessmentPdf(
  assessment: Assessment,
  location: Location | null,
): Promise<void> {
  if (!hasCalculatedResults(assessment)) {
    throw new Error("Calculate the assessment before exporting a PDF.");
  }

  const recommendations = generateUpgradeRecommendations(assessment, location);
  const [{ pdf }, { default: ReportTemplate }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/report-template"),
  ]);
  const blob = await pdf(
    <ReportTemplate assessment={assessment} location={location} recommendations={recommendations} />,
  ).toBlob();

  if (blob.size === 0) {
    throw new Error("The PDF could not be generated.");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = assessment.name.trim().replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "energy-passport";
  anchor.href = url;
  anchor.download = `${safeName}-energy-passport.pdf`;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
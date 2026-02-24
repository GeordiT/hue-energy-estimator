import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Assessment, Location } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginTop: 18,
    marginBottom: 8,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: "0.5px solid #f3f4f6",
  },
  label: {
    fontSize: 10,
    color: "#4b5563",
    width: "60%",
  },
  value: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    width: "40%",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    padding: 12,
    border: "1px solid #bfdbfe",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  summaryUnit: {
    fontSize: 7,
    color: "#9ca3af",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 8,
  },
  ratingBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingLetter: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  ratingText: {
    fontSize: 12,
    color: "#4b5563",
  },
  recommendationBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  recTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 2,
  },
  recDesc: {
    fontSize: 9,
    color: "#15803d",
    marginBottom: 4,
  },
  recMeta: {
    flexDirection: "row",
    gap: 16,
    fontSize: 8,
    color: "#4b5563",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

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
  if (score >= 92) return "#16a34a";
  if (score >= 81) return "#65a30d";
  if (score >= 69) return "#ca8a04";
  if (score >= 55) return "#ea580c";
  if (score >= 39) return "#dc2626";
  if (score >= 21) return "#b91c1c";
  return "#7f1d1d";
};

interface ReportTemplateProps {
  assessment: Assessment;
  location?: Location | null;
  recommendations: Array<{
    name: string;
    description: string;
    priority: string;
    cost: number;
    annualSavings: number;
    paybackYears: number;
    energySavings: number;
  }>;
}

export default function ReportTemplate({ assessment, location, recommendations }: ReportTemplateProps) {
  const eiScore = assessment.eiScore || 0;
  const ratingLetter = getRatingLetter(eiScore);
  const ratingColor = getRatingColor(eiScore);
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Energy Performance Certificate</Text>
          <Text style={styles.subtitle}>
            {assessment.name} | Generated: {currentDate}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Energy Demand</Text>
            <Text style={styles.summaryValue}>
              {assessment.energyDemand?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.summaryUnit}>kWh/year</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Carbon Emissions</Text>
            <Text style={styles.summaryValue}>
              {assessment.carbonEmissions?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.summaryUnit}>kgCO2/year</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Annual Cost</Text>
            <Text style={styles.summaryValue}>
              £{assessment.annualCost?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.summaryUnit}>per year</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>EI Score</Text>
            <Text style={styles.summaryValue}>{eiScore}</Text>
            <Text style={styles.summaryUnit}>Rating: {ratingLetter}</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
            <Text style={styles.ratingLetter}>{ratingLetter}</Text>
          </View>
          <Text style={styles.ratingText}>
            Energy Index Score: {eiScore} / 100 — Rating {ratingLetter}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Building Fabric</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Insulation</Text>
          <Text style={styles.value}>{assessment.insulation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Air Changes</Text>
          <Text style={styles.value}>{assessment.airChanges}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Thermal Capacity</Text>
          <Text style={styles.value}>{assessment.capacity}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Exposure</Text>
          <Text style={styles.value}>{assessment.exposure}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Building Shape</Text>
          <Text style={styles.value}>{assessment.shape}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Window Size</Text>
          <Text style={styles.value}>{assessment.windowSize}</Text>
        </View>

        <Text style={styles.sectionTitle}>Heating System</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Heating Fuel</Text>
          <Text style={styles.value}>{assessment.heatingFuel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Heating Type</Text>
          <Text style={styles.value}>{assessment.heatingType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Hot Water</Text>
          <Text style={styles.value}>{assessment.hotWaterType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Lighting</Text>
          <Text style={styles.value}>{assessment.lightingType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ventilation</Text>
          <Text style={styles.value}>{assessment.ventilationType}</Text>
        </View>

        {location && (
          <>
            <Text style={styles.sectionTitle}>Location Data</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{location.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Heating Degree Days</Text>
              <Text style={styles.value}>{location.heatingDegreeDays}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cooling Degree Days</Text>
              <Text style={styles.value}>{location.coolingDegreeDays}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Solar Radiation</Text>
              <Text style={styles.value}>{location.solarRadiation} kWh/m²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Average Temperature</Text>
              <Text style={styles.value}>{location.averageTemp}°C</Text>
            </View>
          </>
        )}

        {recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upgrade Recommendations</Text>
            {recommendations.map((rec, i) => (
              <View key={i} style={styles.recommendationBox}>
                <Text style={styles.recTitle}>{rec.name}</Text>
                <Text style={styles.recDesc}>{rec.description}</Text>
                <View style={styles.recMeta}>
                  <Text>Cost: £{rec.cost.toLocaleString()}</Text>
                  <Text>Savings: £{Math.round(rec.annualSavings)}/yr</Text>
                  <Text>Payback: {rec.paybackYears} years</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.footer}>
          <Text>
            Energy Performance Certificate generated by HUE (Housing Upgrade Estimator) | {currentDate}
          </Text>
          <Text>
            This certificate provides an assessment of the energy performance of this dwelling.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

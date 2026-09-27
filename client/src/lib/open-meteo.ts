const BASE_TEMP = 18.3;

interface ClimateResult {
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  solarRadiation: number;
  averageTemp: number;
  windSpeed: number;
}

export async function fetchSiteClimate(latitude: number, longitude: number): Promise<ClimateResult> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Invalid latitude or longitude");
  }

  const year = new Date().getUTCFullYear() - 1;
  const startStr = `${year}-01-01`;
  const endStr = `${year}-12-31`;

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startStr);
  url.searchParams.set("end_date", endStr);
  url.searchParams.set("daily", "temperature_2m_mean,shortwave_radiation_sum,windspeed_10m_max");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();
  const dailyMeans: number[] = data.daily?.temperature_2m_mean ?? [];
  const dailySolar: number[] = data.daily?.shortwave_radiation_sum ?? [];
  const dailyWind: number[] = data.daily?.windspeed_10m_max ?? [];

  if (dailyMeans.length === 0) {
    throw new Error("No temperature data returned from Open-Meteo");
  }

  let hdd = 0;
  let cdd = 0;
  let tempSum = 0;
  let validDays = 0;

  for (const tMean of dailyMeans) {
    if (tMean == null) continue;
    validDays++;
    tempSum += tMean;
    if (tMean < BASE_TEMP) {
      hdd += BASE_TEMP - tMean;
    } else if (tMean > BASE_TEMP) {
      cdd += tMean - BASE_TEMP;
    }
  }

  if (validDays === 0) {
    throw new Error("No valid temperature data returned from Open-Meteo");
  }
  const averageTemp = Math.round((tempSum / validDays) * 10) / 10;

  let totalSolar = 0;
  for (const s of dailySolar) {
    if (s != null) totalSolar += s;
  }
  // Open-Meteo reports shortwave_radiation_sum in MJ/m²; 1 kWh = 3.6 MJ.
  const solarRadiation = Math.round(totalSolar / 3.6);

  let windSum = 0;
  let windCount = 0;
  for (const w of dailyWind) {
    if (w != null) {
      windSum += w;
      windCount++;
    }
  }
  const windSpeed = windCount > 0
    ? Math.round((windSum / windCount / 3.6) * 10) / 10
    : 4.4;

  return {
    heatingDegreeDays: Math.round(hdd),
    coolingDegreeDays: Math.round(cdd),
    solarRadiation,
    averageTemp,
    windSpeed,
  };
}

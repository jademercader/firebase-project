import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Enhanced Local Coordinate Map for Calbayog City.
 */
const CALBAYOG_BRGY_COORDS: Record<string, { lat: number, lng: number }> = {
  'Obrero': { lat: 12.0667, lng: 124.5917 },
  'San Policarpo': { lat: 12.0722, lng: 124.5944 },
  'Lonoy': { lat: 12.1000, lng: 124.6000 },
  'Capoocan': { lat: 12.0611, lng: 124.5861 },
  'Kalilihan': { lat: 12.0750, lng: 124.5889 },
  'Dagum': { lat: 12.0806, lng: 124.5972 },
  'Cabidian': { lat: 12.0583, lng: 124.6139 },
  'Cawayan': { lat: 12.1167, lng: 124.6167 },
  'Burabod': { lat: 12.0500, lng: 124.6000 },
  'Hamorawon': { lat: 12.0944, lng: 124.5778 },
  'Oquendo': { lat: 12.1833, lng: 124.5500 },
  'Trinidad': { lat: 12.1333, lng: 124.5333 },
  'San Joaquin': { lat: 12.1500, lng: 124.5667 },
  'Matobato': { lat: 12.0528, lng: 124.5833 },
  'Payahan': { lat: 12.0639, lng: 124.6028 },
  'Gadgaran': { lat: 12.0556, lng: 124.6250 },
  'Roxas': { lat: 12.0417, lng: 124.6083 },
  'Anislag': { lat: 12.0250, lng: 124.6333 },
  'Danao': { lat: 12.0333, lng: 124.6500 },
  'San Isidro': { lat: 12.0833, lng: 124.5500 },
  'Balud': { lat: 12.0645, lng: 124.5875 },
  'Rawis': { lat: 12.0690, lng: 124.5980 },
  'Bagacay': { lat: 12.0780, lng: 124.6050 },
  'Carayman': { lat: 12.0450, lng: 124.6150 },
  'Palo': { lat: 12.0900, lng: 124.6200 },
  'Tinambacan': { lat: 12.1600, lng: 124.5000 },
  'Malajog': { lat: 12.1750, lng: 124.4850 },
  'Mabini': { lat: 12.1200, lng: 124.5400 },
  'Maguinoo': { lat: 12.1450, lng: 124.5200 },
  'Banjao': { lat: 12.1050, lng: 124.5850 },
};

function addJitter(val: number, amount: number = 0.005) {
  return val + (Math.random() - 0.5) * amount;
}

function getCoordinatesFromAddress(address: string) {
  if (!address) return null;
  const lowerAddr = address.toLowerCase();
  for (const [brgy, coords] of Object.entries(CALBAYOG_BRGY_COORDS)) {
    if (lowerAddr.includes(brgy.toLowerCase())) return coords;
  }
  return null;
}

function recordToVector(record: HealthRecord, indicators: string[]): { [key: string]: number } {
  const vector: { [key: string]: number } = {};
  
  // Weights to emphasize spatial and disease similarity
  const SPATIAL_WEIGHT = 4.0;
  const DISEASE_WEIGHT = 2.0;

  if (record.latitude !== undefined && record.longitude !== undefined) {
    vector['lat'] = ((record.latitude - 12.0) * 10) * SPATIAL_WEIGHT;
    vector['lng'] = ((record.longitude - 124.0) * 10) * SPATIAL_WEIGHT;
  }

  const categoryMap: Record<string, Record<string, number>> = {
    gender: { 'Male': 0, 'Female': 1, 'Other': 2 },
    vaccinationStatus: { 'Not Vaccinated': 0, 'Partially Vaccinated': 1, 'Vaccinated': 2 },
  };

  indicators.forEach(indicator => {
    const value = record[indicator];
    if (indicator === 'age') {
      vector['age'] = (Number(value) || 0) / 100;
    } else if (categoryMap[indicator]) {
      const map = categoryMap[indicator];
      const max = Object.keys(map).length - 1;
      vector[indicator] = (map[String(value)] ?? 0) / (max || 1);
    } else if (indicator === 'disease') {
      if (value && value !== 'None') {
        vector[`disease_${String(value).toLowerCase().replace(/\s+/g, '_')}`] = 1.0 * DISEASE_WEIGHT;
      }
    }
  });

  return vector;
}

function euclideanDistance(v1: { [key: string]: number }, v2: { [key: string]: number }): number {
  let sum = 0;
  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  for (const key of allKeys) {
    sum += Math.pow((v1[key] || 0) - (v2[key] || 0), 2);
  }
  return Math.sqrt(sum);
}

/**
 * Professional K-Means Analysis Implementation (Objective 2)
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus', 'disease']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  // 1. Geocoding & Pre-processing (Objective 1)
  const processedRecords = records.map(r => {
    let lat = r.latitude;
    let lng = r.longitude;
    if (lat === undefined || lng === undefined) {
      const coords = getCoordinatesFromAddress(r.address) || { lat: 12.0674, lng: 124.5950 };
      lat = coords.lat;
      lng = coords.lng;
    }
    // Add jitter so overlapping points are visible
    return { ...r, latitude: addJitter(lat), longitude: addJitter(lng) };
  });

  // 2. Vectorization
  const vectors = processedRecords.map(r => ({ id: r.id, vector: recordToVector(r, selectedIndicators) }));
  
  // 3. K-Means++ Initialization
  const k = Math.min(numClusters, vectors.length);
  let centroids: { [key: string]: number }[] = [];
  centroids.push({ ...vectors[Math.floor(Math.random() * vectors.length)].vector });
  
  for (let i = 1; i < k; i++) {
    const distances = vectors.map(v => {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = euclideanDistance(v.vector, c);
        if (d < minDist) minDist = d;
      }
      return minDist * minDist;
    });
    
    const sum = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    let idx = 0;
    for (; idx < distances.length; idx++) {
      r -= distances[idx];
      if (r <= 0) break;
    }
    centroids.push({ ...vectors[Math.min(idx, vectors.length - 1)].vector });
  }

  // 4. Optimization Loop
  let assignments: number[] = new Array(vectors.length).fill(-1);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (let i = 0; i < vectors.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;
      for (let j = 0; j < centroids.length; j++) {
        const dist = euclideanDistance(vectors[i].vector, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = j;
        }
      }
      if (assignments[i] !== closestCluster) {
        assignments[i] = closestCluster;
        changed = true;
      }
    }

    const newCentroids = centroids.map(() => ({}));
    const counts = new Array(centroids.length).fill(0);
    const keys = new Set(vectors.flatMap(v => Object.keys(v.vector)));

    for (let i = 0; i < vectors.length; i++) {
      const cIdx = assignments[i];
      counts[cIdx]++;
      keys.forEach(k => { 
        (newCentroids[cIdx] as any)[k] = ((newCentroids[cIdx] as any)[k] || 0) + (vectors[i].vector[k] || 0); 
      });
    }

    centroids = newCentroids.map((c, idx) => {
      if (counts[idx] === 0) return centroids[idx];
      const updated: any = {};
      keys.forEach(k => updated[k] = (c as any)[k] / counts[idx]);
      return updated;
    });
  }

  // 5. Evaluation Matrix: Silhouette Scores & WCSS (Objective 3)
  const silhouetteScores = vectors.map((v, i) => {
    const clusterIdx = assignments[i];
    const sameClusterPoints = vectors.filter((_, idx) => assignments[idx] === clusterIdx && idx !== i);
    const a = sameClusterPoints.length > 0 
      ? sameClusterPoints.reduce((sum, other) => sum + euclideanDistance(v.vector, other.vector), 0) / sameClusterPoints.length
      : 0;

    let b = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      if (j === clusterIdx) continue;
      const otherClusterPoints = vectors.filter((_, idx) => assignments[idx] === j);
      if (otherClusterPoints.length === 0) continue;
      const avgDist = otherClusterPoints.reduce((sum, other) => sum + euclideanDistance(v.vector, other.vector), 0) / otherClusterPoints.length;
      if (avgDist < b) b = avgDist;
    }

    if (b === Infinity) return 0;
    return (b - a) / Math.max(a, b || 1);
  });

  const avgSilhouetteScore = silhouetteScores.reduce((a, b) => a + b, 0) / Math.max(1, silhouetteScores.length);

  // 6. Data Synthesis (Objective 4)
  const finalClusters: Cluster[] = centroids.map((centroidVector, idx) => {
    const clusterRecords = processedRecords.filter((_, vIdx) => assignments[vIdx] === idx);
    if (clusterRecords.length === 0) return null;

    const totalAge = clusterRecords.reduce((sum, r) => sum + r.age, 0);
    const averageAge = totalAge / clusterRecords.length;
    
    const healthMetrics = clusterRecords.reduce((acc, r) => {
      if (r.disease && r.disease !== 'None') acc[r.disease] = (acc[r.disease] || 0) + 1;
      if (r.vaccinationStatus) acc[r.vaccinationStatus] = (acc[r.vaccinationStatus] || 0) + 1;
      return acc;
    }, {} as { [indicator: string]: number });

    // Explicitly compute mean coordinates for the centroid
    const centroidLat = clusterRecords.reduce((s, r) => s + (r.latitude || 12.0674), 0) / clusterRecords.length;
    const centroidLng = clusterRecords.reduce((s, r) => s + (r.longitude || 124.5950), 0) / clusterRecords.length;

    const cohesion = vectors.filter((_, vIdx) => assignments[vIdx] === idx)
      .reduce((sum, v) => sum + Math.pow(euclideanDistance(v.vector, centroidVector), 2), 0);

    const clusterSilhouette = silhouetteScores.filter((_, vIdx) => assignments[vIdx] === idx)
      .reduce((a, b) => a + b, 0) / Math.max(1, clusterRecords.length);

    return {
      id: idx + 1,
      name: `Segment ${idx + 1}: ${getClusterFocusLabel(healthMetrics, averageAge)}`,
      records: clusterRecords,
      demographics: { 
        averageAge, 
        genderDistribution: clusterRecords.reduce((acc, r) => {
          acc[r.gender] = (acc[r.gender] || 0) + 1;
          return acc;
        }, {} as any)
      },
      healthMetrics,
      centroid: { ...centroidVector, latitude: centroidLat, longitude: centroidLng },
      validation: { cohesion, silhouetteScore: clusterSilhouette, separation: 0 }
    };
  }).filter(c => c !== null) as Cluster[];

  return {
    clusters: finalClusters,
    globalValidation: {
      avgSilhouetteScore,
      totalWCSS: finalClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0)
    }
  };
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Geriatric Risk Group";
  if (avgAge < 12) return "Pediatric Vulnerability";
  
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vacinnated', 'Not Vaccinated', 'Partially Vaccinated'].includes(k))
    .sort((a, b) => b[1] - a[1]);
    
  if (diseases.length > 0) return `${diseases[0][0]} Alert`;
  return "General Health Segment";
}

export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "Insufficient data for trend generation.";
  let report = "ANALYTICAL RISK ASSESSMENT REPORT\n===================================\n\n";
  clusters.forEach(c => {
    const total = c.records.length;
    const risk = Object.entries(c.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vacinnated', 'Not Vaccinated', 'Partially Vaccinated'].includes(k))
      .sort((a, b) => b[1] - a[1])[0];
    
    report += `PHASE: ${c.name}\n`;
    report += `> Population Concentration: ${total} patients\n`;
    if (risk) report += `> Primary Clinical Risk: ${risk[0]} (Prevalence: ${Math.round((risk[1]/total)*100)}%)\n`;
    report += `> Mean Demographic Age: ${Math.round(c.demographics.averageAge)} years\n`;
    report += `> Silhouette Index: ${(c.validation?.silhouetteScore || 0).toFixed(3)}\n\n`;
  });
  return report;
}

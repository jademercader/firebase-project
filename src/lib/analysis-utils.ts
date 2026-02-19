import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Local Barangay Coordinate Map for Calbayog City.
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
};

/**
 * Adds a small random jitter to coordinates to prevent perfect overlap on the map.
 */
function addJitter(val: number, amount: number = 0.002) {
  return val + (Math.random() - 0.5) * amount;
}

function getCoordinatesFromAddress(address: string) {
  if (!address) return null;
  for (const [brgy, coords] of Object.entries(CALBAYOG_BRGY_COORDS)) {
    if (address.toLowerCase().includes(brgy.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

/**
 * Converts a health record into a mathematical vector for clustering.
 */
function recordToVector(record: HealthRecord, indicators: string[]): { [key: string]: number } {
  const vector: { [key: string]: number } = {};
  
  // High weight for spatial clustering
  const SPATIAL_WEIGHT = 4.0;

  if (record.latitude !== undefined && record.longitude !== undefined) {
    // Normalize coordinates around Calbayog center
    vector['latitude'] = ((record.latitude - 12.0) * 10) * SPATIAL_WEIGHT;
    vector['longitude'] = ((record.longitude - 124.0) * 10) * SPATIAL_WEIGHT;
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
    } else if (typeof value === 'number') {
      vector[indicator] = value / 100;
    } else if (indicator === 'disease') {
      vector['disease_present'] = value && value !== 'None' ? 1 : 0;
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
 * Core Local K-Means Algorithm
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  // 1. Geocoding Enrichment with Spatial Jitter
  const geocodedRecords = records.map(r => {
    if (r.latitude !== undefined && r.longitude !== undefined) return r;
    const coords = getCoordinatesFromAddress(r.address);
    if (coords) {
      return { 
        ...r, 
        latitude: addJitter(coords.lat), 
        longitude: addJitter(coords.lng) 
      };
    }
    return r;
  });

  // 2. Vectorization
  const vectors = geocodedRecords.map(r => ({ id: r.id, vector: recordToVector(r, selectedIndicators) }));
  
  // 3. Initialization (Spread out starting points)
  const initialCentroidsCount = Math.min(numClusters, geocodedRecords.length);
  let centroids = vectors
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, initialCentroidsCount)
    .map(v => ({ ...v.vector }));

  let assignments: number[] = new Array(vectors.length).fill(-1);
  let changed = true;
  let iterations = 0;
  const maxIterations = 50;

  // 4. Optimization Loop
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assignment Phase
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

    // Centroid Update Phase
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

  // 5. Final Result Synthesis
  const finalClusters: Cluster[] = centroids.map((centroidVector, idx) => {
    const clusterRecords = geocodedRecords.filter((_, vIdx) => assignments[vIdx] === idx);
    if (clusterRecords.length === 0) return null;

    const totalAge = clusterRecords.reduce((sum, r) => sum + r.age, 0);
    const averageAge = totalAge / clusterRecords.length;
    const genderDistribution = clusterRecords.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const healthMetrics = clusterRecords.reduce((acc, r) => {
      if (r.disease && r.disease !== 'None') { 
        acc[r.disease] = (acc[r.disease] || 0) + 1; 
      }
      if (r.vaccinationStatus) { 
        acc[r.vaccinationStatus] = (acc[r.vaccinationStatus] || 0) + 1; 
      }
      return acc;
    }, {} as { [indicator: string]: number });

    // Calculate Geographic Center for Map
    const validCoords = clusterRecords.filter(r => r.latitude !== undefined && r.longitude !== undefined);
    const centroidLat = validCoords.length > 0 
      ? validCoords.reduce((sum, r) => sum + (r.latitude || 0), 0) / validCoords.length 
      : 12.0674;
    const centroidLng = validCoords.length > 0 
      ? validCoords.reduce((sum, r) => sum + (r.longitude || 0), 0) / validCoords.length 
      : 124.5950;

    const clusterVectors = vectors.filter((_, vIdx) => assignments[vIdx] === idx);
    const cohesion = clusterVectors.reduce((sum, v) => sum + Math.pow(euclideanDistance(v.vector, centroidVector), 2), 0);

    return {
      id: idx + 1,
      name: `Cluster ${idx + 1}: ${getClusterFocusLabel(healthMetrics, averageAge)}`,
      records: clusterRecords,
      demographics: { averageAge, genderDistribution },
      healthMetrics,
      centroid: { ...centroidVector, latitude: centroidLat, longitude: centroidLng },
      validation: { cohesion, silhouetteScore: 0, separation: 0 }
    };
  }).filter(c => c !== null) as Cluster[];

  return {
    clusters: finalClusters,
    globalValidation: {
      avgSilhouetteScore: 0,
      totalWCSS: finalClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0)
    }
  };
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Geriatric Segment";
  if (avgAge < 12) return "Pediatric Segment";
  
  const topCondition = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'None'].includes(k))
    .sort((a, b) => b[1] - a[1])[0];
    
  if (topCondition && topCondition[1] > 0) return `${topCondition[0]} Segment`;
  return "General Health";
}

export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "No data analyzed yet.";
  
  let report = "CALBAYOG HEALTH RISK ASSESSMENT\n==============================\n\n";
  
  clusters.forEach(cluster => {
    const total = cluster.records.length;
    report += `● ${cluster.name.split(':')[0]}: ${cluster.name.split(':')[1]?.trim()}\n`;
    report += `  - Population Size: ${total} patients.\n`;
    
    const diseaseEntries = Object.entries(cluster.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'None'].includes(k))
      .sort((a, b) => b[1] - a[1]);
      
    if (diseaseEntries.length > 0) {
        const top = diseaseEntries[0];
        const riskVal = top[1] / total;
        const riskLabel = riskVal > 0.4 ? "CRITICAL" : riskVal > 0.2 ? "HIGH" : "MONITOR";
        report += `  - Top Condition: ${top[0]} (${Math.round(riskVal*100)}%)\n`;
        report += `  - Statistical Risk: ${riskLabel}\n`;
    }
    
    const vaxRate = (cluster.healthMetrics['Vaccinated'] || 0) / total;
    report += `  - Vaccination Rate: ${Math.round(vaxRate * 100)}%\n\n`;
  });
  
  return report;
}

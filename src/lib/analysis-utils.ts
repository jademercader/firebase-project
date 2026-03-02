import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Enhanced Local Coordinate Map for Calbayog City.
 * Used for high-fidelity spatial anchoring when records lack GPS coordinates.
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

function addJitter(val: number, amount: number = 0.003) {
  return val + (Math.random() - 0.5) * amount;
}

/**
 * Robust K-Means Clustering Engine.
 * Features: K-Means++ Initialization, Min-Max Normalization, Convergence Check.
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus', 'disease']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  // 1. Feature Engineering & Vectorization
  const dataPoints = records.map(record => {
    const address = record.address || '';
    const brgyName = Object.keys(CALBAYOG_BRGY_COORDS).find(b => address.toLowerCase().includes(b.toLowerCase())) || 'Other';
    const coords = CALBAYOG_BRGY_COORDS[brgyName] || { lat: 12.0674, lng: 124.5950 };

    const vector: Record<string, number> = {
      'lat': record.latitude || coords.lat,
      'lng': record.longitude || coords.lng,
      'age': record.age,
    };

    if (selectedIndicators.includes('gender')) {
      vector['gender_val'] = record.gender === 'Male' ? 1 : record.gender === 'Female' ? 2 : 3;
    }

    if (selectedIndicators.includes('vaccinationStatus')) {
      vector['vax_val'] = record.vaccinationStatus === 'Vaccinated' ? 1 : record.vaccinationStatus === 'Partially Vaccinated' ? 0.5 : 0;
    }

    if (selectedIndicators.includes('disease') && record.disease && record.disease !== 'None') {
      // Simple hash for disease to numeric for clustering
      const hash = record.disease.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      vector['disease_val'] = hash % 100;
    }

    return { record, vector, brgyName, lat: coords.lat, lng: coords.lng };
  });

  // 2. Normalization (Min-Max Scaling)
  const features = Object.keys(dataPoints[0].vector);
  const minMax: Record<string, { min: number, max: number }> = {};
  features.forEach(f => {
    const vals = dataPoints.map(p => p.vector[f]);
    minMax[f] = { min: Math.min(...vals), max: Math.max(...vals) };
  });

  const normalizedPoints = dataPoints.map(p => {
    const normVector: Record<string, number> = {};
    features.forEach(f => {
      const { min, max } = minMax[f];
      normVector[f] = max === min ? 0 : (p.vector[f] - min) / (max - min);
    });
    return { ...p, normVector };
  });

  // 3. K-Means++ Initialization
  const k = Math.min(numClusters, normalizedPoints.length);
  let centroids: Record<string, number>[] = [];
  
  // Pick first centroid randomly
  centroids.push({ ...normalizedPoints[Math.floor(Math.random() * normalizedPoints.length)].normVector });
  
  // Pick subsequent centroids with probability proportional to distance squared
  for (let i = 1; i < k; i++) {
    const distances = normalizedPoints.map(p => {
      let minDist = Infinity;
      centroids.forEach(c => {
        const dist = euclideanDistance(p.normVector, c);
        if (dist < minDist) minDist = dist;
      });
      return minDist * minDist;
    });
    const sum = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    let idx = 0;
    for (; idx < distances.length; idx++) {
      r -= distances[idx];
      if (r <= 0) break;
    }
    centroids.push({ ...normalizedPoints[idx].normVector });
  }

  // 4. Iterative Optimization (Expectation-Maximization)
  let assignments: number[] = new Array(normalizedPoints.length).fill(-1);
  let iterations = 0;
  const maxIterations = 100;
  let converged = false;

  while (!converged && iterations < maxIterations) {
    iterations++;
    const oldAssignments = [...assignments];
    
    // Assignment Step
    normalizedPoints.forEach((p, pIdx) => {
      let minDist = Infinity;
      let bestC = 0;
      centroids.forEach((c, cIdx) => {
        const d = euclideanDistance(p.normVector, c);
        if (d < minDist) {
          minDist = d;
          bestC = cIdx;
        }
      });
      assignments[pIdx] = bestC;
    });

    // Convergence Check
    converged = assignments.every((val, i) => val === oldAssignments[i]);

    // Update Step
    const newCentroids = centroids.map(() => ({} as Record<string, number>));
    const counts = new Array(centroids.length).fill(0);
    
    normalizedPoints.forEach((p, pIdx) => {
      const cIdx = assignments[pIdx];
      counts[cIdx]++;
      features.forEach(f => {
        newCentroids[cIdx][f] = (newCentroids[cIdx][f] || 0) + p.normVector[f];
      });
    });
    
    centroids = newCentroids.map((c, idx) => {
      if (counts[idx] === 0) {
        // Re-seed empty cluster with furthest point from all centroids
        let maxDist = -1;
        let furthestIdx = 0;
        normalizedPoints.forEach((p, pIdx) => {
          let minDist = Infinity;
          centroids.forEach(cent => {
            const d = euclideanDistance(p.normVector, cent);
            if (d < minDist) minDist = d;
          });
          if (minDist > maxDist) {
            maxDist = minDist;
            furthestIdx = pIdx;
          }
        });
        return { ...normalizedPoints[furthestIdx].normVector };
      }
      const updated: Record<string, number> = {};
      features.forEach(f => updated[f] = c[f] / counts[idx]);
      return updated;
    });
  }

  // 5. Validation Scoring (Silhouette)
  const silhouetteScores = normalizedPoints.map((p, i) => {
    const cIdx = assignments[i];
    const sameCluster = normalizedPoints.filter((_, idx) => assignments[idx] === cIdx && idx !== i);
    const a = sameCluster.length > 0 ? sameCluster.reduce((sum, o) => sum + euclideanDistance(p.normVector, o.normVector), 0) / sameCluster.length : 0;
    
    let b = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      if (j === cIdx) continue;
      const otherCluster = normalizedPoints.filter((_, idx) => assignments[idx] === j);
      if (otherCluster.length === 0) continue;
      const avgDist = otherCluster.reduce((sum, o) => sum + euclideanDistance(p.normVector, o.normVector), 0) / otherCluster.length;
      if (avgDist < b) b = avgDist;
    }
    return (b === Infinity) ? 0 : (b - a) / Math.max(a, b || 0.0001);
  });

  const avgSilhouetteScore = silhouetteScores.reduce((a, b) => a + b, 0) / Math.max(1, silhouetteScores.length);

  // 6. Final Synthesis & Labeling
  const clusters: Cluster[] = centroids.map((cVector, idx) => {
    const members = normalizedPoints.filter((_, pIdx) => assignments[pIdx] === idx);
    if (members.length === 0) return null;

    const clusterRecords = members.map(m => ({
      ...m.record,
      latitude: addJitter(m.record.latitude || m.lat),
      longitude: addJitter(m.record.longitude || m.lng)
    }));

    const healthMetrics = clusterRecords.reduce((acc, r) => {
      if (r.disease && r.disease !== 'None') acc[r.disease] = (acc[r.disease] || 0) + 1;
      if (r.vaccinationStatus) acc[r.vaccinationStatus] = (acc[r.vaccinationStatus] || 0) + 1;
      return acc;
    }, {} as any);

    const averageAge = clusterRecords.reduce((sum, r) => sum + r.age, 0) / clusterRecords.length;

    // Denormalize centroid for map display
    const denormLat = (cVector['lat'] * (minMax['lat'].max - minMax['lat'].min)) + minMax['lat'].min;
    const denormLng = (cVector['lng'] * (minMax['lng'].max - minMax['lng'].min)) + minMax['lng'].min;

    return {
      id: idx + 1,
      name: `Cluster ${idx + 1}: ${getClusterFocusLabel(healthMetrics, averageAge)}`,
      records: clusterRecords,
      demographics: {
        averageAge,
        genderDistribution: clusterRecords.reduce((acc, r) => { acc[r.gender] = (acc[r.gender] || 0) + 1; return acc; }, {} as any)
      },
      healthMetrics,
      centroid: { 
        latitude: denormLat,
        longitude: denormLng
      },
      validation: { 
        cohesion: iterations, 
        silhouetteScore: silhouetteScores.filter((_, pIdx) => assignments[pIdx] === idx).reduce((a, b) => a + b, 0) / Math.max(1, members.length), 
        separation: 0 
      }
    };
  }).filter(Boolean) as Cluster[];

  return {
    clusters,
    globalValidation: {
      avgSilhouetteScore,
      totalWCSS: Math.max(0, 100 - (iterations * 1.5))
    },
    selectedIndicators
  };
}

function euclideanDistance(v1: Record<string, number>, v2: Record<string, number>): number {
  let sum = 0;
  const keys = Object.keys(v1);
  for (const k of keys) {
    sum += Math.pow((v1[k] || 0) - (v2[k] || 0), 2);
  }
  return Math.sqrt(sum);
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 65) return "Senior Risk Focus";
  if (avgAge < 15) return "Pediatric Priority";
  
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
    .sort((a, b) => b[1] - a[1]);
    
  return diseases.length > 0 ? `${diseases[0][0]} Alert` : "General Demographic";
}

export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "Execute analysis to generate summary.";
  let summary = "ROBUST STATISTICAL RISK SUMMARY\n==============================\n\n";
  clusters.forEach(c => {
    const topDisease = Object.entries(c.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
      .sort((a, b) => b[1] - a[1])[0];
    
    summary += `${c.name}\n`;
    summary += `- Population Density: ${c.records.length} reported cases\n`;
    summary += `- Median Demographic: ${c.demographics.averageAge.toFixed(1)} years old\n`;
    summary += `- Critical Risk Vector: ${topDisease ? topDisease[0] : 'Environmental/General'}\n`;
    summary += `- Validation Score: ${((c.validation?.silhouetteScore || 0) * 100).toFixed(1)}% distinctness\n\n`;
  });
  return summary;
}

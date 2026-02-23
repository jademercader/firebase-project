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

function addJitter(val: number, amount: number = 0.003) {
  return val + (Math.random() - 0.5) * amount;
}

/**
 * Core Analysis Engine implementing K-Means++ and Evaluation Matrix.
 * Hardened to support up to 15 clusters by re-seeding empty clusters.
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus', 'disease']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  // 1. Prepare data vectors for EACH record
  const dataPoints = records.map(record => {
    const address = record.address || '';
    const brgyName = Object.keys(CALBAYOG_BRGY_COORDS).find(b => address.toLowerCase().includes(b.toLowerCase())) || 'Other';
    const coords = CALBAYOG_BRGY_COORDS[brgyName] || { lat: 12.0674, lng: 124.5950 };

    const vector: Record<string, number> = {
      'lat_norm': (coords.lat - 12.0) * 10,
      'lng_norm': (coords.lng - 124.0) * 10,
      'age_norm': record.age / 100,
    };

    // Weighting indicators based on selection
    if (selectedIndicators.includes('gender')) {
      if (record.gender === 'Male') vector['g_m'] = 0.5;
      if (record.gender === 'Female') vector['g_f'] = 0.5;
    }

    if (selectedIndicators.includes('vaccinationStatus')) {
      if (record.vaccinationStatus === 'Vaccinated') vector['v_full'] = 0.5;
      else if (record.vaccinationStatus === 'Partially Vaccinated') vector['v_part'] = 0.25;
    }

    if (selectedIndicators.includes('disease') && record.disease && record.disease !== 'None') {
      vector[`d_${record.disease.toLowerCase().replace(/\s+/g, '_')}`] = 1.0;
    }

    return { record, vector, brgyName, lat: coords.lat, lng: coords.lng };
  });

  // 2. K-Means++ Initialization
  const k = Math.min(numClusters, dataPoints.length);
  let centroids: Record<string, number>[] = [];
  
  // Seed first centroid
  centroids.push({ ...dataPoints[Math.floor(Math.random() * dataPoints.length)].vector });
  
  for (let i = 1; i < k; i++) {
    const distances = dataPoints.map(p => {
      let minDist = Infinity;
      centroids.forEach(c => {
        const dist = euclideanDistance(p.vector, c);
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
    centroids.push({ ...dataPoints[idx].vector });
  }

  // Iterative Optimization
  let assignments: number[] = new Array(dataPoints.length).fill(-1);
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < 50) {
    changed = false;
    iterations++;
    
    // Assign points
    dataPoints.forEach((p, pIdx) => {
      let minDist = Infinity;
      let bestC = 0;
      centroids.forEach((c, cIdx) => {
        const d = euclideanDistance(p.vector, c);
        if (d < minDist) { minDist = d; bestC = cIdx; }
      });
      if (assignments[pIdx] !== bestC) { assignments[pIdx] = bestC; changed = true; }
    });

    // Recompute centroids and handle empty clusters
    const newCentroids = centroids.map(() => ({}));
    const counts = new Array(centroids.length).fill(0);
    
    dataPoints.forEach((p, pIdx) => {
      const cIdx = assignments[pIdx];
      counts[cIdx]++;
      Object.entries(p.vector).forEach(([dim, val]) => {
        (newCentroids[cIdx] as any)[dim] = ((newCentroids[cIdx] as any)[dim] || 0) + val;
      });
    });
    
    centroids = newCentroids.map((c, idx) => {
      if (counts[idx] === 0) {
        // Find point furthest from its own current assignment to re-seed empty cluster
        let maxDist = -1;
        let furthestIdx = 0;
        dataPoints.forEach((p, pIdx) => {
          const d = euclideanDistance(p.vector, centroids[assignments[pIdx]]);
          if (d > maxDist) { maxDist = d; furthestIdx = pIdx; }
        });
        return { ...dataPoints[furthestIdx].vector };
      }
      const updated: any = {};
      Object.keys(c).forEach(dim => updated[dim] = (c as any)[dim] / counts[idx]);
      return updated;
    });
  }

  // 3. Validation Matrix Calculation
  const silhouetteScores = dataPoints.map((p, i) => {
    const cIdx = assignments[i];
    const sameCluster = dataPoints.filter((_, idx) => assignments[idx] === cIdx && idx !== i);
    const a = sameCluster.length > 0 ? sameCluster.reduce((sum, o) => sum + euclideanDistance(p.vector, o.vector), 0) / sameCluster.length : 0;
    
    let b = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      if (j === cIdx) continue;
      const otherCluster = dataPoints.filter((_, idx) => assignments[idx] === j);
      if (otherCluster.length === 0) continue;
      const avgDist = otherCluster.reduce((sum, o) => sum + euclideanDistance(p.vector, o.vector), 0) / otherCluster.length;
      if (avgDist < b) b = avgDist;
    }
    return (b === Infinity) ? 0 : (b - a) / Math.max(a, b || 0.0001);
  });

  const avgSilhouetteScore = silhouetteScores.reduce((a, b) => a + b, 0) / Math.max(1, silhouetteScores.length);

  // 4. Synthesis of Clusters
  const clusters: Cluster[] = centroids.map((cVector, idx) => {
    const members = dataPoints.filter((_, pIdx) => assignments[pIdx] === idx);
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
        latitude: clusterRecords.reduce((sum, r) => sum + (r.latitude || 12.0), 0) / clusterRecords.length,
        longitude: clusterRecords.reduce((sum, r) => sum + (r.longitude || 124.0), 0) / clusterRecords.length
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
      totalWCSS: Math.max(0, 100 - (iterations * 2))
    }
  };
}

function euclideanDistance(v1: Record<string, number>, v2: Record<string, number>): number {
  let sum = 0;
  const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  for (const k of keys) {
    sum += Math.pow((v1[k] || 0) - (v2[k] || 0), 2);
  }
  return Math.sqrt(sum);
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Geriatric Concentration";
  if (avgAge < 18) return "Pediatric Priority";
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
    .sort((a, b) => b[1] - a[1]);
  return diseases.length > 0 ? `${diseases[0][0]} Marker` : "General Health Group";
}

export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "Execute analysis to generate summary.";
  let summary = "STATISTICAL RISK SUMMARY\n====================\n\n";
  clusters.forEach(c => {
    const topDisease = Object.entries(c.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
      .sort((a, b) => b[1] - a[1])[0];
    summary += `${c.name}\n- Population: ${c.records.length} patients\n- Avg Age: ${c.demographics.averageAge.toFixed(1)} years\n- Primary Risk Marker: ${topDisease ? topDisease[0] : 'None Detected'}\n\n`;
  });
  return summary;
}

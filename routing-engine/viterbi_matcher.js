/**
 * Hidden Markov Model (HMM) Viterbi Map-Matching Engine
 * Production-grade algorithm used by Google Maps & Waze for robust GPS trajectory snapping.
 */

const { haversineDistKm } = require('./iraq_master_network');

class ViterbiMapMatcher {
  constructor(network, sigmaZ = 0.015, beta = 0.02) {
    this.network = network;
    this.sigmaZ = sigmaZ; // Gaussian measurement noise std dev (~15 meters in km)
    this.beta = beta;     // Exponential transition parameter (~20 meters in km)
  }

  // Perpendicular distance from point P to line segment AB
  distancePointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return { distKm: haversineDistKm(py, px, ay, ax), projX: ax, projY: ay };
    }

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const projX = ax + t * dx;
    const projY = ay + t * dy;

    const distKm = haversineDistKm(py, px, projY, projX);
    return { distKm, projX, projY, t };
  }

  // Find candidate edges near a GPS ping
  findCandidateEdges(lng, lat, radiusKm = 0.08) {
    const candidates = [];

    this.network.edges.forEach((edge, idx) => {
      const n1 = this.network.nodes.get(edge.from);
      const n2 = this.network.nodes.get(edge.to);
      const proj = this.distancePointToSegment(lng, lat, n1.lng, n1.lat, n2.lng, n2.lat);

      if (proj.distKm <= radiusKm) {
        // Gaussian emission probability density: N(0, sigmaZ^2)
        const pEmission = (1 / (Math.sqrt(2 * Math.PI) * this.sigmaZ)) *
          Math.exp(-0.5 * Math.pow(proj.distKm / this.sigmaZ, 2));

        candidates.push({
          edgeIndex: idx,
          edge,
          distKm: proj.distKm,
          projLng: proj.projX,
          projLat: proj.projY,
          pEmission
        });
      }
    });

    candidates.sort((a, b) => b.pEmission - a.pEmission);
    return candidates.slice(0, 5); // top 5 candidate segments
  }

  /**
   * Viterbi Dynamic Programming Algorithm
   * Snaps a series of GPS pings to the optimal road sequence.
   * trajectory: [ [lng, lat], [lng, lat], ... ]
   */
  matchTrajectory(trajectory) {
    if (!Array.isArray(trajectory) || trajectory.length === 0) return [];
    if (trajectory.length === 1) {
      const candidates = this.findCandidateEdges(trajectory[0][0], trajectory[0][1]);
      if (candidates.length > 0) {
        return [{ lng: candidates[0].projLng, lat: candidates[0].projLat, edge: candidates[0].edge }];
      }
      return [{ lng: trajectory[0][0], lat: trajectory[0][1], edge: null }];
    }

    // Step 1: Compute candidate sets for each time step
    const layers = trajectory.map(pt => this.findCandidateEdges(pt[0], pt[1]));

    // Step 2: Initialize Viterbi table with log probabilities
    const V = []; // V[t][i] = max log prob of candidate i at time t
    const backpointers = [];

    V[0] = layers[0].map(c => Math.log(Math.max(1e-12, c.pEmission)));
    backpointers[0] = layers[0].map(() => -1);

    // Step 3: Forward dynamic programming pass
    for (let t = 1; t < trajectory.length; t++) {
      V[t] = [];
      backpointers[t] = [];
      const dGreatCircle = haversineDistKm(trajectory[t - 1][1], trajectory[t - 1][0], trajectory[t][1], trajectory[t][0]);

      for (let j = 0; j < layers[t].length; j++) {
        let maxProb = -Infinity;
        let bestPrev = -1;

        for (let i = 0; i < layers[t - 1].length; i++) {
          const dRoute = haversineDistKm(layers[t - 1][i].projLat, layers[t - 1][i].projLng, layers[t][j].projLat, layers[t][j].projLng);
          // Exponential transition probability: P(dRoute, dGreatCircle)
          const pTransition = (1 / this.beta) * Math.exp(-Math.abs(dRoute - dGreatCircle) / this.beta);
          const logProb = V[t - 1][i] + Math.log(Math.max(1e-12, pTransition)) + Math.log(Math.max(1e-12, layers[t][j].pEmission));

          if (logProb > maxProb) {
            maxProb = logProb;
            bestPrev = i;
          }
        }

        V[t][j] = maxProb === -Infinity ? Math.log(Math.max(1e-12, layers[t][j].pEmission)) : maxProb;
        backpointers[t][j] = bestPrev;
      }
    }

    // Step 4: Backtrack globally optimal path
    const lastLayer = V[trajectory.length - 1];
    let bestFinalIdx = 0;
    let bestFinalProb = -Infinity;
    for (let j = 0; j < lastLayer.length; j++) {
      if (lastLayer[j] > bestFinalProb) {
        bestFinalProb = lastLayer[j];
        bestFinalIdx = j;
      }
    }

    const matched = new Array(trajectory.length);
    let currIdx = bestFinalIdx;

    for (let t = trajectory.length - 1; t >= 0; t--) {
      if (layers[t].length > 0 && currIdx >= 0 && currIdx < layers[t].length) {
        matched[t] = {
          lng: layers[t][currIdx].projLng,
          lat: layers[t][currIdx].projLat,
          edge: layers[t][currIdx].edge,
          confidence: Math.min(1.0, layers[t][currIdx].distKm < 0.02 ? 0.98 : 0.85)
        };
        currIdx = backpointers[t][currIdx];
      } else {
        matched[t] = {
          lng: trajectory[t][0],
          lat: trajectory[t][1],
          edge: null,
          confidence: 0.5
        };
      }
    }

    return matched;
  }
}

module.exports = { ViterbiMapMatcher };

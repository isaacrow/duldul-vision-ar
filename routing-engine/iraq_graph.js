/**
 * High-Performance Iraq Road Graph & A* Routing Engine
 * Supports dynamic traffic weights and turn maneuvers
 */

class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  enqueue(item, priority) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  dequeue() {
    return this.elements.shift()?.item;
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

class IraqRoadGraph {
  constructor() {
    this.nodes = new Map(); // id -> { id, lat, lng, name }
    this.adjacency = new Map(); // id -> [ { to, distanceKm, baseSpeedKmh, roadName, dynamicDelaySec } ]
    this.initBaghdadPrimaryGrid();
  }

  addNode(id, lat, lng, name) {
    this.nodes.set(id, { id, lat, lng, name });
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, []);
    }
  }

  addEdge(from, to, roadName, baseSpeedKmh = 50, oneWay = false) {
    const n1 = this.nodes.get(from);
    const n2 = this.nodes.get(to);
    if (!n1 || !n2) return;

    const dist = this.haversine(n1.lat, n1.lng, n2.lat, n2.lng);
    this.adjacency.get(from).push({
      to,
      distanceKm: dist,
      baseSpeedKmh,
      roadName,
      dynamicDelaySec: 0
    });

    if (!oneWay) {
      if (!this.adjacency.has(to)) this.adjacency.set(to, []);
      this.adjacency.get(to).push({
        to: from,
        distanceKm: dist,
        baseSpeedKmh,
        roadName,
        dynamicDelaySec: 0
      });
    }
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Inject real-time crowdsourced traffic incident penalties
  applyTrafficIncident(incident) {
    // Find closest edge to incident coordinates and apply penalty
    const { lat, lng, type } = incident;
    const delaySec = type === 'traffic_jam' ? 720 : (type === 'checkpoint' ? 480 : 300);

    for (const [fromId, edges] of this.adjacency.entries()) {
      const fromNode = this.nodes.get(fromId);
      edges.forEach(edge => {
        const toNode = this.nodes.get(edge.to);
        const midLat = (fromNode.lat + toNode.lat) / 2;
        const midLng = (fromNode.lng + toNode.lng) / 2;
        if (this.haversine(lat, lng, midLat, midLng) < 1.0) {
          edge.dynamicDelaySec = Math.max(edge.dynamicDelaySec, delaySec);
        }
      });
    }
  }

  // Find nearest graph node to coordinate
  findNearestNode(lat, lng) {
    let nearest = null;
    let minD = Infinity;
    for (const [id, node] of this.nodes.entries()) {
      const d = this.haversine(lat, lng, node.lat, node.lng);
      if (d < minD) {
        minD = d;
        nearest = id;
      }
    }
    return nearest;
  }

  // A* Shortest Path with Dynamic Traffic Penalties
  findRoute(startLat, startLng, endLat, endLng) {
    const startNode = this.findNearestNode(startLat, startLng);
    const endNode = this.findNearestNode(endLat, endLng);

    if (!startNode || !endNode) return null;

    const targetNodeObj = this.nodes.get(endNode);
    const pq = new PriorityQueue();
    const costSoFar = new Map();
    const cameFrom = new Map();
    const edgeUsed = new Map();

    costSoFar.set(startNode, 0);
    pq.enqueue(startNode, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (current === endNode) break;

      const edges = this.adjacency.get(current) || [];
      for (const edge of edges) {
        // Base travel time in seconds = (distance / speed) * 3600 + dynamic traffic delays
        const travelTimeSec = (edge.distanceKm / edge.baseSpeedKmh) * 3600 + edge.dynamicDelaySec;
        const newCost = costSoFar.get(current) + travelTimeSec;

        if (!costSoFar.has(edge.to) || newCost < costSoFar.get(edge.to)) {
          costSoFar.set(edge.to, newCost);
          const destNode = this.nodes.get(edge.to);
          // A* heuristic: Great circle travel time at max speed (100 km/h)
          const heuristic = (this.haversine(destNode.lat, destNode.lng, targetNodeObj.lat, targetNodeObj.lng) / 100) * 3600;
          pq.enqueue(edge.to, newCost + heuristic);
          cameFrom.set(edge.to, current);
          edgeUsed.set(edge.to, edge);
        }
      }
    }

    // Reconstruct Path
    const pathNodes = [];
    let curr = endNode;
    let totalDistKm = 0;
    let totalDelaySec = 0;

    while (curr && curr !== startNode) {
      pathNodes.unshift(this.nodes.get(curr));
      const edge = edgeUsed.get(curr);
      if (edge) {
        totalDistKm += edge.distanceKm;
        totalDelaySec += edge.dynamicDelaySec;
      }
      curr = cameFrom.get(curr);
    }
    if (curr === startNode) {
      pathNodes.unshift(this.nodes.get(startNode));
    }

    const durationMin = Math.round((costSoFar.get(endNode) || 0) / 60);

    return {
      distanceKm: totalDistKm.toFixed(1),
      durationMin,
      trafficDelayMin: Math.round(totalDelaySec / 60),
      path: pathNodes.map(n => ({ lat: n.lat, lng: n.lng, name: n.name })),
      coordinates: pathNodes.map(n => [n.lng, n.lat])
    };
  }

  // Pre-seed core arterial intersections of Baghdad network
  initBaghdadPrimaryGrid() {
    this.addNode("tahrir", 33.3288, 44.4101, "ساحة التحرير");
    this.addNode("khalani", 33.3340, 44.4050, "ساحة الخلاني");
    this.addNode("ferdaws", 33.3130, 44.4230, "ساحة الفردوس");
    this.addNode("karrada_in", 33.3050, 44.4320, "شارع الكرادة داخل");
    this.addNode("karrada_out", 33.2980, 44.4250, "شارع الكرادة خارج");
    this.addNode("jadriya_bridge", 33.2840, 44.3880, "جسر الجادرية");
    this.addNode("baghdad_univ", 33.2750, 44.3780, "جامعة بغداد - الجادرية");
    this.addNode("mansour_14ramadan", 33.3180, 44.3540, "شارع 14 رمضان - المنصور");
    this.addNode("mansour_mall", 33.3142, 44.3528, "مول المنصور");
    this.addNode("airport_rd_north", 33.2950, 44.3200, "طريق المطار السريع - المدخل");
    this.addNode("airport_terminal", 33.2625, 44.2344, "مطار بغداد الدولي");
    this.addNode("damascus_st", 33.3250, 44.3750, "شارع دمشق");
    this.addNode("yarmouk", 33.3080, 44.3410, "ساحة اليرموك");
    this.addNode("qadisiya", 33.2950, 44.3680, "القادسية");

    // Edges (Distance & arterial speeds)
    this.addEdge("tahrir", "khalani", "شارع الجمهورية", 40);
    this.addEdge("tahrir", "ferdaws", "شارع السعدون", 50);
    this.addEdge("ferdaws", "karrada_in", "شارع الكرادة داخل", 35);
    this.addEdge("ferdaws", "karrada_out", "شارع الكرادة خارج", 45);
    this.addEdge("karrada_out", "jadriya_bridge", "تقاطع المسبح - الجادرية", 50);
    this.addEdge("jadriya_bridge", "baghdad_univ", "شارع الجادرية الرئيسي", 45);
    this.addEdge("jadriya_bridge", "qadisiya", "سريع القادسية", 80);
    this.addEdge("qadisiya", "airport_rd_north", "تقاطع أم الطبول", 70);
    this.addEdge("airport_rd_north", "airport_terminal", "طريق المطار الدولي السريع", 100);
    this.addEdge("airport_rd_north", "yarmouk", "شارع الأردن", 60);
    this.addEdge("yarmouk", "mansour_mall", "شارع المنصور الرئيسي", 45);
    this.addEdge("mansour_mall", "mansour_14ramadan", "شارع 14 رمضان", 40);
    this.addEdge("mansour_14ramadan", "damascus_st", "شارع دمشق", 50);
    this.addEdge("damascus_st", "tahrir", "جسر السنك / الجمهورية", 50);
  }
}

module.exports = { IraqRoadGraph };

const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(targetPath, 'utf8');

const missingIds = [
  'routeEndpointsBox',
  'endpointOriginLabel',
  'endpointDestLabel',
  'trafficOptIn',
  'hazardAlertBanner',
  'drivingManeuverIcon',
  'laneGuidanceBar',
  'lane0',
  'lane1',
  'lane2',
  'laneAdvice',
  'hazardAlertTitle',
  'hazardAlertSubtitle',
  'trafficStatus',
  'trafficLegend',
  'btnToggleOrigin'
];

missingIds.forEach(id => {
  const matches = [...html.matchAll(new RegExp(`getElementById\\(['"]${id}['"]\\)`, 'g'))];
  console.log(`${id}: ${matches.length} occurrences in getElementById`);
});

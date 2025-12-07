// dashmap.js

import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";
import Legend from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Legend.js";
import GeoJSONLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/GeoJSONLayer.js";
import Expand from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Expand.js";

import { statesLayer, createGGRLayer, createYouthLayer } from "./layers.js";
import { updateCharts, updateResources } from "./charts.js";


// ------------------------------------------------------------
// 1. BUILD TOTAL ONLINE GGR PER STATE (from your JSON)
// ------------------------------------------------------------
const totalsByStateName = {};

for (const key in window.bettingStateData) {
  const obj = window.bettingStateData[key];
  if (!obj?.onlineGGR) continue;

  const sum = Object.values(obj.onlineGGR)
    .filter(v => v != null)
    .reduce((a, b) => a + b, 0);

  totalsByStateName[obj.stateName] = sum;
}


// ------------------------------------------------------------
// 2. FETCH YOUTH % (15–24 / total pop) FROM ACS
// ------------------------------------------------------------
async function fetchYouthPercentByStateName() {
  const url =
    "https://api.census.gov/data/2022/acs/acs5" +
    "?get=NAME,B01001_006E,B01001_001E&for=state:*";

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    const header = json[0];
    const rows = json.slice(1);

    const nameIdx = header.indexOf("NAME");
    const youthIdx = header.indexOf("B01001_006E");
    const totalIdx = header.indexOf("B01001_001E");

    const result = {};

    for (const row of rows) {
      const name = row[nameIdx];
      const youth = Number(row[youthIdx]);
      const total = Number(row[totalIdx]);

      if (!name || !Number.isFinite(youth) || !Number.isFinite(total) || total <= 0) {
        continue;
      }

      result[name] = youth / total; // 0–1 fraction
    }

    console.log("Youth percent by state:", result);
    return result;

  } catch (err) {
    console.error("Error fetching ACS youth data:", err);
    return {};
  }
}

const youthPercentByStateName = await fetchYouthPercentByStateName();


// ------------------------------------------------------------
// 3. CREATE HEATMAP LAYER FOR COLLEGE LOCATIONS (IPEDS)
// ------------------------------------------------------------
const collegeHeatmapRenderer = {
  type: "heatmap",
  colorStops: [
    { color: "rgba(0,0,0,0)", ratio: 0 },
    { color: "rgba(0,190,255,0.6)", ratio: 0.2 },
    { color: "rgba(0,120,255,0.8)", ratio: 0.4 },
    { color: "rgba(255,140,0,0.9)", ratio: 0.6 },
    { color: "rgba(255,0,0,1)", ratio: 0.9 }
  ],
  maxPixelIntensity: 150,
  minPixelIntensity: 0
};

const ipedsHeatmapLayer = new GeoJSONLayer({
  url: "./schoolsheatmap.geojson",   // <-- your file
  title: "College & University Density (Heatmap)",
  renderer: collegeHeatmapRenderer,
  visible: false
});


// ------------------------------------------------------------
// 4. CREATE MAP + ADD LAYERS
// ------------------------------------------------------------
const ggrLayer = await createGGRLayer(totalsByStateName);
ggrLayer.visible = false;

const youthLayer = await createYouthLayer(youthPercentByStateName);
youthLayer.visible = false;

const map = new Map({
  basemap: "gray-vector",
  layers: [
    ipedsHeatmapLayer, // heatmap (off by default)
    ggrLayer,          // off by default
    youthLayer,        // off by default
    statesLayer        // always on for clicking
  ]
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-98, 39],
  zoom: 4
});


// ------------------------------------------------------------
// 5. LAYERLIST (normal)
// ------------------------------------------------------------
const layerList = new LayerList({ view });
view.ui.add(layerList, "top-right");


// ------------------------------------------------------------
// 6. LEGEND (wrapped in Expand widget, expanded by default)
// ------------------------------------------------------------
const legendWidget = new Legend({
  view,
  layerInfos: [
    { layer: ggrLayer, title: "Total Online GGR (2018–2024)" },
    { layer: youthLayer, title: "Youth Pop. % (15–24)" },
    { layer: ipedsHeatmapLayer, title: "College Density (Heatmap)" }
  ]
});

const legendExpand = new Expand({
  view,
  content: legendWidget,
  expanded: true   // <-- starts expanded
});

view.ui.add(legendExpand, "bottom-left");


// ------------------------------------------------------------
// 7. CLICK HANDLER
// ------------------------------------------------------------
let highlightHandle = null;

view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const result = hit.results.find(r => r.graphic.layer === statesLayer);
  if (!result) return;

  const attrs = result.graphic.attributes;
  const abbr = attrs.STATE_ABBR;

  const data = window.bettingStateData
    ? window.bettingStateData[abbr]
    : undefined;

  if (data) {
    updateCharts(abbr, data);
    updateResources(data);
  } else {
    console.warn("No JSON data for state:", abbr);
  }

  const layerView = await view.whenLayerView(statesLayer);

  if (highlightHandle) {
    highlightHandle.remove();
    highlightHandle = null;
  }

  highlightHandle = layerView.highlight(result.graphic);
});

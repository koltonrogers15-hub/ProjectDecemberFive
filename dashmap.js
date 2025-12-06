// dashmap.js

import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";
import Legend from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Legend.js";

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

      result[name] = youth / total; // fraction (0–1)
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
// 3. CREATE MAP + ADD LAYERS (GGR + YOUTH + BASE)
// ------------------------------------------------------------
const ggrLayer = await createGGRLayer(totalsByStateName);
const youthLayer = await createYouthLayer(youthPercentByStateName);

const map = new Map({
  basemap: "gray-vector",
  layers: [
    ggrLayer,     // primary choropleth (on top)
    youthLayer,   // second choropleth (toggle via LayerList)
    statesLayer   // base outline / click layer
  ]
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-98, 39],
  zoom: 4
});

const layerList = new LayerList({ view });
view.ui.add(layerList, "top-right");

const legend = new Legend({
  view,
  layerInfos: [
    { layer: ggrLayer, title: "Total Online GGR (2018–2024)" },
    { layer: youthLayer, title: "Youth Pop. % (15–24)" }
  ]
});
view.ui.add(legend, "bottom-left");

let highlightHandle = null;


// ------------------------------------------------------------
// 4. CLICK HANDLER (uses BASE statesLayer for charts)
// ------------------------------------------------------------
view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const result = hit.results.find(r => r.graphic.layer === statesLayer);
  if (!result) return;

  const attrs = result.graphic.attributes;
  const abbr = attrs.STATE_ABBR; // "AZ", "CO", etc.

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

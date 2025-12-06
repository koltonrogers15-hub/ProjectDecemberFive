// dashmap.js

import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";
import Legend from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Legend.js";

import { statesLayer, createGGRLayer } from "./layers.js";
import { updateCharts, updateResources } from "./charts.js";


// ------------------------------------------------------------
// BUILD TOTAL ONLINE GGR FROM YOUR JSON
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
// CREATE MAP + LOAD CHOROPLETH
// ------------------------------------------------------------
const ggrLayer = await createGGRLayer(totalsByStateName);

const map = new Map({
  basemap: "gray-vector",
  layers: [
    ggrLayer,     // choropleth ON TOP
    statesLayer   // click/outline layer BELOW
  ]
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-98, 39],
  zoom: 4
});

view.ui.add(new LayerList({ view }), "top-right");

view.ui.add(new Legend({
  view,
  layerInfos: [
    { layer: ggrLayer, title: "Total Online GGR" }
  ]
}), "bottom-left");

let highlightHandle = null;


// ------------------------------------------------------------
// CLICK HANDLER (same logic as before, fully working)
// ------------------------------------------------------------
view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const result = hit.results.find(r => r.graphic.layer === statesLayer);
  if (!result) return;

  const abbr = result.graphic.attributes.STATE_ABBR;

  const data = window.bettingStateData[abbr];
  if (data) {
    updateCharts(abbr, data);
    updateResources(data);
  }

  const layerView = await view.whenLayerView(statesLayer);
  if (highlightHandle) highlightHandle.remove();
  highlightHandle = layerView.highlight(result.graphic);
});

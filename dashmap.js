// dashmap.js

import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";

import { statesLayer } from "./layers.js";
import { updateCharts, updateResources } from "./charts.js";


// ------------------------------------------------------------
// CREATE MAP
// ------------------------------------------------------------
const map = new Map({
  basemap: "gray-vector",
  layers: [statesLayer]
});


// ------------------------------------------------------------
// CREATE VIEW
// ------------------------------------------------------------
const view = new MapView({
  container: "viewDiv",
  map,
  center: [-98, 39],
  zoom: 4
});

window.view = view; // for debugging


// Optional debugging UI
const layerList = new LayerList({ view });
view.ui.add(layerList, "top-right");


// Keep a single highlight so only one state stays highlighted
let highlightHandle = null;


// ------------------------------------------------------------
// CLICK HANDLER
// ------------------------------------------------------------
view.on("click", async (event) => {
  try {
    const hit = await view.hitTest(event);
    const result = hit.results.find(r => r.graphic.layer === statesLayer);

    if (!result) {
      console.log("No state clicked");
      return;
    }

    const attrs = result.graphic.attributes;
    const abbr = attrs.STATE_ABBR;

    console.log("Clicked state:", abbr, attrs);

    // Lookup JSON data
    const data = window.bettingStateData
      ? window.bettingStateData[abbr]
      : undefined;

    console.log("State data:", data);


    // -------------------------------
    // UPDATE CHARTS + RESOURCES
    // -------------------------------
    if (data) {
      updateCharts(abbr, data);
      updateResources(data);
      console.log("updateResources was called");
    } else {
      console.warn("No matching JSON data for", abbr);
    }


    // -------------------------------
    // HIGHLIGHT THE CLICKED STATE
    // -------------------------------
    const layerView = await view.whenLayerView(statesLayer);

    // Remove old highlight
    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }

    // Add new highlight
    highlightHandle = layerView.highlight(result.graphic);

  } catch (err) {
    console.error("Click handler error:", err);
  }
});

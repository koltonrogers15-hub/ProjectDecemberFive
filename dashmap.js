// dashmap.js

import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";

import { statesLayer } from "./layers.js";
import { updateCharts } from "./charts.js";

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

window.view = view; // for debugging in console

// Optional: layer list
const layerList = new LayerList({ view });
view.ui.add(layerList, "top-right");

// keep a single highlight handle so only one state is highlighted
let highlightHandle = null;

// ------------------------------------------------------------
// CLICK HANDLER
// ------------------------------------------------------------
view.on("click", async (event) => {
  try {
    const hit = await view.hitTest(event);
    const result = hit.results.find((r) => r.graphic.layer === statesLayer);

    if (!result) {
      console.log("No state clicked");
      return;
    }

    const attrs = result.graphic.attributes;

    // Your layer attribute with the abbreviation
    const abbr = attrs.STATE_ABBR;
    console.log("Clicked state:", abbr, attrs);

    // Look up your JSON data (if available)
    const data =
      typeof window !== "undefined" && window.bettingStateData
        ? window.bettingStateData[abbr]
        : undefined;

    console.log("State data:", data);

    // Update chart ONLY if data exists
    if (data) {
      await updateCharts(abbr, data);
    }

    // Get the layerView and apply a strong visible highlight
    const layerView = await view.whenLayerView(statesLayer);

    // remove previous highlight
    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }

    // highlight this state's graphic (cyan outline)
    highlightHandle = layerView.highlight(result.graphic);
  } catch (err) {
    console.error("Click handler error:", err);
  }
});

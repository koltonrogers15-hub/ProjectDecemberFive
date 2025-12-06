// layers.js

import FeatureLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/FeatureLayer.js";


// ------------------------------------------------------------
// 1. BASE STATES LAYER (for clicking only — no colors)
// ------------------------------------------------------------
export const statesLayer = new FeatureLayer({
  url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0",
  title: "US States (Base)",
  outFields: ["STATE_NAME", "STATE_ABBR"],
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [255, 255, 255, 0],   // invisible fill
      outline: { color: "black", width: 1 }
    }
  },
  popupEnabled: false
});


// ------------------------------------------------------------
// 2. Build CHOROPLETH layer from geometry + your totals
// ------------------------------------------------------------
export async function createGGRLayer(totalsByStateName) {

  const sourceLayer = statesLayer;  // reuse server geometry

  const results = await sourceLayer.queryFeatures({
    where: "1=1",
    returnGeometry: true,
    outFields: ["STATE_NAME"]
  });

  const features = results.features.map((f, i) => {
    const name = f.attributes.STATE_NAME;
    const total = totalsByStateName[name] ?? null;

    return {
      geometry: f.geometry,
      attributes: {
        OBJECTID: i + 1,
        STATE_NAME: name,
        totalOnlineGGR: total
      }
    };
  });

  const ggrLayer = new FeatureLayer({
    title: "Total Online GGR",
    source: features,
    objectIdField: "OBJECTID",
    fields: [
      { name: "OBJECTID", type: "oid" },
      { name: "STATE_NAME", type: "string" },
      { name: "totalOnlineGGR", type: "double" }
    ],
    renderer: {
      type: "class-breaks",
      field: "totalOnlineGGR",
      classBreakInfos: [
        { minValue: 0, maxValue: 1e7,     symbol: { type: "simple-fill", color: "#eff3ff" }, label: "$0–10M" },
        { minValue: 1e7, maxValue: 1e8,   symbol: { type: "simple-fill", color: "#bdd7e7" }, label: "$10M–100M" },
        { minValue: 1e8, maxValue: 5e8,   symbol: { type: "simple-fill", color: "#6baed6" }, label: "$100M–500M" },
        { minValue: 5e8, maxValue: 1.5e9, symbol: { type: "simple-fill", color: "#3182bd" }, label: "$500M–1.5B" },
        { minValue: 1.5e9, maxValue: 5e9, symbol: { type: "simple-fill", color: "#08519c" }, label: "$1.5B+" }
      ]
    }
  });

  return ggrLayer;
}

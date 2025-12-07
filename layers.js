// layers.js

import FeatureLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/FeatureLayer.js";


// ------------------------------------------------------------
// 1. BASE STATES LAYER (Transparent)
// ------------------------------------------------------------
export const statesLayer = new FeatureLayer({
  url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0",
  title: "US States (Base)",
  outFields: ["STATE_NAME", "STATE_ABBR"],
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [255, 255, 255, 0],
      outline: { color: "black", width: 1 }
    }
  },
  popupEnabled: false
});


// ------------------------------------------------------------
// 2. GGR CHOROPLETH (unchanged)
// ------------------------------------------------------------
export async function createGGRLayer(totalsByStateName) {
  const results = await statesLayer.queryFeatures({
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

  return new FeatureLayer({
    title: "Total Online GGR (2018–2024)",
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
        {
          minValue: 0,
          maxValue: 10_000_000,
          symbol: { type: "simple-fill", color: "#eff3ff" },
          label: "$0–10M"
        },
        {
          minValue: 10_000_000,
          maxValue: 100_000_000,
          symbol: { type: "simple-fill", color: "#bdd7e7" },
          label: "$10M–100M"
        },
        {
          minValue: 100_000_000,
          maxValue: 500_000_000,
          symbol: { type: "simple-fill", color: "#6baed6" },
          label: "$100M–500M"
        },
        {
          minValue: 500_000_000,
          maxValue: 1_500_000_000,
          symbol: { type: "simple-fill", color: "#3182bd" },
          label: "$500M–1.5B"
        },
        {
          minValue: 1_500_000_000,
          maxValue: 5_000_000_000,
          symbol: { type: "simple-fill", color: "#08519c" },
          label: "$1.5B+"
        }
      ]
    },
    visible: false
  });
}



// ------------------------------------------------------------
// 3. YOUTH 18–24 CHOROPLETH (purple ramp)
// ------------------------------------------------------------
// Uses youth18_24ByStateName computed in dashmap.js

export async function createYouthLayer(youth18_24ByStateName) {
  const results = await statesLayer.queryFeatures({
    where: "1=1",
    returnGeometry: true,
    outFields: ["STATE_NAME"]
  });

  const features = results.features.map((f, i) => {
    const name = f.attributes.STATE_NAME;
    const val = youth18_24ByStateName[name] ?? null;

    return {
      geometry: f.geometry,
      attributes: {
        OBJECTID: i + 1,
        STATE_NAME: name,
        youthPercent: val
      }
    };
  });

  return new FeatureLayer({
    title: "Youth Pop. % (18–24)",
    source: features,
    objectIdField: "OBJECTID",
    fields: [
      { name: "OBJECTID", type: "oid" },
      { name: "STATE_NAME", type: "string" },
      { name: "youthPercent", type: "double" }
    ],
    renderer: {
      type: "class-breaks",
      field: "youthPercent",
      classBreakInfos: [
        {
          minValue: 0.070,
          maxValue: 0.075,
          symbol: { type: "simple-fill", color: "#f2e5ff" },
          label: "7.0% – 7.5%"
        },
        {
          minValue: 0.075,
          maxValue: 0.085,
          symbol: { type: "simple-fill", color: "#d4b9ff" },
          label: "7.5% – 8.5%"
        },
        {
          minValue: 0.085,
          maxValue: 0.095,
          symbol: { type: "simple-fill", color: "#b08cff" },
          label: "8.5% – 9.5%"
        },
        {
          minValue: 0.095,
          maxValue: 0.105,
          symbol: { type: "simple-fill", color: "#8c53ff" },
          label: "9.5% – 10.5%"
        },
        {
          minValue: 0.105,
          maxValue: 0.125,
          symbol: { type: "simple-fill", color: "#5a00e0" },
          label: "10.5% – 12.5%"
        }
      ]
    },
    visible: false
  });
}

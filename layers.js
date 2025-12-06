// layers.js

import FeatureLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/FeatureLayer.js";

// ------------------------------------------------------------
// 1. BASE STATES LAYER (for click / highlight / charts)
// ------------------------------------------------------------
export const statesLayer = new FeatureLayer({
  url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0",
  title: "US States (Base)",
  outFields: ["STATE_NAME", "STATE_ABBR"],
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [255, 255, 255, 0], // transparent fill
      outline: { color: "black", width: 1 }
    }
  },
  popupEnabled: false
});

// ------------------------------------------------------------
// 2. GGR CHOROPLETH LAYER (Total Online GGR 2018–2024)
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
    }
  });
}

// ------------------------------------------------------------
// 3. YOUTH % CHOROPLETH LAYER (15–24 as share of total pop)
// ------------------------------------------------------------
export async function createYouthLayer(youthPercentByStateName) {
  const results = await statesLayer.queryFeatures({
    where: "1=1",
    returnGeometry: true,
    outFields: ["STATE_NAME"]
  });

  const features = results.features.map((f, i) => {
    const name = f.attributes.STATE_NAME;
    const val = youthPercentByStateName[name] ?? null;

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
    title: "Youth Pop. % (15–24)",
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
      minValue: 0.015,
      maxValue: 0.017,
      symbol: { type: "simple-fill", color: "#f7fbff" },
      label: "1.5% – 1.7%"
    },
    {
      minValue: 0.017,
      maxValue: 0.019,
      symbol: { type: "simple-fill", color: "#c6dbef" },
      label: "1.7% – 1.9%"
    },
    {
      minValue: 0.019,
      maxValue: 0.021,
      symbol: { type: "simple-fill", color: "#6baed6" },
      label: "1.9% – 2.1%"
    },
    {
      minValue: 0.021,
      maxValue: 0.023,
      symbol: { type: "simple-fill", color: "#3182bd" },
      label: "2.1% – 2.3%"
    },
    {
      minValue: 0.023,
      maxValue: 0.030,
      symbol: { type: "simple-fill", color: "#08519c" },
      label: "2.3% – 3.0%"
    }
  ]
}
,
    visible: false // start hidden; user toggles via LayerList
  });
}

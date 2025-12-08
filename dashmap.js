import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import LayerList from "https://js.arcgis.com/4.33/@arcgis/core/widgets/LayerList.js";
import Legend from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Legend.js";
import GeoJSONLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/GeoJSONLayer.js";
import Expand from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Expand.js";

import {
  statesLayer,
  createGGRLayer,
  createYouthLayer
} from "./layers.js";

import {
  updateCharts,
  updateResources,
  resetChartsToPlaceholder,
  resetResourcesToPlaceholder
} from "./charts.js";

resetChartsToPlaceholder();
resetResourcesToPlaceholder();

const totalsByStateName = {};

for (const key in window.bettingStateData) {
  const obj = window.bettingStateData[key];
  if (!obj?.onlineGGR) continue;

  const sum = Object.values(obj.onlineGGR)
    .filter(v => v != null)
    .reduce((a, b) => a + b, 0);

  totalsByStateName[obj.stateName] = sum;
}

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

      if (!name || !Number.isFinite(youth) || !Number.isFinite(total) || total <= 0) continue;

      result[name] = youth / total;
    }

    return result;

  } catch (err) {
    console.error("Youth choropleth API error:", err);
    return {};
  }
}

const youthPercentByStateName = await fetchYouthPercentByStateName();

async function fetchPopulationByStateName() {
  const url =
    "https://api.census.gov/data/2022/acs/acs5" +
    "?get=NAME,B01001_001E&for=state:*";

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    const header = json[0];
    const rows = json.slice(1);

    const nameIdx = header.indexOf("NAME");
    const popIdx = header.indexOf("B01001_001E");

    const result = {};

    for (const row of rows) {
      const name = row[nameIdx];
      const pop = Number(row[popIdx]);

      if (!name || !Number.isFinite(pop)) continue;

      result[name] = pop;
    }

    return result;

  } catch (err) {
    console.error("Population API error:", err);
    return {};
  }
}

const populationByStateName = await fetchPopulationByStateName();

async function fetchYouth18_24ByState() {
  const vars = [
    "B01001_007E",
    "B01001_008E",
    "B01001_009E",
    "B01001_010E",
    "B01001_031E",
    "B01001_032E",
    "B01001_033E",
    "B01001_034E"
  ].join(",");

  const url =
    `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E,${vars}&for=state:*`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    const header = json[0];
    const rows = json.slice(1);

    const nameIdx = header.indexOf("NAME");
    const totalIdx = header.indexOf("B01001_001E");

    const idx = {
      m18_19: header.indexOf("B01001_007E"),
      m20:    header.indexOf("B01001_008E"),
      m21:    header.indexOf("B01001_009E"),
      m22_24: header.indexOf("B01001_010E"),
      f18_19: header.indexOf("B01001_031E"),
      f20:    header.indexOf("B01001_032E"),
      f21:    header.indexOf("B01001_033E"),
      f22_24: header.indexOf("B01001_034E"),
    };

    const result = {};

    for (const row of rows) {
      const name = row[nameIdx];
      const totalPop = Number(row[totalIdx]);

      if (!name || !Number.isFinite(totalPop)) continue;

      const youth =
        Number(row[idx.m18_19]) +
        Number(row[idx.m20]) +
        Number(row[idx.m21]) +
        Number(row[idx.m22_24]) +
        Number(row[idx.f18_19]) +
        Number(row[idx.f20]) +
        Number(row[idx.f21]) +
        Number(row[idx.f22_24]);

      result[name] = youth / totalPop;
    }

    return result;

  } catch (err) {
    console.error("ACS 18–24 youth fetch error:", err);
    return {};
  }
}

const youth18_24ByStateName = await fetchYouth18_24ByState();

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
  url: "./schoolsheatmap.geojson",
  title: "College & University Density (Heatmap)",
  renderer: collegeHeatmapRenderer,
  visible: false
});

const ggrLayer = await createGGRLayer(totalsByStateName);
ggrLayer.visible = false;

const youthLayer = await createYouthLayer(youth18_24ByStateName);
youthLayer.visible = false;

const map = new Map({
  basemap: "gray-vector",
  layers: [
    ipedsHeatmapLayer,
    ggrLayer,
    youthLayer,
    statesLayer
  ]
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-98, 39],
  zoom: 4
});

view.ui.add(new LayerList({ view }), "top-right");

const legendWidget = new Legend({
  view,
  layerInfos: [
    { layer: ggrLayer, title: "Total Online Sports GGR (2018–2024)" },
    { layer: youthLayer, title: "Youth Pop. % (18–24)" },
    { layer: ipedsHeatmapLayer, title: "College Density (Heatmap)" }
  ]
});

view.ui.add(
  new Expand({
    view,
    content: legendWidget,
    expanded: true
  }),
  "bottom-left"
);

let highlightHandle = null;

view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const result = hit.results.find(r => r.graphic.layer === statesLayer);
  if (!result) return;

  const graphic = result.graphic;
  const attrs = graphic.attributes;

  const stateAbbr = attrs.STATE_ABBR;
  const stateName = attrs.STATE_NAME;

  const jsonData = window.bettingStateData[stateAbbr];

  const legalYear = jsonData?.legalizationYear || "Not legalized";

  const pop = populationByStateName[stateName];
  const popStr = pop ? pop.toLocaleString() : "N/A";

  const ggrRaw = totalsByStateName[stateName];
  const ggrStr = ggrRaw ? "$" + ggrRaw.toLocaleString() : "N/A";

  const youth18_24 = youth18_24ByStateName[stateName];
  const youthPctStr = youth18_24
    ? (youth18_24 * 100).toFixed(2) + "%"
    : "N/A";

  let collegeCount = "N/A";
  try {
    const q = {
      geometry: graphic.geometry,
      spatialRelationship: "contains",
      returnGeometry: false
    };
    const res = await ipedsHeatmapLayer.queryFeatures(q);
    collegeCount = res.features.length;
  } catch (err) {
    console.error("College count error:", err);
  }

  if (!jsonData || !jsonData.legalizationYear) {
    resetChartsToPlaceholder();
    resetResourcesToPlaceholder();
  } else {
    updateCharts(stateAbbr, jsonData);
    updateResources(jsonData);
  }

  const layerView = await view.whenLayerView(statesLayer);
  if (highlightHandle) highlightHandle.remove();
  highlightHandle = layerView.highlight(graphic);

  view.popup.open({
    location: event.mapPoint,
    title: stateName,
    content: `
      <b>Legalization Year:</b> ${legalYear}<br>
      <b>Colleges/Universities:</b> ${collegeCount}<br>
      <b>Total Population (2022 ACS):</b> ${popStr}<br>
      <b>Total Online Sports GGR (2018–2024):</b> ${ggrStr}<br>
      <b>Youth (18–24):</b> ${youthPctStr}<br>
    `
  });
});

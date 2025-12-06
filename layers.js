// layers.js

import FeatureLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/FeatureLayer.js";

export const statesLayer = new FeatureLayer({
  url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0",
  title: "US States",
  outFields: ["*"],
  
  // ⭐ THIS is the correct renderer for interactive highlight behavior
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-fill",
     color: [255, 255, 255, 0.05],     
      outline: {
        color: [0, 0, 0, 0.6],           // softer outline so highlight stands out
        width: 1.25
      }
    }
  },
  
  popupEnabled: false
});

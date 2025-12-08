// charts.js

let lineChart = null;
let pieChart = null;
let barChart1 = null;
let appDownloadsChart = null;

function getChartCtor() {
  return window.Chart;
}


// ------------------------------------------------------------
// PLACEHOLDERS (GREYED OUT CHARTS)
// ------------------------------------------------------------
export function resetChartsToPlaceholder() {
  const Chart = getChartCtor();

  // ------------------ LINE PLACEHOLDER ------------------
  const lineCtx = document.getElementById("lineChart").getContext("2d");
  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["","","","","",""],
      datasets: [
        {
          label: "No Data",
          data: [0,0,0,0,0,0],
          borderColor: "rgba(150,150,150,0.7)",
          borderDash: [6,6],
          borderWidth: 2,
          fill: false,
          tension: 0
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });


  // ------------------ PIE PLACEHOLDER ------------------
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["No Legal Betting"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["rgba(150,150,150,0.5)"],
          borderColor: "rgba(120,120,120,0.6)",
          borderWidth: 1
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });


  // ------------------ BAR PLACEHOLDER ------------------
  const barCtx = document.getElementById("barChart1").getContext("2d");
  if (barChart1) barChart1.destroy();

  barChart1 = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["No Data"],
      datasets: [
        {
          label: "0",
          data: [0],
          backgroundColor: "rgba(180,180,180,0.5)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });


  // ------------------ OPTIONAL APP DOWNLOAD PLACEHOLDER ------------------
  const downloadsDiv = document.getElementById("app-downloads-chart");
  if (downloadsDiv) {
    const canvas = downloadsDiv.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");

      if (appDownloadsChart) appDownloadsChart.destroy();

      appDownloadsChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["App1", "App2", "App3"],
          datasets: [
            {
              label: "Downloads",
              data: [0,0,0],
              backgroundColor: "rgba(180,180,180,0.5)"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  console.log("Charts reset to placeholder mode.");
}


// ------------------------------------------------------------
// RESOURCE PANEL PLACEHOLDER
// ------------------------------------------------------------
export function resetResourcesToPlaceholder() {
  document.getElementById("resourceContent").innerHTML =
    "<i>This state does not offer legalized online betting.</i>";
}



// ------------------------------------------------------------
// MAIN UPDATE FUNCTION (REAL CHARTS FOR LEGAL STATES)
// ------------------------------------------------------------
export async function updateCharts(abbr, data) {
  if (!data || !data.legalizationYear) {
    resetChartsToPlaceholder();
    resetResourcesToPlaceholder();
    return;
  }

  const Chart = getChartCtor();

  // ------------------ LINE CHART ------------------
  const ggr = data.onlineGGR;
  const years = Object.keys(ggr).filter(y => y !== "2018to2024");
  const values = years.map(y => ggr[y] ?? 0);

  const lineCtx = document.getElementById("lineChart").getContext("2d");
  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
         label: `Online Sports GGR for ${data.stateName}`,

          data: values,
          borderColor: "rgba(16,92,212,1)",
          backgroundColor: "rgba(16,92,212,0.2)",
          borderWidth: 2,
          tension: 0.3
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });


  // ------------------ PIE CHART (NEW PINK COLORS) ------------------
  const online2024 = ggr["2024"] ?? 0;
  const otherRevenue = data.GGRMinusSportsBetting ?? 0;

  const pieCtx = document.getElementById("pieChart").getContext("2d");
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
     labels: ["Online Sports GGR (2024)", "Other Gaming Revenue"],

      datasets: [
        {
          data: [online2024, otherRevenue],
          backgroundColor: ["#ff5c8d", "#e5b8ff"]  // PINK PALETTE 2A
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });


  // ------------------ BAR CHART (NEW TEAL COLORS) ------------------
  const search = data.searchScore;
  const searchYears = Object.keys(search).filter(y => y !== "2018to2024");
  const searchValues = searchYears.map(y => search[y] ?? 0);

  const barCtx = document.getElementById("barChart1").getContext("2d");
  if (barChart1) barChart1.destroy();

  barChart1 = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: searchYears,
      datasets: [
        {
          label: `Search Interest Trend (${data.stateName})`,
          data: searchValues,
          backgroundColor: "#2ec4b6",      // TEAL PRIMARY
          hoverBackgroundColor: "#00a6a6" // TEAL HOVER
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  console.log("Updated all charts for:", abbr);
}



// ------------------------------------------------------------
// RESOURCE PANEL UPDATE
// ------------------------------------------------------------
export function updateResources(data) {
  if (!data || !data.legalizationYear) {
    resetResourcesToPlaceholder();
    return;
  }

  document.getElementById("resourceContent").innerHTML = `
    <strong>${data.stateName}</strong><br><br>
    <strong>Problem Gambling Hotline:</strong><br>
    Phone: ${data.hotline.phone}<br>
    <a href="${data.hotline.url}" target="_blank">Visit Hotline Website</a><br><br>
    <strong>State Gaming Commission:</strong><br>
    <a href="${data.commissionUrl}" target="_blank">Commission Website</a>
  `;
}

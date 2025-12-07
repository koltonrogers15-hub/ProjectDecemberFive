// charts.js

let lineChart = null;
let pieChart = null;
let barChart1 = null;
let appDownloadsChart = null;   // optional if you later add this chart

function getChartCtor() {
  return window.Chart; // Chart.js globally loaded in index.html
}


// ------------------------------------------------------------
// PLACEHOLDER FUNCTIONS (Greyed-out / Disabled Mode)
// ------------------------------------------------------------
export function resetChartsToPlaceholder() {
  const Chart = getChartCtor();

  // ==============================
  // 1) LINE CHART PLACEHOLDER
  // ==============================
  const lineCanvas = document.getElementById("lineChart");
  const lineCtx = lineCanvas.getContext("2d");

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["", "", "", "", "", ""],
      datasets: [
        {
          label: "No Data",
          data: [0, 0, 0, 0, 0, 0],
          borderColor: "rgba(150,150,150,0.7)",
          borderDash: [6, 6],   // <-- dashed disabled style
          borderWidth: 2,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });


  // ==============================
  // 2) PIE CHART PLACEHOLDER
  // ==============================
  const pieCanvas = document.getElementById("pieChart");
  const pieCtx = pieCanvas.getContext("2d");

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
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });


  // ==============================
  // 3) BAR CHART PLACEHOLDER
  // ==============================
  const barCanvas = document.getElementById("barChart1");
  const barCtx = barCanvas.getContext("2d");

  if (barChart1) barChart1.destroy();

  barChart1 = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["No Data"],
      datasets: [
        {
          label: "0",
          data: [0],
          backgroundColor: "rgba(180,180,180,0.5)" // disabled color
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });


  // ==============================
  // 4) (OPTIONAL) APP DOWNLOADS CHART PLACEHOLDER
  // Only runs if that chart exists
  // ==============================
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
              data: [0, 0, 0],
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
// MAIN UPDATE FUNCTION — RUN ONLY FOR LEGAL STATES
// ------------------------------------------------------------
export async function updateCharts(abbr, data) {
  if (!data || !data.legalizationYear) {
    resetChartsToPlaceholder();
    resetResourcesToPlaceholder();
    return;
  }

  const Chart = getChartCtor();

  // ============================================
  // 1) LINE CHART — Online GGR over time
  // ============================================
  const ggr = data.onlineGGR;
  const years = Object.keys(ggr).filter((y) => y !== "2018to2024");
  const values = years.map((y) => ggr[y] ?? 0);

  const lineCanvas = document.getElementById("lineChart");
  const lineCtx = lineCanvas.getContext("2d");

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: `Online GGR for ${data.stateName}`,
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


  // ============================================
  // 2) PIE CHART — Online GGR vs Other Gaming Revenue
  // ============================================
  const online2024 = ggr["2024"] ?? 0;
  const otherRevenue = data.GGRMinusSportsBetting ?? 0;

  const pieCanvas = document.getElementById("pieChart");
  const pieCtx = pieCanvas.getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Online GGR (2024)", "Other Gaming Revenue"],
      datasets: [
        {
          data: [online2024, otherRevenue],
          backgroundColor: ["#1E88E5", "#90CAF9"]
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });


  // ============================================
  // 3) BAR CHART — Search Interest Trend
  // ============================================
  const search = data.searchScore;
  const searchYears = Object.keys(search).filter((y) => y !== "2018to2024");
  const searchValues = searchYears.map((y) => search[y] ?? 0);

  const barCanvas = document.getElementById("barChart1");
  const barCtx = barCanvas.getContext("2d");

  if (barChart1) barChart1.destroy();

  barChart1 = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: searchYears,
      datasets: [
        {
          label: `Search Interest Trend (${data.stateName})`,
          data: searchValues,
          backgroundColor: "#42A5F5"
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
// 4) RESOURCE PANEL UPDATE (ONLY FOR LEGAL STATES)
// ------------------------------------------------------------
export function updateResources(data) {
  if (!data || !data.legalizationYear) {
    resetResourcesToPlaceholder();
    return;
  }

  const box = document.getElementById("resourceContent");

  box.innerHTML = `
    <strong>${data.stateName}</strong><br><br>

    <strong>Problem Gambling Hotline:</strong><br>
    Phone: ${data.hotline.phone}<br>
    <a href="${data.hotline.url}" target="_blank">Visit Hotline Website</a><br><br>

    <strong>State Gaming Commission:</strong><br>
    <a href="${data.commissionUrl}" target="_blank">Commission Website</a>
  `;
}

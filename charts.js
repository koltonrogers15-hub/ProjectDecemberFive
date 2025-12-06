// charts.js

let lineChart = null;
let pieChart = null;
let barChart1 = null;

function getChartCtor() {
  return window.Chart;
}

export async function updateCharts(abbr, data) {
  if (!data || !data.onlineGGR) {
    console.warn("No data for state:", abbr);
    return;
  }

  const Chart = getChartCtor();

  // -----------------------------------------
  // LINE CHART
  // -----------------------------------------
  const ggr = data.onlineGGR;
  const years = Object.keys(ggr).filter(y => y !== "2018to2024");
  const values = years.map(y => ggr[y] ?? 0);

  const lineCanvas = document.getElementById("lineChart");
  const lineCtx = lineCanvas.getContext("2d");

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: `Online GGR for ${data.stateName}`,
        data: values,
        borderColor: "rgba(16,92,212,1)",
        backgroundColor: "rgba(16,92,212,0.2)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // -----------------------------------------
  // PIE CHART (Online GGR vs Other Revenue)
  // -----------------------------------------

  const online2024 = ggr["2024"] ?? 0;
  const otherRevenue = data.GGRMinusSportsBetting ?? 0;

  const pieCanvas = document.getElementById("pieChart");
  const pieCtx = pieCanvas.getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Online GGR (2024)", "Other Gaming Revenue"],
      datasets: [{
        data: [online2024, otherRevenue],
        backgroundColor: ["#1E88E5", "#90CAF9"]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // -----------------------------------------
  // BAR CHART (Search Score Trend)
  // -----------------------------------------

  const search = data.searchScore;
  const searchYears = Object.keys(search).filter(y => y !== "2018to2024");
  const searchValues = searchYears.map(y => search[y] ?? 0);

  const barCanvas = document.getElementById("barChart1");
  const barCtx = barCanvas.getContext("2d");

  if (barChart1) barChart1.destroy();

  barChart1 = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: searchYears,
      datasets: [{
        label: `Search Score Trend (${data.stateName})`,
        data: searchValues,
        backgroundColor: "#42A5F5"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  console.log("Updated all charts for", abbr);
}

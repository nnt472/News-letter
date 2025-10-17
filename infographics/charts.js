/* infographics/charts.js */
(function () {
  function parseJSON(input, fallback) {
    try { return JSON.parse(input); } catch { return fallback; }
  }

  window.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('canvas[data-chart]').forEach(function (cv) {
      var type = cv.dataset.chart || 'bar';
      var data = parseJSON(cv.dataset.dataset || '[]', []);
      var labels = parseJSON(cv.dataset.labels || '[]', []);
      var title = cv.dataset.title || '';
      var ctx = cv.getContext('2d');

      // Chart is provided by chart.umd.min.js loaded in the HTML
      // eslint-disable-next-line no-undef
      new Chart(ctx, {
        type: type,
        data: {
          labels: labels,
          datasets: [{ label: title, data: data }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: !!title } }
        }
      });
    });
  });
})();

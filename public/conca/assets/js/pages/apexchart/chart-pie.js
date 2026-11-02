(function($) {
    'use strict';

    
/* basic pie chart */
var options = {
    series: [44, 55, 13, 43, 22],
    chart: {
      height: 300,
      type: "pie",
    },
    colors: ["#735dff", "#ff5a29", "rgb(12, 199, 99)", "#0ca3e7", "rgb(255, 154, 19)"],
    labels: ["Team A", "Team B", "Team C", "Team D", "Team E"],
    legend: {
      position: "bottom",
        markers: {
            size: 4,
            strokeWidth: 0,
            strokeColor: '#fff',
            fillColors: undefined,
            radius: 12,
            customHTML: undefined,
            onClick: undefined,
            offsetX: 0,
            offsetY: 0
        },
    },
    dataLabels: {
      dropShadow: {
        enabled: false,
      },
    },
  };
  var chart = new ApexCharts(document.querySelector("#pie-basic"), options);
  chart.render();
  
  /* simple donut chart */
  var options = {
    series: [44, 55, 41, 17, 15],
    chart: {
      type: "donut",
      height: 290,
    },
    legend: {
      position: "bottom",
        markers: {
            size: 4,
            strokeWidth: 0,
            strokeColor: '#fff',
            fillColors: undefined,
            radius: 12,
            customHTML: undefined,
            onClick: undefined,
            offsetX: 0,
            offsetY: 0
        },
    },
    colors: ["#735dff", "#ff5a29", "rgb(12, 199, 99)", "#0ca3e7", "rgb(255, 154, 19)"],
    dataLabels: {
      dropShadow: {
        enabled: false,
      },
    },
  };
  var chart = new ApexCharts(document.querySelector("#donut-simple"), options);
  chart.render();
})();
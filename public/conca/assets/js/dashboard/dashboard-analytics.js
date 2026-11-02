(function($) {
    'use strict';

    /* basic column chart */
    var options = {
        series: [
            {
                name: 'Revenue',
                type: 'column',
                data: [44, 55, 57, 56, 61, 68, 72, 80, 91, 98, 105, 120]
            },
            {
                name: 'Orders',
                type: 'column',
                data: [320, 380, 410, 390, 430, 460, 490, 530, 580, 610, 640, 680]
            },
            {
                name: 'Active Users',
                type: 'line',
                data: [520, 610, 680, 640, 700, 740, 790, 860, 910, 980, 1040, 1110]
            }
        ],
        chart: {
            height: 330,
            type: 'line',
            toolbar: {
                show: false
            }
        },
        stroke: {
            width: [0, 0, 3],
            curve: 'smooth'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [2],
            formatter: function (val) {
                return val;
            },
            style: {
                fontSize: '11px',
                colors: ['#555']
            }
        },
        colors: ['#735dff', '#ff5a29', '#00caab'],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        xaxis: {
            labels: {
                style: {
                    colors: "#8c9097",
                    fontSize: '11px',
                    fontWeight: 600,
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Revenue ($ thousands)',
                    style: { color: "#8c9097" }
                },
                labels: {
                    style: {
                        colors: "#8c9097",
                        fontSize: '11px',
                        fontWeight: 600,
                    }
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Active Users',
                    style: { color: "#8c9097" }
                },
                labels: {
                    style: {
                        colors: "#8c9097",
                        fontSize: '11px',
                        fontWeight: 600,
                    }
                }
            }
        ],
        tooltip: {
            shared: true,
            intersect: false,
            y: [
                {
                    formatter: function (val) {
                        return "$" + val + "k";
                    }
                },
                {
                    formatter: function (val) {
                        return val + " orders";
                    }
                },
                {
                    formatter: function (val) {
                        return val + " users";
                    }
                }
            ]
        },
        legend: {
            show: true,
            position: 'bottom',
            offsetY: 6,
            fontSize: '12px',
            fontWeight: 600,
        },
        grid: {
            borderColor: '#f2f5f7',
        }
    };

    var chart = new ApexCharts(document.querySelector("#analytics-overview"), options);
    chart.render();


    var sourceOptions = {
        series: [35, 48, 27, 19, 22],
        labels: ['Direct', 'Organic Search', 'Social Media', 'Email', 'Referral'],
        chart: {
            type: 'polarArea',
            height: 300
        },
        stroke: {
            colors: ['#fff']
        },
        fill: {
            opacity: 0.85
        },
        colors: ["#735dff", "#ff5a29", "rgb(12, 199, 99)", "#0ca3e7", "rgb(255, 154, 19)"],
        legend: {
            position: 'bottom',
            fontSize: '12px',
            fontWeight: 600,
            labels: {
                colors: '#8c9097'
            },
            markers: {
                size: 4,
                strokeWidth: 0,
                radius: 12,
                offsetY: 0
            },
        },
        grid: {
            borderColor: '#f2f5f7',
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            y: {
                formatter: function(val, opts) {
                    return val + "% of total traffic";
                }
            }
        }
    };

    var chart = new ApexCharts(document.querySelector("#polararea-basic"), sourceOptions);
    chart.render();

    
    var options = {
        series: [
            {
                name: 'Sessions',
                type: 'column',
                data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160]
            }, 
            {
                name: 'Page Views',
                type: 'column',
                data: [340, 270, 540, 130, 470, 220, 430, 220, 430, 220, 430, 220]
            },
            {
                name: 'Sales',
                type: 'line',
                data: [520, 430, 320, 550, 430, 327, 540, 310, 540, 350, 540, 320]
            }
        ],
        chart: {
            height: 320,
            type: 'line',
        },
        stroke: {
            width: [0, 2],
            curve: 'smooth'
        },
        grid: {
            borderColor: '#f2f5f7',
        },
        plotOptions: {
            bar: {
              columnWidth: '35%',
              borderRadius: [2],
            }
          },
        title: {
            text: 'Website Analytics',
            align: 'left',
            style: {
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#8c9097'
            },
        },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [2]
        },
        legend: {
            show: true,
            position: "bottom",
            offsetX: 0,
            offsetY: 8,
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
        colors: ["#735dff", "#ff5a29"],
        labels: ['01 Jan 2001', '02 Jan 2001', '03 Jan 2001', '04 Jan 2001', '05 Jan 2001', '06 Jan 2001', '07 Jan 2001', '08 Jan 2001', '09 Jan 2001', '10 Jan 2001', '11 Jan 2001', '12 Jan 2001'],
        xaxis: {
            type: 'datetime',
            labels: {
                show: true,
                style: {
                    colors: "#8c9097",
                    fontSize: '11px',
                    fontWeight: 600,
                    cssClass: 'apexcharts-xaxis-label',
                },
            }
        },
        yaxis: [{
            title: {
                text: 'Sessions',
                style: {
                    color: "#8c9097",
                }
            },
            labels: {
                show: true,
                style: {
                    colors: "#8c9097",
                    fontSize: '11px',
                    fontWeight: 600,
                    cssClass: 'apexcharts-yaxis-label',
                },
            }
        }, {
            opposite: true,
            title: {
                text: 'Page Views',
                style: {
                    color: "#8c9097",
                }
            }
        }]
    };
    var chart = new ApexCharts(document.querySelector("#analytics-mixed-chart"), options);
    chart.render();


})();
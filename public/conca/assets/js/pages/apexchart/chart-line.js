(function($) {
    'use strict';
        $(function(){

        
        /* basic line chart */
        var options = {
            series: [{
                name: "Desktops",
                data: [69, 58, 45, 91, 41, 62, 51, 49, 148]
            }],
            chart: {
                height: 320,
                type: 'line',
                zoom: {
                    enabled: false
                }
            },
            colors: ['#735dff'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'straight',
                width: 2,
            },
            grid: {
                borderColor: '#f2f5f7',
            },
            title: {
                text: 'Total Product By Sale',
                align: 'left',
                style: {
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#8c9097'
                },
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
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
            yaxis: {
                min:0,
                labels: {
                    show: true,
                    style: {
                        colors: "#8c9097",
                        fontSize: '11px',
                        fontWeight: 600,
                        cssClass: 'apexcharts-yaxis-label',
                    },
                }
            }
        };
        var chart = new ApexCharts(document.querySelector("#line-chart"), options);
        chart.render();

        /* line with data labels */
        var options = {
            series: [
                {
                    name: "High",
                    data: [33, 29, 36, 32, 33, 32, 28]
                },
                {
                    name: "Low",
                    data: [13, 17, 12, 14, 18, 13, 11
                    ]
                }
            ],
            chart: {
                height: 320,
                type: 'line',
                dropShadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 0.2
                },
                toolbar: {
                    show: false
                }
            },
            colors: ['#735dff', '#ff5a29'],
            dataLabels: {
                enabled: true,
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            title: {
                text: 'Average Growth In Company',
                align: 'left',
                style: {
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#8c9097'
                },
            },
            grid: {
                borderColor: '#f2f5f7',
            },
            markers: {
                size: 1
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                title: {
                    text: 'Month',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    style: {
                        color: "#8c9097"
                    }
                },
                labels: {
                    show: true,
                    style: {
                        colors: "#8c9097",
                        fontSize: '11px',
                        fontWeight: 600,
                        cssClass: 'apexcharts-xaxis-label',
                    },
                },
            },
            yaxis: {
                title: {
                    text: 'Growth',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    style: {
                        color: "#8c9097"
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
                },
                min: 5,
                max: 40
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                offsetX: -10
            }
        };
        var chart = new ApexCharts(document.querySelector("#line-chart-datalabels"), options);
        chart.render();

        /* zoomable time series */
        var ts2 = 1484418600000;
        var dates = [];
        var spikes = [5, -5, 3, -3, 8, -8]
        for (var i = 0; i < 120; i++) {
            ts2 = ts2 + 86400000;
            var innerArr = [ts2, dataSeries[1][i].value];
            dates.push(innerArr)
        }
        var options = {
            series: [{
                name: 'XYZ MOTORS',
                data: dates
            }],
            chart: {
                type: 'area',
                stacked: false,
                height: 320,
                zoom: {
                    type: 'x',
                    enabled: true,
                    autoScaleYaxis: true
                },
                toolbar: {
                    autoSelected: 'zoom'
                }
            },
            dataLabels: {
                enabled: false
            },
            markers: {
                size: 0,
            },
            stroke: {
                width: 2,
            },
            title: {
                text: 'Temparature Condition',
                align: 'left',
                style: {
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#8c9097'
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: false,
                    opacityFrom: 0.5,
                    opacityTo: 0,
                    stops: [0, 90, 100]
                },
            },
            grid: {
                borderColor: '#f2f5f7',
            },
            colors: ["#735dff"],
            yaxis: {
                min:0,
                labels: {
                    formatter: function (val) {
                        return (val / 1000000).toFixed(0);
                    },
                    show: true,
                    style: {
                        colors: "#8c9097",
                        fontSize: '11px',
                        fontWeight: 600,
                        cssClass: 'apexcharts-yaxis-label',
                    },
                },
                title: {
                    text: 'Temparature',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    style: {
                        color: "#8c9097"
                    }
                },
            },
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
                },
            },
            tooltip: {
                shared: false,
                y: {
                    formatter: function (val) {
                        return (val / 1000000).toFixed(0)
                    }
                }
            }
        };
        var chart = new ApexCharts(document.querySelector("#zoom-chart"), options);
        chart.render();



    /* line chart with annotations */
    var options = {
        series: [{
            data: series.monthDataSeries2.prices
        }],
        colors: ["#735dff"],
        chart: {
            height: 320,
            type: 'line',
            id: 'areachart-2'
        },
        annotations: {
            yaxis: [{
                y: 8200,
                borderColor: '#00E396',
                label: {
                    borderColor: '#00E396',
                    style: {
                        color: '#fff',
                        background: '#00E396',
                    },
                    text: 'Support',
                }
            }, {
                y: 8600,
                y2: 9000,
                borderColor: '#000',
                fillColor: '#FEB019',
                opacity: 0.2,
                label: {
                    borderColor: '#333',
                    style: {
                        fontSize: '10px',
                        color: '#333',
                        background: '#FEB019',
                    },
                    text: 'Y-axis range',
                }
            }],
            xaxis: [{
                x: new Date('23 Nov 2017').getTime(),
                strokeDashArray: 0,
                borderColor: '#775DD0',
                label: {
                    borderColor: '#775DD0',
                    style: {
                        color: '#fff',
                        background: '#775DD0',
                    },
                    text: 'Anno Test',
                }
            }, {
                x: new Date('26 Nov 2017').getTime(),
                x2: new Date('28 Nov 2017').getTime(),
                fillColor: '#B3F7CA',
                opacity: 0.4,
                label: {
                    borderColor: '#B3F7CA',
                    style: {
                        fontSize: '10px',
                        color: '#fff',
                        background: '#00E396',
                    },
                    offsetY: -10,
                    text: 'X-axis range',
                }
            }],
            points: [{
                x: new Date('01 Dec 2017').getTime(),
                y: 8607.55,
                marker: {
                    size: 8,
                    fillColor: '#fff',
                    strokeColor: 'red',
                    radius: 2,
                    cssClass: 'apexcharts-custom-class'
                },
                label: {
                    borderColor: '#FF4560',
                    offsetY: 0,
                    style: {
                        color: '#fff',
                        background: '#FF4560',
                    },

                    text: 'Point Annotation',
                }
            }, {
                x: new Date('08 Dec 2017').getTime(),
                y: 9340.85,
                marker: {
                    size: 0
                },
                image: {
                    path: '../assets/images/faces/1.jpg'
                }
            }]
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight',
            width: 2,
        },
        grid: {
            borderColor: '#f2f5f7',
        },
        title: {
            text: 'Line with Annotations',
            align: 'left',
            style: {
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#8c9097'
            },
        },
        labels: series.monthDataSeries1.dates,
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
        yaxis: {
            labels: {
                show: true,
                style: {
                    colors: "#8c9097",
                    fontSize: '11px',
                    fontWeight: 600,
                    cssClass: 'apexcharts-yaxis-label',
                },
            }
        }
    };
    var chart = new ApexCharts(document.querySelector("#annotation-chart"), options);
    chart.render();

    /* stepline chart */
    var options = {
        series: [{
            data: [34, 44, 54, 21, 12, 43, 33, 23, 66, 66, 58]
        }],
        chart: {
            type: 'line',
            height: 345
        },
        stroke: {
            curve: 'stepline',
            width: 2,
        },
        grid: {
            borderColor: '#f2f5f7',
        },
        dataLabels: {
            enabled: false
        },
        colors: ["#735dff"],
        title: {
            text: 'Employee Attendance',
            align: 'left'
        },
        markers: {
            hover: {
                sizeOffset: 4
            }
        },
        xaxis: {
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
        yaxis: {
            min:0,
            labels: {
                show: true,
                style: {
                    colors: "#8c9097",
                    fontSize: '11px',
                    fontWeight: 600,
                    cssClass: 'apexcharts-yaxis-label',
                },
            }
        }
    };
    var chart2 = new ApexCharts(document.querySelector("#stepline-chart"), options);
    chart2.render();



    /* real time chart */
    var lastDate = 0;
    var data = []
    var TICKINTERVAL = 86400000
    let XAXISRANGE = 777600000
    function getDayWiseTimeSeries(baseval, count, yrange) {
        var i = 0;
        while (i < count) {
            var x = baseval;
            var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
            data.push({
                x, y
            });
            lastDate = baseval
            baseval += TICKINTERVAL;
            i++;
        }
    }
    getDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 10, {
        min: 10,
        max: 90
    })
    function getNewSeries(baseval, yrange) {
        var newDate = baseval + TICKINTERVAL;
        lastDate = newDate
        for (var i = 0; i < data.length - 10; i++) {
            // IMPORTANT
            // we reset the x and y of the data which is out of drawing area
            // to prevent memory leaks
            data[i].x = newDate - XAXISRANGE - TICKINTERVAL
            data[i].y = 0
        }
        data.push({
            x: newDate,
            y: Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
        })
    }
    function resetData() {
        // Alternatively, you can also reset the data at certain intervals to prevent creating a huge series
        data = data.slice(data.length - 10, data.length);
    }
    var options = {
        series: [{
            data: data.slice()
        }],
        chart: {
            id: 'dynamic-chart',
            height: 320,
            type: 'line',
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 1000
                }
            },
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        colors: ["#735dff"],
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        title: {
            text: 'Financial Overview',
            align: 'left',
            style: {
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#8c9097'
            },
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime',
            range: XAXISRANGE,
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
        yaxis: {
            max: 100,
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
        legend: {
            show: false
        },
    };
    var chart = new ApexCharts(document.querySelector("#realtime-chart"), options);
    chart.render();
    window.setInterval(function () {
        getNewSeries(lastDate, {
            min: 10,
            max: 90
        })
        chart.updateSeries([{
            data: data
        }])
    }, 1000)

    })
})(jQuery);
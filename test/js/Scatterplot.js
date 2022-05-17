// https://d3-graph-gallery.com/graph/interactivity_button.html
// https://d3-graph-gallery.com/graph/scatter_basic.html


"use strict";

// const { thresholdScott } = require("d3");

// const d3 = require("d3");

d3.axis = function (orient) {

    let axisTypes = {
        "left": d3.axisLeft(),
        "right": d3.axisRight(),
        "top": d3.axisTop(),
        "bottom": d3.axisBottom(),
    }

    orient = orient.toLowerCase();

    return axisTypes[orient];

}

d3.scale = function (type) {

    let scaleTypes = {
        "band": d3.scaleBand(),
        "diverging": d3.scaleDiverging(),
        "diverginglog": d3.scaleDivergingLog(),
        "divergingpow": d3.scaleDivergingPow(),
        "divergingsqrt": d3.scaleDivergingSqrt(),
        "divergingsymlog": d3.scaleDivergingSymlog(),
        "identity": d3.scaleIdentity(),
        "linear": d3.scaleLinear(),
        "log": d3.scaleLog(),
        "ordinal": d3.scaleOrdinal(),
        "point": d3.scalePoint(),
        "pow": d3.scalePow(),
        "quantile": d3.scaleQuantile(),
        "quantize": d3.scaleQuantize(),
        "radial": d3.scaleRadial(),
        "sequential": d3.scaleSequential(),
        "sequentiallog": d3.scaleSequentialLog(),
        "sequentialpow": d3.scaleSequentialPow(),
        "sequentialsqrt": d3.scaleSequentialSqrt(),
        "sequentialsymlog": d3.scaleSequentialSymlog(),
        "sqrt": d3.scaleSqrt(),
        "symlog": d3.scaleSymlog(),
        "threshold": d3.scaleThreshold(),
        "time": d3.scaleTime(),
        "utc": d3.scaleUtc(),
    };

    type = type.toLowerCase();

    return scaleTypes[type].unknown(0);
}


let AAA = d3.scale("symlog").domain([0, 31]).rangeRound([0, 300])


class Axis {
    constructor() {

        this._orient = "left";
        this._scale = "linear";
        this._domain = [1, 2];
        this._renderdomain = [1, 2];
        this._range = [1, 2];
        this._padding = [0, 0];

        this.Scale = d3.scale("linear").domain(this._domain).range(this._range);
        this.Axis = d3.axis("left").scale(this.Scale);

        return this;
    }

    scale(type) {

        this._scale = type;

        this.Scale = d3.scale(this._scale).domain(this._renderdomain).range(this._range);

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain).range(this._range);

        this.Axis.scale(this.Scale);

        return this;
    }

    orient(orient) {

        this._orient = orient;

        this.Axis = d3.axis(this._orient).scale(this.Scale);

        return this;
    }

    domain(domain) {

        this._domain = domain;

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    domainMin(min) {

        this._domain[0] = min;

        this.domain(this._domain);

        return this;
    }

    domainMax(max) {

        this._domain[this._domain.length - 1] = max;

        this.domain(this._domain);

        return this;
    }

    range(range) {

        this._range = range;

        this._renderdomain = this._applyPadding();

        this.Scale.range(this._range).domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    rangeStart(start) {

        this._range[0] = start;

        this.range(this._range);

        return this;
    }

    rangeEnd(end) {

        this._range[this._range.length - 1] = end;

        this.range(this._range);

        return this;
    }

    paddingStart(start) {

        this._padding[0] = start;

        this.padding(this._padding);

        return this;
    }

    paddingEnd(end) {

        this._padding[this._padding.length - 1] = end;

        this.padding(this._padding);

        return this;
    }

    padding(padding) {

        this._padding = padding;

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    _applyPadding() {

        this._renderdomain = this._domain.slice();

        let rangeTemp = this._range.slice();


        if (this._range[0] > this._range.at(-1)) {
            rangeTemp[0] = this._range[0] - this._padding[0];
            rangeTemp[rangeTemp.length - 1] = this._range[this._range.length - 1] + this._padding[1];
        }
        else {
            rangeTemp[0] = this._range[0] + this._padding[0];
            rangeTemp[rangeTemp.length - 1] = this._range[this._range.length - 1] - this._padding[1];
        }


        let scaleTemp = this.Scale.copy().domain(this._domain).range(rangeTemp);
        this._renderdomain[0] = scaleTemp.invert(this._range[0]);
        this._renderdomain[this._renderdomain.length - 1] = scaleTemp.invert(this._range.at(-1));

        console.log(this);

        return this._renderdomain;
    }
}

class _ScatterPlot {

    constructor(selection) {

        this.CHART = selection;

        this.param = {
            // set the dimensions and margins of the graph
            width: 500,
            height: 500,

            margin: { top: 30, right: 200, bottom: 30, left: 200 },

            padding: { top: 50, right: 50, bottom: 10, left: 10 },

            fontSize: 12,
            axisLabelMargin: 7,

            fixedRadius: 5,
            textMargin: 5,

            circleRange: { min: 1, max: 30 },

            xLabel: "Text",
            yLabel: "Text",
        }

        this.param.svgWidth = this.param.width + this.param.margin.left + this.param.margin.right;
        this.param.svgHeight = this.param.height + this.param.margin.top + this.param.margin.bottom;

        this.data = [];

        this.xAxis = new Axis();
        this.yAxis = new Axis();

        this.xAxis
            .orient("bottom")
            .scale("linear")
            .range([0, this.param.width])
            .padding([this.param.padding.left, this.param.padding.right]);

        this.yAxis
            .orient("left")
            .scale("linear")
            .range([this.param.height, 0])
            .padding([this.param.padding.left, this.param.padding.right]);

        this.SVG = {};
        this.points = {};
        this.xAxisLine = {};
        this.yAxisLine = {};
        this.xLabel = {};
        this.yLabel = {};

        return this;
    }

    initScatterPLot() {

        this.initSVG()
            .initXAxis()
            .initYAxis()
            .initPoints();

        return this;
    }

    initSVG() {
        this.SVG = this.CHART.append("svg")
            .attr("width", this.param.svgWidth)
            .attr("height", this.param.svgHeight)
            .append("g")
            .attr("transform", "translate(" + this.param.margin.left + "," + this.param.margin.top + ")");

        return this;
    }

    initXAxis() {

        this.initXAxisLine()
            .initXAxisLabel();

        return this;
    }

    initYAxis() {
        this.initYAxisLine()
            .initYAxisLabel();

        return this;
    }

    initPoints() {

        this.initPointInit()
            .initPointCircle()
            .initPointText()
            .initPointOnClick();

        return this;

    }

    initXAxisLabel() {

        this.xLabel = this.SVG.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", this.param.width + this.param.axisLabelMargin)
            .attr("y", this.param.height)
            .attr("font-size", this.param.fontSize + "px")
            .text(this.param.xLabel);

        return this;
    }

    initXAxisLine() {

        this.xAxisLine = this.SVG.append("g")
            .attr("transform", "translate(0," + this.param.height + ")")
            .call(this.xAxis.Axis)
            .attr("font-size", this.param.fontSize + "px");

        return this;
    }

    initYAxisLabel() {

        this.yLabel = this.SVG.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", this.param.axisLabelMargin)
            .attr("y", 0)
            .attr("font-size", this.param.fontSize + "px")
            .text(this.param.yLabel);

        return this;
    }

    initYAxisLine() {

        this.yAxisLine = this.SVG.append("g")
            .call(this.yAxis.Axis)
            .attr("font-size", this.param.fontSize + "px");

        return this;
    }

    initPointInit() {

        this.points = this.SVG.append('g')
            .selectAll(".scatter-point")
            .data(this.data)
            .enter()
            .append("g")
            .attr("class", "scatter-point")
            .style("cursor", "move");

        return this;
    }

    initPointCircle() {
        // For each point, add a circle
        this.points.append("circle")
            .attr("cx", d => d.render.x)
            .attr("cy", d => d.render.y)
            .attr("r", d => d.render.radius)
            .style("fill", d => { return "#69b3a2" });

        return this;
    }

    initPointText() {
        // For each point, add a label
        this.points.append("text")
            .text(d => d.render.text)
            .attr("x", d => d.render.x + d.render.radius)
            .attr("y", d => d.render.y + d.render.radius)
            .attr("font-family", "sans-serif")
            .attr("font-size", this.param.fontSize + "px")
            .attr("fill", "purple");

        return this;
    }

    initPointOnClick() {

        this.points.on("click", pointOnClick);

        function pointOnClick(e, d) {

            d.render.selected = !d.render.selected;

            const point = d3.select(this);

            // bring element to forth
            this.parentNode.appendChild(this);

            if (d.render.selected) {
                point.select("circle").style("fill", "blue");
            }

            else {
                point.select("circle").style("fill", "#69b3a2");
            }

        };

        return this;
    }

}

class _ScatterPlotReset extends _ScatterPlot {

    constructor(selection) {

        super(selection);

        return this;
    }


    resetXAxisLabel() {

        this.xLabel
            .transition("select")
            .duration(500)
            .text(this.param.xLabel);

        return this;
    }

    resetXAxisLine() {

        this.xAxisLine
            .transition("select")
            .duration(500)
            .call(this.xAxis.Axis);

        return this;
    }

    resetYAxisLabel() {

        this.yLabel
            .transition("select")
            .duration(500)
            .text(this.param.yLabel);

        return this;
    }

    resetYAxisLine() {

        this.yAxisLine
            .transition("select")
            .duration(500)
            .call(this.yAxis.Axis);

        return this;
    }


    resetPointCircle() {

        this.points.select("circle")
            .transition("select")
            .duration(500)
            .attr("cx", d => d.render.x)
            .attr("cy", d => d.render.y)
            .attr("r", d => d.render.radius)
            .style("fill", d => { return "#69b3a2" });

        return this;
    }

    resetPointText() {

        this.points.select("text")
            .transition("select")
            .duration(500)
            .text(d => d.render.text)
            .attr("x", d => d.render.x + d.render.radius)
            .attr("y", d => d.render.y + d.render.radius)
            .attr("fill", "purple");

        return this;
    }

}

class _ScatterPlotData extends _ScatterPlotReset {
    constructor(selection) {
        super(selection);

        this.accessor = {
            text: d => d,
            x: d => d,
            y: d => d,
            circle: d => this.param.fixedRadius,
        };

        this.xMinType = 0;
        this.yMinType = 0;
        this.xOrientType = "bottom";
        this.yOrientType = "left";

        this.scaleCircle = x => x;

        return this;
    }

    initData(data) {
        this.data = data;
        this.xAxis.domain([0, d3.max(this.data, d => this.accessor.x(d))])
            .paddingStart(0);
        this.yAxis.domain([0, d3.max(this.data, d => this.accessor.y(d))])
            .paddingStart(0);
        this.initRender();


        return this;
    }

    initRender() {

        for (let d of this.data) {
            if (d.render == undefined) {
                d.render = {}
            }
            d.render.text = this.accessor.text(d);
            d.render.x = this.xAxis.Scale(this.accessor.x(d));
            d.render.y = this.yAxis.Scale(this.accessor.y(d));
            d.render.radius = this.scaleCircle(this.accessor.circle(d));
        }

        return this;
    }

    resetAccessorText(accessor) {
        this.accessor.text = accessor;
        this.resetRender()
            .resetPointCircle()
            .resetPointText();
        return this;
    }

    resetAccessorX(accessor) {
        this.accessor.x = accessor;
        this.xAxis.domain([0, d3.max(this.data, d => this.accessor.x(d))]);
        this.resetRender()
            .resetPointCircle()
            .resetPointText()
            .resetXAxisLine();
        return this;
    }

    resetAccessorY(accessor) {
        this.accessor.y = accessor;
        this.yAxis.domain([0, d3.max(this.data, d => this.accessor.y(d))]);

        this.resetRender()
            .resetPointCircle()
            .resetPointText()
            .resetYAxisLine();
        return this;
    }

    resetAccessorCircle(accessor) {
        this.accessor.circle = accessor;
        this.resetRender()
            .resetPointCircle()
            .resetPointText();
        return this;
    }

    resetScaleCircle(scale) {
        this.scaleCircle = scale;
        this.resetRender()
            .resetPointCircle()
            .resetPointText();
        return this;
    }

    resetRender() {

        for (let d of this.data) {
            d.render.text = this.accessor.text(d);
            d.render.x = this.xAxis.Scale(this.accessor.x(d));
            d.render.y = this.yAxis.Scale(this.accessor.y(d));
            d.render.radius = this.scaleCircle(this.accessor.circle(d));

        }

        return this;
    }
}

class ScatterPlot extends _ScatterPlotData {
    constructor(selection) {
        super(selection);

        this.accessor.text = d => d.data.x;
        this.accessor.x = d => d.data.x;
        this.accessor.y = d => d.data.y;

        this.scaleCircle = d => d;

        return this;
    }
}

class Selections {

    constructor(selectionarea) {

        this.SELECTIONAREA = selectionarea;
        this.valueOnSelect = function (option) {

        }

    }

    initValueOnSelect(callback) {

        this.valueOnSelect = callback;

        return this;

    }

    initOptions(data) {

        this.options = data;

        return this;

    }

    initDefault(option) {
        this.options.sort((a, b) => {
            if (a.value == option) {
                return -1;
            }
            else if (b.value == option) {
                return 1;
            }
            else return 0;
        })

        return this;
    }

    initSelection() {

        this.initSelectionSelection()
            .initSelectionOptions()
            .initSelectionOnSelect();
    }

    initSelectionSelection() {

        this.selection = this.SELECTIONAREA.append("select");

        return this;
    }

    initSelectionOptions() {

        this.selection.selectAll("option")
            .data(this.options)
            .enter()
            .append("option")
            .text(function (d) { return d.name; })
            .attr("value", function (d) { return d.value; });

        return this;
    }

    initSelectionOnSelect() {

        let self = this;

        this.selection.on("change", function (d) {

            const selectedOption = d3.select(this).property("value");

            self.valueOnSelect(selectedOption);
        });

        return this;
    }
}

class Scatters extends ScatterPlot {

    constructor(ID) {

        // create areas inside chart area
        let SELECTIONS = d3.select(ID)
            .append("div")
            .attr("id", "scatter-plot-selections-2");

        super(SELECTIONS);

        this.SELECTIONS = SELECTIONS;

        return this;

    }

    initSelections() {

        let self = this;

        self.selectVarX = new Selections(this.SELECTIONS)
            .initOptions([
                {
                    name: "x",
                    value: "x"
                },
                {
                    name: "y",
                    value: "y"
                }
            ])
            .initDefault("x")
            .initValueOnSelect(function (option) {
                self.resetAccessorX(d => d.data[option]);
                self.resetAccessorText(d => d.data[option]);
            });


        self.selectVarY = new Selections(this.SELECTIONS);

        self.selectVarY
            .initOptions([
                {
                    name: "x",
                    value: "x"
                },
                {
                    name: "y",
                    value: "y"
                }
            ])
            .initDefault("y")
            .initValueOnSelect(function (option) {

                self.resetAccessorY(d => d.data[option]);
                self.resetAccessorText(d => d.data[option]);
            });

        self.selectVarCircle = new Selections(this.SELECTIONS);

        self.selectVarCircle
            .initOptions([
                {
                    name: "-- None --",
                    value: "--none--"
                },
                {
                    name: "x",
                    value: "x"
                },
                {
                    name: "y",
                    value: "y"
                }
            ])
            .initDefault("--none--")
            .initValueOnSelect(function (option) {
                if (option == "--none--") {
                    self.resetAccessorCircle(d => self.param.fixedRadius)
                        .resetScaleCircle(d => d);
                }
                else {

                    self.resetAccessorCircle(d => d.data[option])
                        .resetScaleCircle(d3.scale("sqrt")
                            .domain([
                                d3.min(self.data, d => d.data[option]),
                                d3.max(self.data, d => d.data[option])
                            ])
                            .range([
                                self.param.circleRange.min,
                                self.param.circleRange.max
                            ]))
                        .resetAccessorText(d => d.data[option]);
                }

            });

        self.selectXScale = new Selections(this.SELECTIONS);

        self.selectXScale
            .initOptions([
                {
                    name: "X Linear",
                    value: "linear"
                },
                {
                    name: "X Log",
                    value: "symlog"
                }
            ])
            .initDefault("linear")
            .initValueOnSelect(function (option) {

                self.xAxis.scale(option);

                self.xAxis.Axis.ticks(2);

                self.resetRender()
                    .resetXAxisLine()
                    .resetPointCircle()
                    .resetPointText();
            });

        self.selectYScale = new Selections(this.SELECTIONS);

        self.selectYScale
            .initOptions([
                {
                    name: "Y Linear",
                    value: "linear"
                },
                {
                    name: "Y Log",
                    value: "symlog"
                }
            ])
            .initDefault("linear")
            .initValueOnSelect(function (option) {

                self.yAxis.scale(option);

                self.yAxis.Axis.ticks(2);

                self.resetRender()
                    .resetYAxisLine()
                    .resetPointCircle()
                    .resetPointText();
            });

        self.selectVarY.initSelection();
        self.selectVarX.initSelection();
        self.selectVarCircle.initSelection();
        self.selectXScale.initSelection();
        self.selectYScale.initSelection();

        return self;

    }

}

let x = new Scatters("#scatter-plot")
x.initData([
    {
        data: {
            x: 0,
            y: AAA(0)
        }
    },
    {
        data: {
            x: 1,
            y: AAA(1)
        }
    },
    {
        data: {
            x: 2,
            y: AAA(2)
        }
    },
    {
        data: {
            x: 31,
            y: AAA(31)
        }
    },
    {
        data: {
            x: 11,
            y: AAA(11)
        }
    },
    {
        data: {
            x: 21,
            y: AAA(21)
        }
    },
]).initScatterPLot().initSelections()




// class ScatterPlots {

//     constructor(ID) {

//         this.ID = ID;

//         this.param = {
//             // set the dimensions and margins of the graph
//             width: 500,
//             height: 500,

//             margin: { top: 30, right: 200, bottom: 30, left: 60 },

//             valueMargin: { top: 50, right: 50, bottom: 10, left: 10 },

//             fontSize: 12,
//             axisLabelMargin: 7,

//             fixedRadius: 5,
//             textMargin: 5,

//             circleRange: { min: 1, max: 30 }
//         }

//         this.param.svgWidth = this.param.width + this.param.margin.left + this.param.margin.right;

//         this.param.svgHeight = this.param.height + this.param.margin.top + this.param.margin.bottom;

//         this.data = {
//             data: [],
//             x: {
//                 max: 0,
//                 min: 0,
//             },
//             y: {
//                 max: 0,
//                 min: 0,
//             },
//             circle: {
//                 max: 0,
//                 min: 0,
//             }
//         }

//         this.axis = {
//             x: {
//                 scale: 0,
//                 call: 0,
//                 line: 0,
//             },
//             y: {
//                 scale: 0,
//                 call: 0,
//                 line: 0,
//             }
//         }

//         this.scale = {
//             x: d3.scale("linear"),
//             y: d3.scale("linear"),
//             circle: d3.scaleSqrt()
//         }

//         this.circleScale = x => this.param.fixedRadius;

//         this.resetTransition = function (selection) {

//             selection.transition("reset")
//                 .duration(500)
//                 .ease(d3.easeLinear);

//             return selection;

//         }

//         return this;
//     }

//     initData(data) {
//         this.data.data = data;
//         return this;
//     }

//     initVarX(varX) {
//         this.varX = varX;
//         this.data.x.max = d3.max(this.data.data, d => d.data[this.varX]);
//         this.data.x.min = d3.min(this.data.data, d => d.data[this.varX]);
//         return this;
//     }

//     initVarY(varY) {
//         this.varY = varY;
//         this.data.y.max = d3.max(this.data.data, d => d.data[this.varY]);
//         this.data.y.min = d3.min(this.data.data, d => d.data[this.varY]);
//         return this;
//     }

//     initVarCircle(varCircle) {
//         if (varCircle == "--none--") {
//             this.varCircle = this.varX; // just to make this code bug free
//             this.circleScale = x => this.param.fixedRadius;

//             return this;
//         }
//         this.varCircle = varCircle;
//         this.data.circle.max = d3.max(this.data.data, d => d.data[this.varCircle]);
//         this.data.circle.min = d3.min(this.data.data, d => d.data[this.varCircle]);
//         this.circleScale = d3.scaleSqrt()
//             .domain([this.data.circle.min, this.data.circle.max])
//             .range([this.param.circleRange.min, this.param.circleRange.max])
//         return this;
//     }

//     initId(id) {
//         this.ID = id;
//         return this;
//     }

//     initChartArea() {
//         this.CHART = d3.select(this.ID)
//             .append("div")
//             .attr("id", "scatter-plot-chart");
//         return this;
//     }

//     initSVG() {
//         this.svg = this.CHART.append("svg")
//             .attr("width", this.param.svgWidth)
//             .attr("height", this.param.svgHeight)
//             .append("g")
//             .attr("transform", "translate(" + this.param.margin.left + "," + this.param.margin.top + ")");

//         return this;
//     }

//     initXAxisLabel(callback = x => x) {
//         // Add X axis label:
//         this.xLabel = this.svg.append("text")
//             .attr("text-anchor", "start")
//             .attr("dominant-baseline", "middle")
//             .attr("x", this.param.width + this.param.axisLabelMargin)
//             .attr("y", this.param.height)
//             .attr("font-size", this.param.fontSize + "px")
//             .text(callback(this.varX));

//         return this;
//     }

//     initXAxisScale(scale = d3.scale("linear").domain([0, this.data.x.max]).range([0, this.param.width])) {

//         this.axis.x.scale = scale;
//         return this;
//     }

//     initXAxisCall() {
//         this.axis.x.call = d3.axis("bottom").scale(this.axis.x.scale);
//         return this;
//     }

//     initXAxisLine() {

//         this.xAxis = this.axis.x.line = this.svg.append("g")
//             .attr("transform", "translate(0," + this.param.height + ")")
//             .call(this.axis.x.call)
//             .attr("font-size", this.param.fontSize + "px");

//         return this;
//     }

//     initXAxis() {
//         this.initXAxisScale()
//             .initXAxisCall()
//             .initXAxisLine()
//             .initXAxisLabel();

//         return this;
//     }

//     initYAxisLabel(callback = x => x) {
//         // Add Y axis label:
//         this.yLabel = this.svg.append("text")
//             .attr("text-anchor", "start")
//             .attr("dominant-baseline", "middle")
//             // .attr("transform", "rotate(90)")
//             .attr("x", this.param.axisLabelMargin)
//             .attr("y", 0)
//             .attr("font-size", this.param.fontSize + "px")
//             .text(callback(this.varY));

//         return this;
//     }

//     initYAxisScale(scale = d3.scale("linear").domain([0, this.data.y.max]).range([this.param.height, 0])) {

//         this.axis.y.scale = scale;

//         return this;
//     }

//     initYAxisCall() {
//         this.axis.y.call = d3.axisLeft().scale(this.axis.y.scale);

//         return this;
//     }

//     initYAxisLine() {

//         this.yAxis = this.axis.y.line = this.svg.append("g")
//             .call(this.axis.y.call)
//             .attr("font-size", this.param.fontSize + "px");

//         return this;
//     }

//     initYAxis() {
//         this.initYAxisScale()
//             .initYAxisCall()
//             .initYAxisLine()
//             .initYAxisLabel();

//         return this;
//     }

//     initPointInit() {
//         // Add points

//         this.points = this.svg.append('g')
//             .selectAll(".scatter-point")
//             .data(this.data.data)
//             .enter()
//             .append("g")
//             .attr("class", "scatter-point")
//             .style("cursor", "move");

//         return this;
//     }

//     initPointCircle() {

//         // For each point, add a circle
//         this.points.append("circle")
//             .attr("class", "scatter-circle")
//             .attr("cx", (d) => {
//                 return this.axis.x.scale(d.data[this.varX])
//             })
//             .attr("cy", d => {

//                 return this.axis.y.scale(d.data[this.varY])
//             }
//             )
//             .attr("r",
//                 (d) => {
//                     d.radius = this.circleScale(d.data[this.varCircle]);
//                     return d.radius;
//                 }
//             )
//             .attr("fill", (d) => { return "#69b3a2" });

//         return this;
//     }

//     initPointText() {
//         // For each point, add a label
//         this.points.append("text")
//             .text(d => `${d.data[this.varX]} (${d.data[this.varX].toLocaleString('en-US')}; ${d.data[this.varY].toLocaleString('en-US')})`)
//             .attr("x", d => {
//                 return d.radius + this.axis.x.scale(d.data[this.varX])
//             })
//             .attr("y", d => - d.radius + this.axis.y.scale(d.data[this.varY]))
//             .attr("font-family", "sans-serif")
//             .attr("font-size", this.param.fontSize + "px")
//             .attr("fill", "purple");

//         return this;
//     }

//     initPointOnClick() {
//         this.points.on("click", pointOnClick);

//         function pointOnClick(e, d) {
//             d.selected = !d.selected;

//             const point = d3.select(this);

//             // bring element to forth
//             this.parentNode.appendChild(this);

//             if (d.selected) {
//                 point.select("circle").style("fill", "blue");
//             }
//             else {
//                 point.select("circle").style("fill", "#69b3a2");
//             }

//         };

//         return this;
//     }

//     initPoint() {

//         this.initPointInit()
//             .initPointCircle()
//             .initPointText()
//             .initPointOnClick();

//         return this;

//     }

//     resetVarX(varX) {
//         this.varX = varX;
//         this.data.x.max = d3.max(this.data.data, d => d.data[this.varX]);
//         this.data.x.min = d3.min(this.data.data, d => d.data[this.varX]);
//         this.resetXAxisLabel()
//             .resetXAxisScale()
//             .resetPoint()
//         return this;
//     }

//     resetVarY(varY) {
//         this.varY = varY;
//         this.data.y.max = d3.max(this.data.data, d => d.data[this.varY]);
//         this.data.y.min = d3.min(this.data.data, d => d.data[this.varY]);
//         this.resetYAxisLabel()
//             .resetYAxisScale()
//             .resetPoint()
//         return this;
//     }

//     resetVarCircle(varCircle) {
//         this.varCircle = varCircle;
//         this.data.circle.max = d3.max(this.data.data, d => d.data[this.varCircle]);
//         this.data.circle.min = d3.min(this.data.data, d => d.data[this.varCircle]);
//         this.circleScale = d3.scaleSqrt()
//             .domain([this.data.circle.min, this.data.circle.max])
//             .range([this.param.circleRange.min, this.param.circleRange.max]);
//         this.resetPoint();
//     }

//     resetXAxisLabel(callback = x => x) {

//         this.xLabel
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .text(callback(this.varX));

//         return this;
//     }

//     resetXAxisScale(scale = d3.scale("linear").domain([0, this.data.x.max]).range([0, this.param.width])) {

//         this.axis.x.scale = scale;

//         this.resetXAxisCall();

//         return this;
//     }

//     resetXAxisCall() {

//         this.axis.x.call.scale(this.axis.x.scale);

//         this.resetXAxisLine();

//         return this;
//     }

//     resetXAxisLine() {

//         this.xAxis
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .call(this.axis.x.call);

//         return this;
//     }

//     resetYAxisLabel(callback = x => x) {

//         this.yLabel
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .text(callback(this.varY));

//         return this;
//     }

//     resetYAxisScale(scale = d3.scale("linear").domain([0, this.data.y.max]).range([this.param.height, 0])) {

//         this.axis.y.scale = scale;

//         this.resetYAxisCall();

//         return this;
//     }

//     resetYAxisCall() {
//         this.axis.y.call.scale(this.axis.y.scale);

//         this.resetYAxisLine();

//         return this;
//     }

//     resetYAxisLine() {

//         this.yAxis
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .call(this.axis.y.call)

//         return this;
//     }

//     resetPointCircle() {

//         this.points.select("circle")
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .attr("cx", (d) => this.axis.x.scale(d.data[this.varX]))
//             .attr("cy", d => this.axis.y.scale(d.data[this.varY]))
//             .attr("r", (d) => {
//                 d.radius = this.circleScale(d.data[this.varCircle]);;
//                 return d.radius;
//             }
//             )
//             .style("fill", (d) => { return "#69b3a2" });

//         return this;
//     }

//     resetPointText() {

//         this.points.select("text")
//             .transition("reset")
//             .duration(500)
//             .ease(d3.easeLinear)
//             .text(d => `${d.data[this.varX]} (${d.data[this.varX].toLocaleString('en-US')}; ${d.data[this.varY].toLocaleString('en-US')})`)
//             .attr("x", d => {
//                 return d.radius + this.axis.x.scale(d.data[this.varX])
//             })
//             .attr("y", d => - d.radius + this.axis.y.scale(d.data[this.varY]))

//         return this;
//     }

//     resetPoint() {

//         this.resetPointCircle()
//             .resetPointText();

//         return this;

//     }

// }



// class Scatters extends ScatterPlots {

//     constructor(ID) {

//         super(ID);

//         // create areas inside chart area
//         this.SELECTIONS = d3.select(this.ID)
//             .append("div")
//             .attr("id", "scatter-plot-selections");

//         return this;

//     }

//     initSelections() {

//         let self = this;

//         self.selectVarX = new Selections(this.SELECTIONS)
//             .initOptions([
//                 {
//                     name: "x",
//                     value: "x"
//                 },
//                 {
//                     name: "y",
//                     value: "y"
//                 }
//             ])
//             .initDefault("x")
//             .initValueOnSelect(function (option) {
//                 self.resetVarX(option);
//             });


//         self.selectVarY = new Selections(this.SELECTIONS);

//         self.selectVarY
//             .initOptions([
//                 {
//                     name: "x",
//                     value: "x"
//                 },
//                 {
//                     name: "y",
//                     value: "y"
//                 }
//             ])
//             .initDefault("y")
//             .initValueOnSelect(function (option) {
//                 self.resetVarY(option);
//             });

//         self.selectVarCircle = new Selections(this.SELECTIONS);

//         self.selectVarCircle
//             .initOptions([
//                 {
//                     name: "-- None --",
//                     value: "--none--"
//                 },
//                 {
//                     name: "x",
//                     value: "x"
//                 },
//                 {
//                     name: "y",
//                     value: "y"
//                 }
//             ])
//             .initDefault("--none--")
//             .initValueOnSelect(function (option) {
//                 if (option == "--none--") {
//                     self.circleScale = x => self.param.fixedRadius;
//                     self.resetPoint();
//                 }
//                 else {
//                     self.resetVarCircle(option);
//                 }

//             })

//         self.selectVarY.initSelection();
//         self.selectVarX.initSelection();
//         self.selectVarCircle.initSelection();

//         return self;

//     }

// }


// let SctChart = new Scatters("#scatter-plot-2");



// SctChart.initData([
//     {
//         data: {
//             x: 0,
//             y: AAA(0)
//         }
//     },
//     {
//         data: {
//             x: 1,
//             y: AAA(1)
//         }
//     },
//     {
//         data: {
//             x: 2,
//             y: AAA(2)
//         }
//     },
//     {
//         data: {
//             x: 31,
//             y: AAA(31)
//         }
//     },
//     {
//         data: {
//             x: 11,
//             y: AAA(11)
//         }
//     },
//     {
//         data: {
//             x: 21,
//             y: AAA(21)
//         }
//     },
// ]).initVarX("x").initVarY("y").initVarCircle("--none--")
//     .initChartArea().initSVG().initXAxis().initYAxis().initPoint().initSelections();
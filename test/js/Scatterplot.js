// https://d3-graph-gallery.com/graph/interactivity_button.html
// https://d3-graph-gallery.com/graph/scatter_basic.html


"use strict";



class ScatterPlot {

    constructor(ID) {

        this.ID = ID;

        this.param = {
            // set the dimensions and margins of the graph
            width: 500,
            height: 500,

            margin: { top: 30, right: 200, bottom: 30, left: 60 },

            valueMargin: { top: 50, right: 50, bottom: 10, left: 10 },

            fontSize: 12,
            axisLabelMargin: 7,

            minRadius: 5,
            textMargin: 5,

            circleRange: { min: 1, max: 30 }
        }

        this.param.svgWidth = this.param.width + this.param.margin.left + this.param.margin.right;

        this.param.svgHeight = this.param.height + this.param.margin.top + this.param.margin.bottom;

        this.data = {
            data: [],
            x: {
                max: 0,
                min: 0,
            },
            y: {
                max: 0,
                min: 0,
            },
            circle: {
                max: 0,
                min: 0,
            }
        }

        this.axis = {
            x: {
                scale: 0,
                call: 0,
                line: 0,
            },
            y: {
                scale: 0,
                call: 0,
                line: 0,
            }
        }

        this.scale = {
            x: d3.scaleLinear(),
            y: d3.scaleLinear(),
            circle: d3.scaleSqrt()
        }

        this.resetTransition = function(selection) {

            selection.transition("reset")
                .duration(500)
                .ease(d3.easeLinear);
    
            return selection;
    
        }

        return this;
    }

    setData(data) {
        this.data.data = data;
        return this;
    }

    setVarX(varX) {
        this.varX = varX;
        this.data.x.max = d3.max(this.data.data, d => d.data[this.varX]);
        this.data.x.min = d3.min(this.data.data, d => d.data[this.varX]);
        return this;
    }

    setVarY(varY) {
        this.varY = varY;
        this.data.y.max = d3.max(this.data.data, d => d.data[this.varY]);
        this.data.y.min = d3.min(this.data.data, d => d.data[this.varY]);
        return this;
    }

    setVarCircle(varCircle) {
        this.varCircle = varCircle;
        this.data.circle.max = d3.max(this.data.data, d => d.data[this.varCircle]);
        this.data.circle.min = d3.min(this.data.data, d => d.data[this.varCircle]);
        return this;
    }

    setId(id) {
        this.ID = id;
        return this;
    }

    setChartArea() {
        this.CHART = d3.select(this.ID)
            .append("div")
            .attr("id", "scatter-plot-chart");
        return this;
    }

    setSVG() {
        this.svg = this.CHART.append("svg")
            .attr("width", this.param.svgWidth)
            .attr("height", this.param.svgHeight)
            .append("g")
            .attr("transform", "translate(" + this.param.margin.left + "," + this.param.margin.top + ")");

        return this;
    }

    setXAxisLabel(callback = x => x) {
        // Add X axis label:
        this.xLabel = this.svg.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", this.param.width + this.param.axisLabelMargin)
            .attr("y", this.param.height)
            .attr("font-size", this.param.fontSize + "px")
            .text(callback(this.varX));

        return this;
    }

    setXAxisScale(scale = d3.scaleLinear().domain([0, this.data.x.max]).range([0, this.param.width])) {

        this.axis.x.scale = scale;
        return this;
    }

    setXAxisCall() {
        this.axis.x.call = d3.axisBottom().scale(this.axis.x.scale);
        return this;
    }

    setXAxisLine() {

        this.xAxis = this.axis.x.line = this.svg.append("g")
            .attr("transform", "translate(0," + this.param.height + ")")
            .call(this.axis.x.call)
            .attr("font-size", this.param.fontSize + "px");

        return this;
    }

    setXAxis() {
        this.setXAxisScale()
            .setXAxisCall()
            .setXAxisLine()
            .setXAxisLabel();

        return this;
    }

    setYAxisLabel(callback = x => x) {
        // Add Y axis label:
        this.yLabel = this.svg.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            // .attr("transform", "rotate(90)")
            .attr("x", this.param.axisLabelMargin)
            .attr("y", 0)
            .attr("font-size", this.param.fontSize + "px")
            .text(callback(this.varY));

        return this;
    }

    setYAxisScale(scale = d3.scaleLinear().domain([0, this.data.y.max]).range([this.param.height, 0])) {

        this.axis.y.scale = scale;

        return this;
    }

    setYAxisCall() {
        this.axis.y.call = d3.axisLeft().scale(this.axis.y.scale);

        return this;
    }

    setYAxisLine() {

        this.yAxis = this.axis.y.line = this.svg.append("g")
            .call(this.axis.y.call)
            .attr("font-size", this.param.fontSize + "px");

        return this;
    }

    setYAxis() {
        this.setYAxisScale()
            .setYAxisCall()
            .setYAxisLine()
            .setYAxisLabel();

        return this;
    }

    setPointInit() {
        // Add points

        this.points = this.svg.append('g')
            .selectAll(".scatter-point")
            .data(this.data.data)
            .enter()
            .append("g")
            .attr("class", "scatter-point")
            .style("cursor", "move");

        return this;
    }

    setPointCircle() {

        // For each point, add a circle
        this.points.append("circle")
            .attr("cx", (d) => {
                return this.axis.x.scale(d.data[this.varX])
            })
            .attr("cy", d => {

                return this.axis.y.scale(d.data[this.varY])
            }
            )
            .attr("r",
                (d) => {
                    // d.radius = circleScale(d.data[varCircle]);
                    d.radius = 10;
                    return d.radius;
                }
            )
            .style("fill", (d) => { return "#69b3a2" });

        return this;
    }

    setPointText() {
        // For each point, add a label
        this.points.append("text")
            .text(d => `${d.data[this.varX]} (${d.data[this.varX].toLocaleString('en-US')}; ${d.data[this.varY].toLocaleString('en-US')})`)
            .attr("x", d => {
                console.log(this.axis.x.scale(d.data[this.varX]))
                return d.radius + this.axis.x.scale(d.data[this.varX])
            })
            .attr("y", d => - d.radius + this.axis.y.scale(d.data[this.varY]))
            .attr("font-family", "sans-serif")
            .attr("font-size", this.param.fontSize + "px")
            .attr("fill", "purple");

        return this;
    }

    setPointOnClick() {
        this.points.on("click", pointOnClick);

        function pointOnClick(e, d) {
            d.selected = !d.selected;

            const point = d3.select(this);

            // bring element to forth
            this.parentNode.appendChild(this);

            if (d.selected) {
                point.select("circle").style("fill", "blue");
            }
            else {
                point.select("circle").style("fill", "#69b3a2");
            }

        };

        return this;
    }

    setPoint() {

        this.setPointInit()
            .setPointCircle()
            .setPointText()
            .setPointOnClick();

        return this;

    }

    resetVarX(varX) {
        this.varX = varX;
        this.data.x.max = d3.max(this.data.data, d => d.data[this.varX]);
        this.data.x.min = d3.min(this.data.data, d => d.data[this.varX]);
        this.resetXAxisLabel()
            .resetXAxisScale()
            .resetPoint()
        return this;
    }

    resetVarY(varY) {
        this.varY = varY;
        this.data.y.max = d3.max(this.data.data, d => d.data[this.varY]);
        this.data.y.min = d3.min(this.data.data, d => d.data[this.varY]);
        this.resetYAxisLabel()
            .resetYAxisScale()
            .resetPoint()
        return this;
    }

    resetXAxisLabel(callback = x => x) {

        this.xLabel
            .text(callback(this.varX));

        return this;
    }

    resetXAxisScale(scale = d3.scaleLinear().domain([0, this.data.x.max]).range([0, this.param.width])) {

        this.axis.x.scale = scale;

        this.resetXAxisCall();

        return this;
    }

    resetXAxisCall() {

        this.axis.x.call.scale(this.axis.x.scale);

        this.resetXAxisLine();

        return this;
    }

    resetXAxisLine() {

        this.xAxis
            .call(this.resetTransition)
            .call(this.axis.x.call);

        return this;
    }

    resetYAxisLabel(callback = x => x) {
        // Add Y axis label:
        this.yLabel
            .text(callback(this.varY));

        return this;
    }

    resetYAxisScale(scale = d3.scaleLinear().domain([0, this.data.y.max]).range([this.param.height, 0])) {

        this.axis.y.scale = scale;

        this.resetYAxisCall();

        return this;
    }

    resetYAxisCall() {
        this.axis.y.call.scale(this.axis.y.scale);

        this.resetYAxisLine();

        return this;
    }

    resetYAxisLine() {

        this.yAxis
            .call(this.resetTransition)
            .call(this.axis.y.call)

        return this;
    }

    resetPointCircle() {

        this.points.select("circle")
            .call(this.resetTransition)
            .attr("cx", (d) => this.axis.x.scale(d.data[this.varX]))
            .attr("cy", d => this.axis.y.scale(d.data[this.varY]))
            .attr("r", (d) => {
                // d.radius = circleScale(d.data[varCircle]);
                d.radius = 10;
                return d.radius;
            }
            )
            .style("fill", (d) => { return "#69b3a2" });

        return this;
    }

    resetPointText() {

        this.points.select("text")
            .text(d => `${d.data[this.varX]} (${d.data[this.varX].toLocaleString('en-US')}; ${d.data[this.varY].toLocaleString('en-US')})`)
            .attr("x", d => d.radius + this.axis.x.scale(d.data[this.varX]))
            .attr("y", d => - d.radius + this.axis.y.scale(d.data[this.varY]))

        return this;
    }

    resetPoint() {

        this.resetPointCircle()
            .resetPointText();

        return this;

    }

}

class Selections {

    constructor(selectionarea) {

        this.SELECTIONAREA = selectionarea;
        this.valueOnSelect = function (option) {

        }

    }

    setValueOnSelect(callback) {

        this.valueOnSelect = callback;

        return this;

    }

    setOptions(data) {

        this.options = data;

        return this;

    }

    setSelection() {

        this.setSelectionSelection()
            .setSelectionOptions()
            .setSelectionOnSelect();
    }

    setSelectionSelection() {

        this.selection = this.SELECTIONAREA.append("select");

        return this;
    }

    setSelectionOptions() {

        this.selection.selectAll("option")
            .data(this.options)
            .enter()
            .append("option")
            .text(function (d) { return d.name; })
            .attr("value", function (d) { return d.value; });

        return this;
    }

    setSelectionOnSelect() {

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

        super(ID);

        // create areas inside chart area
        this.SELECTIONS = d3.select(this.ID)
            .append("div")
            .attr("id", "#scatter-plot-selections");

        return this;

    }

    setSelections() {

        let self = this;

        self.selectVarX = new Selections(this.SELECTIONS);

        self.selectVarX
            .setOptions([
                {
                    name: "x",
                    value: "x"
                },
                {
                    name: "y",
                    value: "y"
                }
            ])
            .setValueOnSelect(function (option) {
                self.resetVarX(option);
                console.log("X");
            })
            .setSelection();

        self.selectVarY = new Selections(this.SELECTIONS);

        self.selectVarY
            .setOptions([
                {
                    name: "x",
                    value: "x"
                },
                {
                    name: "y",
                    value: "y"
                }
            ])
            .setValueOnSelect(function (option) {
                self.resetVarY(option);
                console.log("Y");
            })
            .setSelection();

        return self;

    }

}


let SctChart = new Scatters("#scatter-plot");

SctChart.setData([
    {
        data: {
            x: 1,
            y: 2
        }
    },
    {
        data: {
            x: 1,
            y: 22
        }
    },
    {
        data: {
            x: 31,
            y: 21
        }
    },
    {
        data: {
            x: 11,
            y: 12
        }
    },
    {
        data: {
            x: 21,
            y: 22
        }
    },
]).setVarX("x").setVarY("y").setVarCircle("x")
    .setChartArea().setSVG().setXAxis().setYAxis().setPoint().setSelections();
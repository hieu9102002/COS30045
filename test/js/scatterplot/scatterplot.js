
"use strict";

import { Axis } from "/test/js/scatterplot/axis.js"

export class _ScatterPlot {

    constructor(selection) {

        this.CHART = selection;

        this.render = {
            // set the dimensions and margins of the graph

            width: 550, height: 550,

            margin: { left: 200, top: 30, bottom: 30, right: 200 },

            padding: { left: 10, top: 10, bottom: 10, right: 10 },

            fontSize: 12,
            textMargin: 5,

            labelMargin: 7,

            fixedRadius: 5,

            circleRange: { min: 1, max: 30 },

            xLabel: "X Label",
            yLabel: "Y Label",

        }

        this.render.svgWidth = this.render.width + this.render.margin.left + this.render.margin.right;
        this.render.svgHeight = this.render.height + this.render.margin.top + this.render.margin.bottom;

        this.data = [];

        this.xAxis = new Axis();
        this.xAxis
            .orient("bottom")
            .scale("linear")
            .range([0, this.render.width])
            .padding([this.render.padding.left, this.render.padding.right]);
        this.xAxis.Axis.ticks(10)

        this.yAxis = new Axis();
        this.yAxis
            .orient("left")
            .scale("linear")
            .range([this.render.height, 0])
            .padding([this.render.padding.left, this.render.padding.right]);
        this.yAxis.Axis.ticks(10)

        this.yAxis.Scale.unknown(0);

        this.SVG = {};
        this.Points = {};
        this.xAxisLine = {};
        this.yAxisLine = {};
        this.xLabel = {};
        this.yLabel = {};

        this.valueAccessor = {
            text: d => d.data["country"],
            x: d => d.data["population"],
            y: d => d.data,
            circle: d => this.render.fixedRadius,
        };

        this.scaleCircle = x => x;

        this.xMinType = 0;
        this.yMinType = 0;
        this.xOrientType = "bottom";
        this.yOrientType = "left";

        return this;
    }

    drawScatterPLot() {

        this.#initSVG()
            .#initXAxisLine()
            .#initXAxisLabel()
            .#initYAxisLine()
            .#initYAxisLabel()
            .#initPointInit()
            .#drawPointEach()
            .#initPointEvents();

        return this;
    }

    #initSVG() {
        this.SVG = this.CHART.append("svg")
            .attr("width", this.render.svgWidth)
            .attr("height", this.render.svgHeight)
            .append("g")
            .attr("transform", "translate(" + this.render.margin.left + "," + this.render.margin.top + ")");

        return this;
    }

    #initXAxisLabel() {

        this.xLabel = this.SVG.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", this.render.width + this.render.labelMargin)
            .attr("y", this.render.height)
            .attr("font-size", this.render.fontSize + "px")
            .text(this.render.xLabel);

        return this;
    }

    #initXAxisLine() {

        this.xAxisLine = this.SVG.append("g")
            .attr("transform", "translate(0," + this.render.height + ")")
            .call(this.xAxis.Axis)
            .attr("font-size", this.render.fontSize + "px");

        return this;
    }

    #initYAxisLabel() {

        this.yLabel = this.SVG.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", this.render.labelMargin)
            .attr("y", 0)
            .attr("font-size", this.render.fontSize + "px")
            .text(this.render.yLabel);

        return this;
    }

    #initYAxisLine() {

        this.yAxisLine = this.SVG.append("g")
            .call(this.yAxis.Axis)
            .attr("font-size", this.render.fontSize + "px");

        return this;
    }

    #initPointInit() {

        return this;
    }

    #drawPointEach() {

        const self = this;

        self.Points = self.SVG.append('g')
            .selectAll(".scatter-point")
            .data(this.data)
            .enter()
            .append("g")
            .attr("class", "scatter-point")
            .style("cursor", "move");

        // if render is not a number, hide the point
        self.Points
            .attr("visibility", d => {
                if (isNaN(d.render.x) ||
                    isNaN(d.render.y) ||
                    isNaN(d.render.y)) {
                    return "hidden";
                }
                else return "visible";
            })

        // For each point, add a circle
        self.Points.append("circle")
            .attr("class", "scatter-circle")
            .attr("cx", d => d.render.x)
            .attr("cy", d => d.render.y)
            .attr("r", d => d.render.radius)
            .style("fill", d => { return "#69b3a2" });

        // For each point, add a label
        self.Points.append("text")
            .attr("class", "scatter-text")
            .text(d => d.render.text)
            .attr("x", d => d.render.x + d.render.radius)
            .attr("y", d => d.render.y - d.render.radius)
            .attr("font-family", "sans-serif")
            .attr("font-size", this.render.fontSize + "px")
            .attr("fill", "purple");

        self.Points.addAnnotations = function (point) {

            if (point.select(".scatter-line-x").empty()) {

                const x = point.append("g")
                    .attr("class", "scatter-line-x")

                x.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")

                    .attr("x1", d => d.render.x)
                    .attr("y1", self.render.height)
                    .attr("x2", d => d.render.x)
                    .attr("y2", d => d.render.y)

                x.append("text")
                    .attr("font-family", "sans-serif")


                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "text-after-edge")

                    .attr("font-size", self.render.fontSize + "px")
                    .attr("fill", "blue")


                    .attr("x", d => d.render.x)
                    .attr("y", self.render.height)

                    .text(d => self.valueAccessor.x(d).toLocaleString("en-US"))


                point.select(".scatter-text").raise()
                point.select(".scatter-circle").raise()
            }

            if (point.select(".scatter-line-y").empty()) {

                const y = point.append("g")
                    .attr("class", "scatter-line-y")

                y.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", 0)
                    .attr("y1", d => d.render.y)
                    .attr("x2", d => d.render.x)
                    .attr("y2", d => d.render.y)

                y.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", self.render.fontSize + "px")
                    .attr("fill", "blue")
                    .attr("dominant-baseline", "middle")
                    .attr("text-anchor", "end")
                    .attr("x", -10)
                    .attr("y", d => d.render.y)
                    .text(d => {
                        console.log(d, d.render, self.valueAccessor.x(d), self.valueAccessor.y(d))
                        return self.valueAccessor.y(d).toLocaleString("en-US")
                    })

                point.select(".scatter-text").raise()
                point.select(".scatter-circle").raise()

            }
        }

        self.Points.removeAnnotations = function (point) {

            if (!point.select(".scatter-line-x").empty()) {

                point.select(".scatter-line-x").remove()
            }

            if (!point.select(".scatter-line-y").empty()) {

                point.select(".scatter-line-y").remove()
            }
        }

        return self;

    }

    #initPointEvents() {

        const self = this;

        self.Points
            .on("click", pointOnClick)
            .on("mouseover", pointOnMouseOver)
            .on("mouseout", pointOnMouseOut)

        function pointOnClick(e, d) {

            d.render.selected = !d.render.selected;

            const point = d3.select(this);

            // bring element to forth
            this.parentNode.appendChild(this);

            if (d.render.selected) {

                point.select("circle")
                    .style("fill", "blue");

                self.Points.addAnnotations(point);
            }

            else {
                point.select("circle")
                    .style("fill", "#69b3a2");

                self.Points.removeAnnotations(point);
            }
        }

        function pointOnMouseOver(e, d) {

            const point = d3.select(this);

            if (!d.render.selected) {
                self.Points.addAnnotations(point);
            }
        }

        function pointOnMouseOut(e, d) {

            const point = d3.select(this);

            if (!d.render.selected) {
                self.Points.removeAnnotations(point);
            }
        }

        return self;
    }

    updateXAxisLabel() {

        this.xLabel
            .transition("select")
            .duration(500)
            .text(this.render.xLabel);

        return this;
    }

    updateXAxisLine() {

        this.xAxisLine
            .transition("select")
            .duration(500)
            .call(this.xAxis.Axis);

        return this;
    }

    updateYAxisLabel() {

        this.yLabel
            .transition("select")
            .duration(500)
            .text(this.render.yLabel);

        return this;
    }

    updateYAxisLine() {

        this.yAxisLine
            .transition("select")
            .duration(500)
            .call(this.yAxis.Axis);

        return this;
    }

    updatePoints() {

        // if render is not a number, hide the point
        this.Points
            .attr("visibility", d => {
                if (isNaN(d.render.x) ||
                    isNaN(d.render.y) ||
                    isNaN(d.render.y)) {
                    return "hidden";
                }
                else return "visible";
            })

        this.Points.select("circle")
            .transition("select")
            .duration(500)
            .attr("cx", d => d.render.x)
            .attr("cy", d => d.render.y)
            .attr("r", d => d.render.radius);

        this.Points.select("text")
            .transition("select")
            .duration(500)
            .text(d => d.render.text)
            .attr("x", d => d.render.x + d.render.radius)
            .attr("y", d => d.render.y - d.render.radius)

        this.Points.select(".scatter-line-x")
            .transition("select")
            .duration(500)
            .attr("x1", 0)
            .attr("y1", d => d.render.y)
            .attr("x2", d => d.render.x)
            .attr("y2", d => d.render.y)

        this.Points.select(".scatter-line-y")
            .transition("select")
            .duration(500)
            .attr("x1", d => d.render.x)
            .attr("y1", this.render.height)
            .attr("x2", d => d.render.x)
            .attr("y2", d => d.render.y)

        return this;
    }

    #domainType = {
        x: {
            min: "min",
            max: "max"
        },
        y: {
            min: "min",
            max: "max",
        }
    }

    #domainXMin() {

        switch (this.#domainType.x.min) {
            case "min":
            case "max":
            case "minmax":
                return d3.min(this.data, d => this.valueAccessor.x(d))
            default:
                return this.#domainType.x.min
        }
    }

    #domainXMax() {

        switch (this.#domainType.x.max) {
            case "min":
            case "max":
            case "minmax":
                return d3.max(this.data, d => this.valueAccessor.x(d))
            default:
                return this.#domainType.x.max
        }
    }

    #domainYMin() {

        switch (this.#domainType.y.min) {
            case "min":
            case "max":
            case "minmax":
                return d3.min(this.data, d => this.valueAccessor.y(d))
            default:
                return this.#domainType.y.min
        }
    }

    #domainYMax() {

        switch (this.#domainType.y.max) {
            case "min":
            case "max":
            case "minmax":
                return d3.max(this.data, d => this.valueAccessor.y(d))
            default:
                return this.#domainType.y.max
        }
    }

    domainXMin(type) {

        this.#domainType.x.min = type;
        this.xAxis.domain([this.#domainXMin(), this.#domainXMax()])

        return this;
    }

    domainXMax(type) {

        this.#domainType.x.max = type;
        this.xAxis.domain([this.#domainXMin(), this.#domainXMax()])

        return this;
    }

    domainYMin(type) {

        this.#domainType.y.min = type;
        this.yAxis.domain([this.#domainYMin(), this.#domainYMax()])

        return this;
    }

    domainYMax(type) {

        this.#domainType.y.max = type;
        this.yAxis.domain([this.#domainYMin(), this.#domainYMax()])

        return this;
    }

    #paddingType = {
        x: {
            min: 0,
            max: "max"
        },
        y: {
            min: 0,
            max: "max",
        }
    }

    #paddingXMin() {

        switch (this.#paddingType.x.min) {
            case "min":
            case "max":
            case "minmax":
                return this.render.padding.left
            default:
                return 0
        }
    }

    #paddingXMax() {

        switch (this.#paddingType.x.max) {
            case "min":
            case "max":
            case "minmax":
                return this.render.padding.right
            default:
                return 0
        }
    }

    #paddingYMin() {

        switch (this.#paddingType.y.min) {
            case "min":
            case "max":
            case "minmax":
                return this.render.padding.bottom
            default:
                return 0
        }
    }

    #paddingYMax() {

        switch (this.#paddingType.y.max) {
            case "min":
            case "max":
            case "minmax":
                return this.render.padding.top
            default:
                return 0
        }
    }

    paddingXMin(type) {

        this.#paddingType.x.min = type;
        this.xAxis.padding([this.#paddingXMin(), this.#paddingXMax()])

        return this;
    }

    paddingXMax(type) {

        this.#paddingType.x.max = type;
        this.xAxis.padding([this.#paddingXMin(), this.#paddingXMax()])

        return this;
    }

    paddingYMin(type) {

        this.#paddingType.y.min = type;
        this.yAxis.padding([this.#paddingYMax(), this.#paddingYMin()])

        return this;
    }

    paddingYMax(type) {

        this.#paddingType.y.max = type;
        this.yAxis.padding([this.#paddingYMax(), this.#paddingYMin()])

        return this;
    }

    Data(data) {

        this.data = data;

        this.xAxis.domain([this.#domainXMin(), this.#domainXMax()])
            .padding([this.#paddingXMin(), this.#paddingXMax()]);

        this.yAxis.domain([this.#domainYMin(), this.#domainYMax()])
            .padding([this.#paddingYMax(), this.#paddingYMin()]);

        for (let d of this.data) {
            if (d.render == undefined) {
                d.render = {}
            }
            d.render.selected = false;
            d.render.text = this.valueAccessor.text(d);
            d.render.x = this.xAxis.Scale(this.valueAccessor.x(d));
            d.render.y = this.yAxis.Scale(this.valueAccessor.y(d));
            d.render.radius = this.scaleCircle(this.valueAccessor.circle(d));
            console.log("MASTER:,", d, this.yAxis)
        }


        return this;
    }

    DataText(accessor) {
        this.valueAccessor.text = accessor;
        this.updateRender()
            .updatePoints();
        return this;
    }

    DataX(accessor) {
        this.valueAccessor.x = accessor;
        this.xAxis.domain([this.#domainXMin(), this.#domainXMax()])
            .padding([this.#paddingXMin(), this.#paddingXMax()]);
        this.updateRender()
            .updatePoints()
            .updateXAxisLine();
        return this;
    }

    DataY(accessor) {
        this.valueAccessor.y = accessor;
        this.yAxis.domain([this.#domainYMin(), this.#domainYMax()])
            .padding([this.#paddingYMax(), this.#paddingYMin()]);
        this.updateRender()
            .updatePoints()
            .updateYAxisLine();
        return this;
    }

    DataCircle(accessor) {
        this.valueAccessor.circle = accessor;
        this.updateRender()
            .updatePoints();
        return this;
    }

    ScaleCircle(scale) {
        this.scaleCircle = scale;
        this.updateRender()
            .updatePoints();
        return this;
    }

    updateRender() {

        for (let d of this.data) {
            d.render.text = this.valueAccessor.text(d);
            d.render.x = this.xAxis.Scale(this.valueAccessor.x(d));
            d.render.y = this.yAxis.Scale(this.valueAccessor.y(d));
            d.render.radius = this.scaleCircle(this.valueAccessor.circle(d));

        }

        return this;
    }

}
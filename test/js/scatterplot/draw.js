
"use strict";

import { Axis } from "/test/js/scatterplot/axis.js"

export class _ScatterPlot {

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
            .attr("class", "scatter-circle")
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

    // initPointOnClick() {

    //     this.points.on("click", pointOnClick);

    //     function pointOnClick(e, d) {

    //         d.render.selected = !d.render.selected;

    //         const point = d3.select(this);

    //         // bring element to forth
    //         this.parentNode.appendChild(this);

    //         if (d.render.selected) {
    //             point.select("circle").style("fill", "blue");
    //         }

    //         else {
    //             point.select("circle").style("fill", "#69b3a2");
    //         }

    //     };

    //     return this;
    // }

}
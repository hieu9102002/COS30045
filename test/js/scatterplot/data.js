
"use strict";

import { _ScatterPlotReset } from "./resetdraw.js";

export class _ScatterPlotData extends _ScatterPlotReset {
    constructor(selection) {
        super(selection);

        this.valueAccessor = {
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
        this.xAxis.domain([0, d3.max(this.data, d => this.valueAccessor.x(d))])
            .paddingStart(0);
        this.yAxis.domain([0, d3.max(this.data, d => this.valueAccessor.y(d))])
            .paddingStart(0);
        this.initRender();


        return this;
    }

    initRender() {

        for (let d of this.data) {
            if (d.render == undefined) {
                d.render = {}
            }
            d.render.selected = false;
            d.render.text = this.valueAccessor.text(d);
            d.render.x = this.xAxis.Scale(this.valueAccessor.x(d));
            d.render.y = this.yAxis.Scale(this.valueAccessor.y(d));
            d.render.radius = this.scaleCircle(this.valueAccessor.circle(d));
        }

        return this;
    }

    resetAccessorText(accessor) {
        this.valueAccessor.text = accessor;
        this.resetRender()
            .resetPointCircle()
            .resetPointText();
        return this;
    }

    resetAccessorX(accessor) {
        this.valueAccessor.x = accessor;
        this.xAxis.domain([0, d3.max(this.data, d => this.valueAccessor.x(d))]);
        this.resetRender()
            .resetPointCircle()
            .resetPointText()
            .resetXAxisLine();
        return this;
    }

    resetAccessorY(accessor) {
        this.valueAccessor.y = accessor;
        this.yAxis.domain([0, d3.max(this.data, d => this.valueAccessor.y(d))]);

        this.resetRender()
            .resetPointCircle()
            .resetPointText()
            .resetYAxisLine();
        return this;
    }

    resetAccessorCircle(accessor) {
        this.valueAccessor.circle = accessor;
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
            d.render.text = this.valueAccessor.text(d);
            d.render.x = this.xAxis.Scale(this.valueAccessor.x(d));
            d.render.y = this.yAxis.Scale(this.valueAccessor.y(d));
            d.render.radius = this.scaleCircle(this.valueAccessor.circle(d));

        }

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
            .initPointAnnotationLines()
            .initPointOnClick()

        return this;

    }

    initPointAnnotationLines() {
        // add annotation line
        this.points
            .append("line")
            .attr("class", "scatter-line")
            .attr("stroke-width", 0)
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4")
            // start of line
            .attr("x1", 0)
            .attr("y1", d => d.render.y)
            // end of line
            .attr("x2", d => d.render.x)
            .attr("y2", d => d.render.y)

        this.points
            .append("line")
            .attr("class", "scatter-line")
            .attr("stroke-width", 0)
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4")
            // start of line
            .attr("x1", d => d.render.x)
            .attr("y1", this.param.height)
            // end of line
            .attr("x2", d => d.render.x)
            .attr("y2", d => d.render.y)

        return this;
    }

    initPointOnClick() {
        // super.initPointOnClick();

        let self = this;

        self.points.on("click", function (e, d) {
            d.render.selected = !d.render.selected;

            console.log(d);

            let point = d3.select(this);

            // bring element to forth
            this.parentNode.appendChild(this);

            if (d.render.selected) {
                console.log(d.render.selected, point.select("circle"));
                point.select("circle")
                    .style("fill", "blue");
                console.log(d.render);
                point.selectAll("line").attr("stroke-width", 1).style("fill", "#69b3a2");
            }

            else {
                point.select("circle").style("fill", "#69b3a2");
                console.log(d.render);
                point.selectAll("line").attr("stroke-width", 0).style("fill", "#69b3a2");
            }
        });

        return self;
    }


}
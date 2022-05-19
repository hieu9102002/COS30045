
"use strict";

import { _ScatterPlot } from "./draw.js";

export class _ScatterPlotReset extends _ScatterPlot {

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
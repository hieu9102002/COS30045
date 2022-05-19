
"use strict";

import { ScatterPlot } from "./resetdata.js"
import { Selections } from "./selections.js"


export class Scatters extends ScatterPlot {

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
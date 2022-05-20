
"use strict";

import { _ScatterPlot } from "./scatterplot.js";
import { Selections } from "./selections.js"


export class Scatters extends _ScatterPlot {

    constructor(ID) {

        // create areas inside chart area
        let SELECTIONS = d3.select(ID)
            .append("div")
            .attr("id", "scatter-plot-selections");

        super(SELECTIONS);

        this.SELECTIONS = SELECTIONS;

        this.optionX = [
            {
                name: "x",
                value: "x"
            },
            {
                name: "y",
                value: "y"
            }
        ]

        this.optionY = [
            {
                name: "x",
                value: "x"
            },
            {
                name: "y",
                value: "y"
            }
        ]

        this.defaultX = "x"

        this.defaultY = "y"

        this.optionCircle = [
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
        ]

        return this;

    }

    OptionX(x) {
        this.optionX = x.slice();
        return this;
    }

    OptionY(y) {
        this.optionY = y.slice();
        return this;
    }

    OptionCircle(circle) {
        this.optionCircle = circle.slice()
        this.optionCircle.unshift({
            name: "--None--",
            value: "--none--"
        });
        return this;
    }

    DefaultX(x) {
        this.defaultX = x;
        return this;
    }

    DefaultY(y) {
        this.defaultY = y;
        return this;
    }

    drawSelections() {

        let self = this;

        self.selectVarX = new Selections(self.SELECTIONS)
            .OptionsData(self.optionX)
            .DefaultValue(self.defaultX)
            .initValueOnSelect(function (option) {
                if (d3.min(self.data, d => d.data[option]) < 0) {
                    self.domainXMin("min")
                        .paddingXMin("min")
                }
                else {
                    self.domainXMin(0)
                        .paddingXMin(0)
                }
                self.DataX(d => d.data[option]);
            });


        self.selectVarY = new Selections(self.SELECTIONS);

        self.selectVarY
            .OptionsData(self.optionY)
            .DefaultValue(self.defaultY)
            .initValueOnSelect(function (option) {

                if (d3.min(self.data, d => d.data[option]) < 0) {
                    self.domainYMin("min")
                        .paddingYMin("min")
                }
                else {
                    self.domainYMin(0)
                        .paddingYMin(0)
                }

                self.DataY(d => d.data[option]);
            });

        self.selectVarCircle = new Selections(self.SELECTIONS);

        self.selectVarCircle
            .OptionsData(self.optionCircle)
            .DefaultValue("--none--")
            .initValueOnSelect(function (option) {
                if (option == "--none--") {
                    console.log(option)
                    self.DataCircle(d => self.render.fixedRadius)
                        .ScaleCircle(d => d);
                }
                else {

                    self.DataCircle(d => d.data[option])
                        .ScaleCircle(d3.scale("sqrt")
                            .domain([
                                d3.min(self.data, d => d.data[option]),
                                d3.max(self.data, d => d.data[option])
                            ])
                            .range([
                                self.render.circleRange.min,
                                self.render.circleRange.max
                            ]));
                }

            });

        self.selectXScale = new Selections(self.SELECTIONS);

        self.selectXScale
            .OptionsData([
                {
                    name: "X Linear",
                    value: "linear"
                },
                {
                    name: "X Log",
                    value: "symlog"
                }
            ])
            .DefaultValue("linear")
            .initValueOnSelect(function (option) {

                console.log(self.xAxis)

                self.xAxis.scale(option);

                self.xAxis.Axis.ticks(10);

                self.updateRender()
                    .updateXAxisLine()
                    .updateYAxisLine()
                    .updatePoints();

                console.log(self.yAxis)
            });

        self.selectYScale = new Selections(self.SELECTIONS);

        self.selectYScale
            .OptionsData([
                {
                    name: "Y Linear",
                    value: "linear"
                },
                {
                    name: "Y Log",
                    value: "symlog"
                }
            ])
            .DefaultValue("linear")
            .initValueOnSelect(function (option) {

                console.log(self.yAxis)

                self.yAxis.scale(option);

                self.yAxis.Axis.ticks(10);

                self.updateRender()
                    .updateXAxisLine()
                    .updateYAxisLine()
                    .updatePoints();

                console.log(self.yAxis)
            });

        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarCircle.DrawSelection();
        self.selectXScale.DrawSelection();
        self.selectYScale.DrawSelection();

        return self;

    }

}
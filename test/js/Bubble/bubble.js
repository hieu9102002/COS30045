
"use strict"

import { BubbleDraw } from "./bubbledraw.js"
import { Selections } from "./selections.js"


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

    return scaleTypes[type];
}

class BubbleSelection extends BubbleDraw {
    constructor(info, data, x, y, z, t, id = "#scatter-plot") {

        super(info, data, x, y, z, t, id);

        this.infoarray = Object.values(this.info).sort((a, b) => a["T"] - b["T"]);

        this.SELECTIONS = d3.select(id)
            .append("div")
            .attr("id", "scatter-plot-selections");

        this.DrawSelections()

        return this;
    }

    DrawSelections() {

        const self = this;

        self.selectVarX = new Selections(self.SELECTIONS)
        self.selectVarX
            .OptionsData(self.infoarray.filter(d => d.type == "metric"))
            .DefaultValue(self.x)
            .OnSelect(function (option) {
                self.updateX(option).updateDrawPlot()
            });


        self.selectVarY = new Selections(self.SELECTIONS);
        self.selectVarY
            .OptionsData(self.infoarray.filter(d => d.type == "metric" && ["renewables_share_energy", "renewables_consumption"].includes(d.value)))
            .DefaultValue(self.y)
            .OnSelect(function (option) {

                self.updateY(option).updateDrawPlot()
            });

        self.selectVarZ = new Selections(self.SELECTIONS);
        self.selectVarZ
            .OptionsData(self.infoarray.filter(d => d.type == "metric" && d.value == "area" && +d.lower == 0))
            .DefaultValue(self.z)
            .OnSelect(function (option) {

                self.updateZ(option).updateDrawPlot()
            });

        self.selectScaleX = new Selections(self.SELECTIONS);
        self.selectScaleX
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
            .OnSelect(function (option) {

                self.updateScaleX(d3.scale(option)).updateDrawPlot()
            });

        self.selectScaleY = new Selections(self.SELECTIONS);
        self.selectScaleY
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
            .OnSelect(function (option) {

                self.updateScaleY(d3.scale(option)).updateDrawPlot()
            });

        self.selectLowerX = new Selections(self.SELECTIONS);
        self.selectLowerX
            .OptionsData([
                {
                    name: "X Lower",
                    value: "lower"
                },
                {
                    name: "X Min",
                    value: "min"
                }
            ])
            .DefaultValue("min")
            .OnSelect(function (option) {

                if (option == "lower" && self.info[self.x].lower != undefined) {
                    self.domainXMin = (data) => self.info[self.x].lower;
                }

                else {
                    self.domainXMin = (data) => d3.min(data, self.dataX);
                }

                self.updateDomainX((data) => [self.domainXMin(data), self.domainXMax(data)])
                    .updateDrawPlot()
            });

        self.selectUpperX = new Selections(self.SELECTIONS);
        self.selectUpperX
            .OptionsData([
                {
                    name: "X Upper",
                    value: "upper"
                },
                {
                    name: "X Max",
                    value: "max"
                }
            ])
            .DefaultValue("max")
            .OnSelect(function (option) {

                if (option == "upper" && self.info[self.x].upper != undefined) {
                    self.domainXMax = (data) => self.info[self.x].upper;
                }

                else {
                    self.domainXMax = (data) => d3.max(data, self.dataX);
                }

                self.updateDomainX((data) => [self.domainXMin(data), self.domainXMax(data)])
                    .updateDrawPlot()
            });

        self.selectLowerY = new Selections(self.SELECTIONS);
        self.selectLowerY
            .OptionsData([
                {
                    name: "Y Lower",
                    value: "lower"
                },
                {
                    name: "Y Min",
                    value: "min"
                }
            ])
            .DefaultValue("min")
            .OnSelect(function (option) {

                if (option == "lower" && self.info[self.y].lower != undefined) {
                    self.domainYMin = (data) => self.info[self.y].lower;
                }

                else {
                    self.domainYMin = (data) => d3.min(data, self.dataY);
                }

                self.updateDomainY((data) => [self.domainYMin(data), self.domainYMax(data)])
                    .updateDrawPlot()
            });

        self.selectUpperY = new Selections(self.SELECTIONS);
        self.selectUpperY
            .OptionsData([
                {
                    name: "Y Upper",
                    value: "upper"
                },
                {
                    name: "Y Max",
                    value: "max"
                }
            ])
            .DefaultValue("max")
            .OnSelect(function (option) {

                if (option == "upper" && self.info[self.y].upper != undefined) {
                    self.domainYMax = (data) => self.info[self.y].upper;
                }

                else {
                    self.domainYMax = (data) => d3.max(data, self.dataY);
                }

                self.updateDomainY((data) => [self.domainYMin(data), self.domainYMax(data)])
                    .updateDrawPlot()
            });



        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarZ.DrawSelection();
        self.selectScaleX.DrawSelection();
        self.selectScaleY.DrawSelection();
        self.selectLowerX.DrawSelection();
        self.selectUpperX.DrawSelection();
        self.selectLowerY.DrawSelection();
        self.selectUpperY.DrawSelection();

        return self;

    }
}

Promise.all([
    d3.json("./data/owid/owid.json"),
    d3.json("./data/owid/info.json"),
]).then(function (files) {
    const jsondata = files[0]
    const infodata = files[1]
    let DATA = jsondata.map(d => ({ data: d }));

    console.log(DATA)

    let x = new BubbleSelection(infodata, DATA, "area", "renewables_share_energy", "area", "IncomeGroup")

}).catch(function (err) {
    console.error(err);
})

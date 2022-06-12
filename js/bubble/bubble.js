
"use strict"

import { BubbleView } from "./bubbleview.js"
import { Selections } from "./utils.js"


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

class BubbleSelection extends BubbleView {
    constructor(info, data, x, y, z, t, id = "#bubble-plot") {

        super(info, data, x, y, z, t, id);

        this.infoarray = Object.values(this.info).sort((a, b) => a["T"] - b["T"]);

        this.SELECTIONS = d3.select("#bubble-plot-selections")

        this.DrawSelections()

        return this;
    }

    DrawSelections() {

        const self = this;

        self.selectVarX = new Selections(self.SELECTIONS, "X axis")
        self.selectVarX
            .OptionsData(self.infoarray.filter(d => d.type == "metric"
                && [
                    "area",
                    "population",
                    "gdp",
                    "gdp_per_captia",
                    "coal_production",
                    "electricity_demand",
                    "electricity_generation",
                    "fossil_fuel_consumption",
                    "gas_production",
                    "greenhouse_gas_emissions",
                    "oil_production"
                ].includes(d.value)
            ))
            .DefaultValue(self.x)
            .OnSelect(function (option) {
                self.updateX(option).updateDrawPlot()
            });


        self.selectVarY = new Selections(self.SELECTIONS, "Y axis");
        self.selectVarY
            .OptionsData(self.infoarray.filter(d => d.type == "metric"
                && [
                    "renewables_share_energy",
                    "renewables_share_elec",
                    "renewables_consumption",
                    "renewables_electricity"
                ].includes(d.value)))
            .DefaultValue(self.y)
            .OnSelect(function (option) {

                self.updateY(option).updateDrawPlot()
            });

        self.selectVarZ = new Selections(self.SELECTIONS, "Circle Area");
        self.selectVarZ
            .OptionsData(self.infoarray.filter(d => d.type == "metric"
                && [
                    "area",
                    "population",
                    "gdp",
                    "gdp_per_capita",
                    "greenhouse_gas_emissions",
                    "primary_energy_consumption"
                ].includes(d.value)
                && +d.lower == 0)
            )
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

        self.selectVarT = new Selections(self.SELECTIONS, "Colour (Groups)");
        self.selectVarT
            .OptionsData(self.infoarray.filter(d => d.type == "categorical" &&
                [
                    "group_is_USA",
                    "group_OWID_Continent",
                    "group_WHO_Region",
                    "group_WB_incomeLevel",
                    "group_WB_lendingType"
                ].includes(d.value)
            ))
            .DefaultValue(self.t)
            .OnSelect(function (option) {

                self.updateT(option).updateDrawPlot()
            });

        d3.select("#bubble-radius-range-max").on("change", () => {
            self.updateDrawPlot()
        })
        d3.select("#bubble-radius-range-min").on("change", () => {
            self.updateDrawPlot()
        })


        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarZ.DrawSelection();
        self.selectVarT.DrawSelection();
        // self.selectScaleX.DrawSelection();
        // self.selectScaleY.DrawSelection();
        // self.selectLowerX.DrawSelection();
        // self.selectUpperX.DrawSelection();
        // self.selectLowerY.DrawSelection();
        // self.selectUpperY.DrawSelection();

        return self;

    }
}


Promise.all([
    d3.json("./data/countries/final/data.json"),
    d3.json("./data/countries/info/info.json"),
]).then(function (files) {
    const jsondata = files[0]
    const infodata = files[1]
    let DATA = jsondata.filter(d => d.year == 2019).map((d, i) => ({ id: i, data: d }));

    let x = new BubbleSelection(infodata, DATA, "gdp", "renewables_share_energy", "area", "group_is_USA")

}).catch(function (err) {
    console.error(err);
})

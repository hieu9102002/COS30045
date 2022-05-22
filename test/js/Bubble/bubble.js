
"use strict"

import { BubbleDraw } from "./bubbledraw.js"
import { Selections } from "./selections.js"

class BubbleSelection extends BubbleDraw {
    constructor(info, data, x, y, z, t, id = "#scatter-plot") {

        super(data, x, y, z, t, id);

        this.info = info;

        this.SELECTIONS = d3.select(id)
            .append("div")
            .attr("id", "scatter-plot-selections");

        this.DrawSelections()

        return this;
    }

    DrawSelections() {

        let self = this;

        self.selectVarX = new Selections(self.SELECTIONS)
        self.selectVarX
            .OptionsData(self.info)
            .DefaultValue(self.x)
            .OnSelect(function (option) {
                self.updateX(option).updateDrawPlot()
            });


        self.selectVarY = new Selections(self.SELECTIONS);
        self.selectVarY
            .OptionsData(self.info)
            .DefaultValue(self.y)
            .OnSelect(function (option) {

                self.updateY(option).updateDrawPlot()
            });

        self.selectVarZ = new Selections(self.SELECTIONS);
        self.selectVarZ
            .OptionsData(self.info)
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
            .DefaultValue("symlog")
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
            .DefaultValue("symlog")
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

                if(option == "lower") {
                    self.domainXMin = (data) => 0;
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
    
                    if(option == "upper") {
                        self.domainXMax = (data) => 100;
                    }
    
                    else {
                        self.domainXMax = (data) => d3.max(data, self.dataX);
                    }

                    self.updateDomainX((data) => [self.domainXMin(data), self.domainXMax(data)])
                        .updateDrawPlot()
                });



        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarZ.DrawSelection();
        self.selectScaleX.DrawSelection();
        self.selectScaleY.DrawSelection();
        self.selectLowerX.DrawSelection();
        self.selectUpperX.DrawSelection();

        return self;

    }
}

Promise.all([
    d3.json("./data/owid/owid.json"),
    d3.json("./data/owid/owidname.json"),
]).then(function (files) {
    const jsondata = files[0]
    const namedata = files[1]
    let DATA = jsondata.map(d => ({ data: d }));

    console.log(DATA)

    let x = new BubbleSelection(namedata, DATA, "gdp", "renewables_share_energy", "population", "country")

}).catch(function (err) {
    console.error(err);
})

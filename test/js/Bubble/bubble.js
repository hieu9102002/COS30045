
"use strict"

import { BubbleDraw } from "./bubbledraw.js"
import { Selections } from "./selections.js"

class BubbleSelection extends BubbleDraw {
    constructor(namevalues, data, x, y, z, t, id = "#scatter-plot") {

        super(data, x, y, z, t, id);

        this.namevalues = namevalues;

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
            .OptionsData(self.namevalues)
            .DefaultValue(self.x)
            .OnSelect(function (option) {
                self.updateX(option).updateDrawPlot()
            });


        self.selectVarY = new Selections(self.SELECTIONS);
        self.selectVarY
            .OptionsData(self.namevalues)
            .DefaultValue(self.y)
            .OnSelect(function (option) {

                self.updateY(option).updateDrawPlot()
            });

        self.selectVarZ = new Selections(self.SELECTIONS);
        self.selectVarZ
            .OptionsData(self.namevalues)
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



        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarZ.DrawSelection();
        self.selectScaleX.DrawSelection();
        self.selectScaleY.DrawSelection();

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

    let x = new BubbleSelection(namedata, DATA, "gdp", "renewables_share_energy", "population", "year")

}).catch(function (err) {
    console.error(err);
})

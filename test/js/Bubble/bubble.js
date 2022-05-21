
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



        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();
        self.selectVarZ.DrawSelection();

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

    let x = new BubbleSelection(namedata, DATA, "gdp", "renewables_share_energy", "population", "country")

}).catch(function (err) {
    console.error(err);
})

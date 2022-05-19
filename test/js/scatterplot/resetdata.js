
"use strict";

import { _ScatterPlotData } from "./data.js"

export class ScatterPlot extends _ScatterPlotData {
    constructor(selection) {
        super(selection);

        this.valueAccessor.text = d => d.data.x;
        this.valueAccessor.x = d => d.data.x;
        this.valueAccessor.y = d => d.data.y;

        this.scaleCircle = d => d;

        return this;
    }
}

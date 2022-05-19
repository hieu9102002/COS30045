
"use strict";

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

    return scaleTypes[type].unknown(0);
}

export class Axis {
    constructor() {

        this._orient = "left";
        this._scale = "linear";
        this._domain = [1, 2];
        this._renderdomain = [1, 2];
        this._range = [1, 2];
        this._padding = [0, 0];

        this.Scale = d3.scale("linear").domain(this._domain).range(this._range);
        this.Axis = d3.axis("left").scale(this.Scale);

        return this;
    }

    scale(type) {

        this._scale = type;

        this.Scale = d3.scale(this._scale).domain(this._renderdomain).range(this._range);

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain).range(this._range);

        this.Axis.scale(this.Scale);

        return this;
    }

    orient(orient) {

        this._orient = orient;

        this.Axis = d3.axis(this._orient).scale(this.Scale);

        return this;
    }

    domain(domain) {

        this._domain = domain;

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    domainMin(min) {

        this._domain[0] = min;

        this.domain(this._domain);

        return this;
    }

    domainMax(max) {

        this._domain[this._domain.length - 1] = max;

        this.domain(this._domain);

        return this;
    }

    range(range) {

        this._range = range;

        this._renderdomain = this._applyPadding();

        this.Scale.range(this._range).domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    rangeStart(start) {

        this._range[0] = start;

        this.range(this._range);

        return this;
    }

    rangeEnd(end) {

        this._range[this._range.length - 1] = end;

        this.range(this._range);

        return this;
    }

    paddingStart(start) {

        this._padding[0] = start;

        this.padding(this._padding);

        return this;
    }

    paddingEnd(end) {

        this._padding[this._padding.length - 1] = end;

        this.padding(this._padding);

        return this;
    }

    padding(padding) {

        this._padding = padding;

        this._renderdomain = this._applyPadding();

        this.Scale.domain(this._renderdomain);

        this.Axis.scale(this.Scale);

        return this;
    }

    _applyPadding() {

        this._renderdomain = this._domain.slice();

        let rangeTemp = this._range.slice();


        if (this._range[0] > this._range.at(-1)) {
            rangeTemp[0] = this._range[0] - this._padding[0];
            rangeTemp[rangeTemp.length - 1] = this._range[this._range.length - 1] + this._padding[1];
        }
        else {
            rangeTemp[0] = this._range[0] + this._padding[0];
            rangeTemp[rangeTemp.length - 1] = this._range[this._range.length - 1] - this._padding[1];
        }

        let scaleTemp = this.Scale.copy().domain(this._domain).range(rangeTemp);
        this._renderdomain[0] = scaleTemp.invert(this._range[0]);
        this._renderdomain[this._renderdomain.length - 1] = scaleTemp.invert(this._range.at(-1));

        return this._renderdomain;
    }
}

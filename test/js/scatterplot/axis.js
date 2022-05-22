
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

    return scaleTypes[type];
}

export class Axis {

    constructor(orient = "left", scale = "linear", domain = [1, 2], range = [1, 2], padding = [0, 0], applypadding = false) {

        this._orient = orient;
        this._scale = scale;
        this._domain = domain.slice();
        this._renderdomain = domain.slice();
        this._applypadding = applypadding;
        this._range = range.slice();
        this._padding = padding.slice();

        this.Scale = d3.scale("linear").domain(this._domain).range(this._range);
        this.Axis = d3.axis(this._orient).scale(this.Scale);

        return this;
    }

    #renderdomain() {

        if(this._applypadding) {

            this._renderdomain = this.#applyPadding();
            
            return this._renderdomain;
        }
        
        else {
            
            return this._domain;
        }
    }

    applypadding(applypadding) {

        this._applypadding = applypadding;

        return this;
        
    }

    scale(type, updateScale = true, updateAxis = true) {

        this._scale = type;

        if(!updateScale) return this;

        this.Scale = d3.scale(this._scale).domain(this.#renderdomain()).range(this._range);

        if(!updateAxis) return this;

        this.Axis.scale(this.Scale);

        return this;
    }

    orient(orient, updateAxis = true) {

        this._orient = orient;

        if(!updateAxis) return this;

        this.Axis = d3.axis(this._orient).scale(this.Scale);

        return this;
    }

    domain(domain, updateScale = true, updateAxis = true) {

        this._domain = domain;

        if(!updateScale) return this;

        this.Scale.domain(this.#renderdomain());

        if(!updateAxis) return this;

        this.Axis.scale(this.Scale);

        return this;
    }

    domainMin(min, updateScale = true, updateAxis = true) {

        this._domain[0] = min;

        this.domain(this._domain, updateScale, updateAxis);

        return this;
    }

    domainMax(max, updateScale = true, updateAxis = true) {

        this._domain[this._domain.length - 1] = max;

        this.domain(this._domain, updateScale, updateAxis);

        return this;
    }

    range(range, updateScale = true, updateAxis = true) {

        this._range = range;

        if(!updateScale) return this;

        this.Scale.range(this._range).domain(this.#renderdomain());

        if(!updateAxis) return this;

        this.Axis.scale(this.Scale);

        return this;
    }

    rangeStart(start, updateScale = true, updateAxis = true) {

        this._range[0] = start;

        this.range(this._range, updateScale, updateAxis);

        return this;
    }

    rangeEnd(end, updateScale = true, updateAxis = true) {

        this._range[this._range.length - 1] = end;

        this.range(this._range, updateScale, updateAxis);

        return this;
    }

    padding(padding, updateScale = true, updateAxis = true) {

        this._padding = padding;

        if(!updateScale) return this;

        this.Scale.domain(this.#renderdomain());

        if(!updateAxis) return this;

        this.Axis.scale(this.Scale);

        return this;
    }

    paddingStart(start, updateScale = true, updateAxis = true) {

        this._padding[0] = start;

        this.padding(this._padding, updateScale, updateAxis);

        return this;
    }

    paddingEnd(end, updateScale = true, updateAxis = true) {

        this._padding[this._padding.length - 1] = end;

        this.padding(this._padding, updateScale, updateAxis);

        return this;
    }

    #applyPadding() {

        this._renderdomain = this._domain.slice();

        if(!this._applypadding) return this._renderdomain;

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

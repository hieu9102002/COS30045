// https://d3-graph-gallery.com/graph/bubble_template.html
// https://d3-graph-gallery.com/graph/scatter_buttonXlim.html
// https://d3-graph-gallery.com/graph/interactivity_brush.html
// https://d3-graph-gallery.com/graph/interactivity_zoom.html

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

    return scaleTypes[type.toLowerCase()];
}

class BubbleDataInit {

    constructor(info, data, formatted = true) {

        if (!formatted) {
            this.dataset = data.map(d => ({ data: d }))
            this.data = data.map(d => ({ data: d }))
        }

        else {
            this.dataset = data
            this.data = data.slice()
        }

        this.info = info

        return this;
    }
}

class BubbleData extends BubbleDataInit {

    constructor(info, data, x, y, z, t) {
        super(info, data);

        this.x = x;
        this.y = y;
        this.z = z;
        this.t = t;

        this.dataX = d => d.data[this.x];
        this.dataY = d => d.data[this.y];
        this.dataZ = d => d.data[this.z];
        this.dataT = d => d.data[this.t];


        return this;
    }

    updateData(data) {
        this.dataset = data;
        this.dataX = d => d.data[this.x];
        this.dataY = d => d.data[this.y];
        this.dataZ = d => d.data[this.z];
        this.dataT = d => d.data[this.t];
        return this;
    }

    updateX(x) { this.x = x; this.dataX = d => d.data[this.x]; return this; }
    updateY(y) { this.y = y; this.dataY = d => d.data[this.y]; return this; }
    updateZ(z) { this.z = z; this.dataZ = d => d.data[this.z]; return this; }
    updateT(t) { this.t = t; this.dataT = d => d.data[this.t]; return this; }
}

class BubbleDomain extends BubbleData {

    constructor(info, data, x, y, z, t) {

        super(info, data, x, y, z, t);

        this.domainXMax = (data) => d3.max(data, this.dataX);
        this.domainYMax = (data) => d3.max(data, this.dataY);
        this.domainZMax = (data) => d3.max(data, this.dataZ);

        this.domainXMin = (data) => d3.min(data, this.dataX);
        this.domainYMin = (data) => d3.min(data, this.dataY);

        this.domainX = (data) => [this.domainXMin(data), this.domainXMax(data)];
        this.domainY = (data) => [this.domainYMin(data), this.domainYMax(data)];
        this.domainZ = (data) => [0, this.domainZMax(data)];
        this.domainT = (data) => [...new Set(data.map(this.dataT))];

        return this;
    }

    updateDomainX(domainx) { this.domainX = domainx; return this; }
    updateDomainY(domainy) { this.domainY = domainy; return this; }
    updateDomainZ(domainz) { this.domainZ = domainz; return this; }
    updateDomainT(domaint) { this.domainT = domaint; return this; }
}

class BubbleScale extends BubbleDomain {

    constructor(info, data, x, y, z, t) {

        super(info, data, x, y, z, t);

        this.scaleX = d3.scale("linear")
        this.scaleY = d3.scale("linear")
        this.scaleZ = d3.scale("sqrt")
        this.scaleT = d3.scale("ordinal")

        return this;
    }

    updateScaleX(scalex) { this.scaleX = scalex; return this; }
    updateScaleY(scaley) { this.scaleY = scaley; return this; }
    updateScaleZ(scalez) { this.scaleZ = scalez; return this; }
    updateScaleT(scalet) { this.scaleT = scalet; return this; }
}

export class BubbleModel extends BubbleScale {

    constructor(info, data, x, y, z, t) {

        super(info, data, x, y, z, t);
        return this;
    }
}

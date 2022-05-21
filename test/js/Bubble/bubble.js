// https://d3-graph-gallery.com/graph/bubble_template.html
// https://d3-graph-gallery.com/graph/scatter_buttonXlim.html
// https://d3-graph-gallery.com/graph/interactivity_brush.html

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

    constructor(data, formatted = true) {

        if (!formatted) {
            this.data = data.map(d => ({ data: d }))
        }

        else {
            this.data = data;
        }

        return this;
    }
}

class BubbleData extends BubbleDataInit {

    constructor(data, x, y, z, t) {
        super(data);

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
        this.data = data;
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

    constructor(data, x, y, z, t) {

        super(data, x, y, z, t);

        this.domainX = (data) => [d3.min(data, this.dataX), d3.max(data, this.dataX)];
        this.domainY = (data) => [d3.min(data, this.dataY), d3.max(data, this.dataY)];
        this.domainZ = (data) => [d3.min(data, this.dataZ), d3.max(data, this.dataZ)];
        this.domainT = (data) => data.map(this.dataT);

        return this;
    }

    updateDomainX(domainx) { this.domainX = domainx; return this; }
    updateDomainY(domainy) { this.domainY = domainy; return this; }
    updateDomainZ(domainz) { this.domainZ = domainz; return this; }
    updateDomainT(domaint) { this.domainT = domaint; return this; }
}

class BubbleScale extends BubbleDomain {

    constructor(data, x, y, z, t) {

        super(data, x, y, z, t);

        this.scaleX = d3.scale("symlog")
        this.scaleY = d3.scale("symlog")
        this.scaleZ = d3.scale("sqrt")
        this.scaleT = d3.scale("ordinal")

        return this;
    }

    updateScaleX(scalex) { this.scaleX = scalex; return this; }
    updateScaleY(scaley) { this.scaleY = scaley; return this; }
    updateScaleZ(scalez) { this.scaleZ = scalez; return this; }
    updateScaleT(scalet) { this.scaleT = scalet; return this; }
}

class BubbleDraw extends BubbleScale {

    constructor(data, x, y, z, t, id = "#scatter-plot") {

        super(data, x, y, z, t);

        this.data = this.data.map(d => ({
            ...d, ...{
                render: {
                    selected: false,
                    appear: true,
                }
            }
        }));

        this.updateDomainT((data) => data.filter(d => d.render.appear).map(this.dataT))

        this.draw = {}

        this.draw.id = id;

        this.drawPlot();

        return this;
    }

    drawPlot() {

        const self = this;

        const width = 500, height = 500,
            margin = { left: 150, top: 60, bottom: 100, right: 450 },
            padding = {
                inner: { left: 10, top: 10, bottom: 10, right: 10 },
                outer: { y: 20, x: 20 }
            }

        // append the svg object to the body of the page
        self.draw.svg = d3.select(self.draw.id)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // ---------------------------//
        //       AXIS  AND SCALE      //
        // ---------------------------//

        // Add X axis
        const X = self.scaleX
            .domain(self.domainX(self.data))
            .rangeRound([0, width]);

        self.draw.xAxis = self.draw.svg.append("g")
            .attr("transform", `translate(0, ${height + padding.outer.x})`)
            .call(d3.axisBottom(X).ticks(5));

        // Add X axis label:
        self.draw.xLabel = self.draw.svg.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", width + 20)
            .attr("y", height + padding.outer.x)
            .text(self.x);

        // Add Y axis
        const Y = self.scaleY
            .domain(self.domainY(self.data))
            .rangeRound([height, 0]);

        self.draw.yAxis = self.draw.svg.append("g")
            .attr("transform", `translate(${-padding.outer.y}, 0)`)
            .call(d3.axisLeft(Y).ticks(5));

        // Add Y axis label:
        self.draw.yLabel = self.draw.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20)
            .text(self.y)
            .attr("text-anchor", "start")

        // Add a scale for bubble size
        const Z = self.scaleZ
            .domain(self.domainZ(self.data))
            .rangeRound([10, 30]);

        // Add a scale for bubble color
        const T = self.scaleT
            .domain(self.domainT(self.data))
            .range(["#1f77b4",
                "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
            ]);


        // ---------------------------//
        //      TOOLTIP               //
        // ---------------------------//

        // -1- Create a tooltip div that is hidden by default:
        self.draw.tooltip = d3.select(self.draw.id)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")

        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        function showTooltip(e, d) {
            const html = `${self.t}: ${self.dataT(d)}` +
                `<br>${self.x}: ${self.dataX(d).toLocaleString("en-US")}` +
                `<br>${self.y}: ${self.dataY(d).toLocaleString("en-US")}` +
                `<br>${self.z}: ${self.dataZ(d).toLocaleString("en-US")}`

            self.draw.tooltip
                .style("opacity", 1)
                .style("left", (e.x) + 50 + "px")
                .style("top", (e.y) - 50 + "px")
                .html(html)
        }
        function moveTooltip(e, d) {
            self.draw.tooltip
                .style("left", (e.x) + 50 + "px")
                .style("top", (e.y) - 50 + "px")
        }
        function hideTooltip(e, d) {
            self.draw.tooltip
                .style("left", (e.x + width) + 50 + "px")
                .style("top", (e.y + height) - 50 + "px")
                .style("opacity", 0)
        }

        // ---------------------------//
        //       CIRCLES              //
        // ---------------------------//

        // Add dots
        self.draw.Points = self.draw.svg.append('g')
            .selectAll("point")
            .data(self.data)
            .enter()
            .append("g")
            .attr("class", d => "bubbles " + self.dataT(d).replace(/ /g, "_"))

        self.draw.Points
            .style("visibility", d => {
                if (isNaN(parseInt(self.dataX(d)))
                    || isNaN(parseInt(self.dataY(d)))
                    || isNaN(parseInt(self.dataZ(d)))
                ) d.render.appear = false;
                else d.render.appear = true;

                if (d.render.appear) return "visible";

                else return "hidden";
            })


        self.draw.Points.append("circle")
            .attr("class", "bubble-circle")
            .attr("cx", d => X(self.dataX(d)))
            .attr("cy", d => Y(self.dataY(d)))
            .attr("r", d => Z(self.dataZ(d)))
            .attr("fill", d => T(self.dataT(d)))

        self.draw.Points
            .on("click", pointOnClick)
            .on("mouseover", pointOnMouseOver)
            .on("mousemove", pointOnMouseMove)
            .on("mouseout", pointOnMouseOut)

        // ---------------------------//
        //    CIRCLES ANNOTATIONS     //
        // ---------------------------//

        function addAnnotations(point) {

            const d = point.datum();

            if (point.select(".bubble-line-x").empty() && !isNaN(parseInt(self.dataX(d)))) {

                console.log((self.dataX(d)))

                const xLine = point.append("g")
                    .attr("class", "bubble-line-x")

                xLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", X(self.dataX(d)))
                    .attr("x2", X(self.dataX(d)))
                    .attr("y1", height + padding.outer.x + 20)
                    .attr("y2", Y(self.dataY(d)))

                xLine.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("font-weight", 0.5)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "text-before-edge")
                    .attr("font-size", "10px")
                    .attr("x", X(self.dataX(d)))
                    .attr("y", height + padding.outer.x + 20)
                    .text(self.dataX(d).toLocaleString("en-US"))

                point.raise()
                point.select(".bubble-text").raise()
                point.select(".bubble-circle").raise()
            }

            if (point.select(".bubble-line-y").empty() && !isNaN(parseInt(self.dataY(d)))) {

                console.log((self.dataY(d)))

                const yLine = point.append("g")
                    .attr("class", "bubble-line-y")

                yLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", -padding.outer.y - 10)
                    .attr("x2", X(self.dataX(d)))
                    .attr("y1", Y(self.dataY(d)))
                    .attr("y2", Y(self.dataY(d)))

                yLine.append("text")
                    .attr("font-family", "sans-serif")
                    // .attr("fill", "blue")
                    .attr("font-weight", 0.5)
                    .attr("font-size", "10px")
                    .attr("dominant-baseline", "middle")
                    .attr("text-anchor", "end")
                    .attr("x", -padding.outer.y - 10)
                    .attr("y", Y(self.dataY(d)))
                    .text(self.dataY(d).toLocaleString("en-US"))

                point.raise()
                point.select(".bubble-text").raise()
                point.select(".bubble-circle").raise()

            }
        }

        function removeAnnotations(point) {

            if (!point.select(".bubble-line-x").empty()) {
                point.select(".bubble-line-x").remove()
            }

            if (!point.select(".bubble-line-y").empty()) {
                point.select(".bubble-line-y").remove()
            }
        }

        function pointOnClick(e, d) {

            const point = d3.select(this);

            d.render.selected = !d.render.selected;

            if (d.render.selected) {
                addAnnotations(point);
            }

            else {
                removeAnnotations(point);
            }
        }


        function pointOnMouseOver(e, d) {

            showTooltip(e, d);

            const point = d3.select(this);

            self.draw.svg.selectAll(".bubbles").style("opacity", .05)

            point.style("opacity", 1)

            if (!d.render.selected) {
                addAnnotations(point);
            }
        }

        function pointOnMouseMove(e, d) {

            moveTooltip(e, d);

            const point = d3.select(this);

            self.draw.svg.selectAll(".bubbles").style("opacity", .05)

            point.style("opacity", 1)
        }

        function pointOnMouseOut(e, d) {

            hideTooltip(e, d);

            const point = d3.select(this);

            self.draw.svg.selectAll(".bubbles").style("opacity", 1)

            if (!d.render.selected) {
                removeAnnotations(point);
            }
        }

        // ---------------------------//
        //       LEGEND CIRCLES       //
        // ---------------------------//

        // Add legend: circles
        self.draw.legendCircleValues = [
            { name: "Min", value: d3.min(self.data, self.dataZ) },
            { name: "Mean", value: d3.mean(self.data, self.dataZ) },
            { name: "Median", value: d3.median(self.data, self.dataZ) },
            { name: "Max", value: d3.max(self.data, self.dataZ) }
        ].sort((a, b) => (a.value - b.value))

        const zCircleX = width + margin.left + 40
        const zCircleY = height - 100
        const zLabelX = zCircleX + 50

        self.draw.legendCircle = self.draw.svg
            .selectAll("legend")
            .data(self.draw.legendCircleValues)
            .enter()
            .append("g")

        self.draw.legendCircle.append("circle")
            .attr("cx", zCircleX)
            .attr("cy", d => zCircleY - Z(d.value))
            .attr("r", d => Z(d.value))
            .style("fill", "none")
            .attr("stroke", "black")

        let zLabelHeight = 0;
        let potentialY = zCircleY - Z(self.draw.legendCircleValues[0].value);

        // Add legend: labels
        self.draw.legendCircle.append("text")
            .text(d => `${d.name}: ${d.value.toLocaleString("en-US")}`)
            .attr("font-size", 12)
            .attr('x', zLabelX)
            .attr('dominant-baseline', 'middle')
            .each(function (d, i) {
                const label = d3.select(this);
                if (zLabelHeight < label.node().getBBox().height)
                    zLabelHeight = label.node().getBBox().height
            })
            .attr('y', function (d) {
                d.y2 = Math.min(zCircleY - Z(d.value), potentialY);
                potentialY = d.y2 - zLabelHeight;
                return d.y2;
            })

        for (const d of self.draw.legendCircleValues) {
            d.r = Z(d.value)
            d.x1 = zCircleX
            d.y1 = zCircleY - d.r;
            d.x2 = zLabelX;
            d.y2 = d.y2;
            let dd = Math.sqrt((d.y2 - d.y1) ** 2 + (d.x2 - d.x1) ** 2)
            dd = d.r / dd;

            d.x1 = d.x1 + (d.x2 - d.x1) * dd
            d.y1 = d.y1 - (d.y1 - d.y2) * dd
        }

        // Add legend: segments
        self.draw.legendCircle.append("line")
            .attr('x1', d => d.x1)
            .attr('x2', d => d.x2)
            .attr('y1', d => d.y1)
            .attr('y2', d => d.y2)
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))

        // Legend title
        self.draw.legendCircleTitle = self.draw.svg.append("text")
            .attr('x', zCircleX)
            .attr("y", zCircleY + 20)
            .text(self.z)
            .attr("text-anchor", "middle")

        // ---------------------------//
        //       LEGEND FOR GROUPS    //
        // ---------------------------//

        // Add one dot in the legend for each name.
        const size = 20

        const allgroups = self.domainT(self.data)

        self.draw.legendGroups = self.draw.svg
            .append("g")
            .attr("class", ".legendGroupss")
            .selectAll(".legendGroups")
            .data(allgroups)
            .enter()
            .append("g")
            .attr("class", "legendGroups")
            .style("cursor", "move")

        self.draw.legendGroups.append("circle")
            .attr("cx", zCircleX)
            .attr("cy", (d, i) => 10 + i * (size + 5)) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", d => T(d))
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        // Add labels beside legend dots
        self.draw.legendGroups.append("text")
            .attr("x", zCircleX + size * .8)
            .attr("y", (d, i) => 10 + i * (size + 5)) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", d => T(d))
            .text(d => d)
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        // ---------------------------//
        //       HIGHLIGHT GROUP      //
        // ---------------------------//

        // What to do when one group is hovered
        function highlight(event, d) {
            // reduce opacity of all groups
            self.draw.svg.selectAll(".bubbles").style("opacity", .05)
            // expect the one that is hovered
            self.draw.svg
                .selectAll("." + d.replace(/ /g, "_"))
                .style("opacity", 1)
            // .each(function () {
            //     const point = d3.select(this);
            //     addAnnotations(point);
            // })
        }

        // And when it is not hovered anymore
        function noHighlight(event, d) {
            self.draw.svg
                .selectAll(".bubbles")
                .style("opacity", 1)
            // .each(function () {
            //     const point = d3.select(this);
            //     removeAnnotations(point);
            // })
        }


        return self;
    }

    updateDrawPlot() {

        const self = this;

        const width = 500, height = 500,
            margin = { left: 150, top: 60, bottom: 100, right: 450 },
            padding = {
                inner: { left: 10, top: 10, bottom: 10, right: 10 },
                outer: { y: 20, x: 20 }
            }

        // ---------------------------//
        //       AXIS  AND SCALE      //
        // ---------------------------//

        console.log(self)
        // Add X axis
        const X = self.scaleX
            .domain(self.domainX(self.data))
            .rangeRound([0, width]);

        self.draw.xAxis
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .call(d3.axisBottom(X).ticks(5));

        // Add X axis label:
        self.draw.xLabel
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.x);

        // Add Y axis
        const Y = self.scaleY
            .domain(self.domainY(self.data))
            .rangeRound([height, 0]);

        self.draw.yAxis
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .call(d3.axisLeft(Y).ticks(5));

        // Add Y axis label:
        self.draw.yLabel
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.y)

        // Add a scale for bubble size
        const Z = self.scaleZ
            .domain(self.domainZ(self.data))
            .rangeRound([10, 30]);

        // Add a scale for bubble color
        const T = self.scaleT
            .domain(self.domainT(self.data))
            .range(["#1f77b4",
                "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
            ]);

        // ---------------------------//
        //       CIRCLES              //
        // ---------------------------//

        // reset visibility
        self.draw.Points
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .style("visibility", d => {
                if (isNaN(parseInt(self.dataX(d)))
                    || isNaN(parseInt(self.dataY(d)))
                    || isNaN(parseInt(self.dataZ(d)))
                ) d.render.appear = false;
                else d.render.appear = true;

                if (d.render.appear) return "visible";

                else return "hidden";
            })


        self.draw.Points.select(".bubble-circle")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", d => X(self.dataX(d)))
            .attr("cy", d => Y(self.dataY(d)))
            .attr("r", d => Z(self.dataZ(d)))
            .attr("fill", d => T(self.dataT(d)))



        // ---------------------------//
        //    CIRCLES ANNOTATIONS     //
        // ---------------------------//

        self.draw.Points.select(".bubble-line-x").select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x1", d => X(self.dataX(d)))
            .attr("x2", d => X(self.dataX(d)))
            .attr("y1", height + padding.outer.x + 20)
            .attr("y2", d => Y(self.dataY(d)))

        self.draw.Points.select(".bubble-line-x").select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", d => X(self.dataX(d)))
            .attr("y", height + padding.outer.x + 20)
            .text(d => self.dataX(d).toLocaleString("en-US"))

        self.draw.Points.select(".bubble-line-y").select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x1", -padding.outer.y - 10)
            .attr("x2", d => X(self.dataX(d)))
            .attr("y1", d => Y(self.dataY(d)))
            .attr("y2", d => Y(self.dataY(d)))

        self.draw.Points.select(".bubble-line-y").select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", -padding.outer.y - 10)
            .attr("y", d => Y(self.dataY(d)))
            .text(d => self.dataY(d).toLocaleString("en-US"))

        // ---------------------------//
        //       LEGEND CIRCLES       //
        // ---------------------------//

        // update data

        for (const d of self.draw.legendCircleValues) {
            switch (d.name) {
                case "Min":
                    d.value = d3.min(self.data, self.dataZ)
                    break;
                case "Mean":
                    d.value = d3.mean(self.data, self.dataZ)
                    break;
                case "Median":
                    d.value = d3.median(self.data, self.dataZ)
                    break;
                case "Max":
                    d.value = d3.max(self.data, self.dataZ)
                    break;
                default:
                    break;

            }
        }

        self.draw.legendCircleValues.sort((a, b) => (a.value - b.value))

        const zCircleX = width + margin.left + 40
        const zCircleY = height - 100
        const zLabelX = zCircleX + 50

        self.draw.legendCircle.select("circle")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", zCircleX)
            .attr("cy", d => zCircleY - Z(d.value))
            .attr("r", d => Z(d.value))
            .style("fill", "none")
            .attr("stroke", "black")

        let zLabelHeight = 0;
        let potentialY = zCircleY - Z(self.draw.legendCircleValues[0].value);

        // Add legend: labels
        self.draw.legendCircle.select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(d => `${d.name}: ${d.value.toLocaleString("en-US")}`)
            .attr("font-size", 12)
            .attr('x', zLabelX)
            .attr('dominant-baseline', 'middle')
            .each(function (d, i) {
                const label = d3.select(this);
                if (zLabelHeight < label.node().getBBox().height)
                    zLabelHeight = label.node().getBBox().height
            })
            .attr('y', function (d) {
                d.y2 = Math.min(zCircleY - Z(d.value), potentialY);
                potentialY = d.y2 - zLabelHeight;
                return d.y2;
            })

        for (const d of self.draw.legendCircleValues) {
            d.r = Z(d.value)
            d.x1 = zCircleX
            d.y1 = zCircleY - d.r;
            d.x2 = zLabelX;
            d.y2 = d.y2;
            let dd = Math.sqrt((d.y2 - d.y1) ** 2 + (d.x2 - d.x1) ** 2)
            dd = d.r / dd;

            d.x1 = d.x1 + (d.x2 - d.x1) * dd
            d.y1 = d.y1 - (d.y1 - d.y2) * dd
        }

        // Add legend: segments
        self.draw.legendCircle.select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr('x1', d => d.x1)
            .attr('x2', d => d.x2)
            .attr('y1', d => d.y1)
            .attr('y2', d => d.y2)

        // Legend title
        self.draw.legendCircleTitle
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.z)

        // ---------------------------//
        //       LEGEND FOR GROUPS    //
        // ---------------------------//

        // Add one dot in the legend for each name.
        const size = 20

        const allgroups = self.domainT(self.data)

        self.draw.legendGroups.remove()

        self.draw.legendGroups = self.draw.svg
            .append("g")
            .attr("class", ".legendGroupss")
            .selectAll(".legendGroups")
            .data(allgroups)
            .enter()
            .append("g")
            .attr("class", "legendGroups")
            .style("cursor", "move")

        self.draw.legendGroups.append("circle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", zCircleX)
            .attr("cy", (d, i) => 10 + i * (size + 5)) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", d => T(d))

        // Add labels beside legend dots
        self.draw.legendGroups.append("text")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", zCircleX + size * .8)
            .attr("y", (d, i) => 10 + i * (size + 5)) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", d => T(d))
            .text(d => d)
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")


        // ---------------------------//
        //       HIGHLIGHT GROUP      //
        // ---------------------------//

        // What to do when one group is hovered
        function highlight(event, d) {
            // reduce opacity of all groups
            self.draw.svg.selectAll(".bubbles").style("opacity", .05)
            // expect the one that is hovered
            self.draw.svg
                .selectAll("." + d.replace(/ /g, "_"))
                .style("opacity", 1)
            // .each(function () {
            //     const point = d3.select(this);
            //     addAnnotations(point);
            // })
        }

        // And when it is not hovered anymore
        function noHighlight(event, d) {
            self.draw.svg
                .selectAll(".bubbles")
                .style("opacity", 1)

        }

        return self;
    }
}

class Selections {

    constructor(selectionarea) {

        this.SELECTIONAREA = selectionarea;

        this.optionsarray
        this.Selection
        this.Options
        this.defaultvalue
        this.onSelect

    }

    OnSelect(callback) {

        const self = this;

        self.onSelect = callback;

        try {
            self.Selection.on("change", function () {

                const value = d3.select(this).property("value");

                self.onSelect(value);
            });
        }

        catch { }

        return this;

    }

    OptionsData(array) {

        this.optionsarray = array;

        this.defaultvalue = this.optionsarray[0].value;

        return this;
    }

    DefaultValue(value, sort = false) {

        this.defaultvalue = value;

        if (sort) {

            this.optionsarray.sort((a, b) => {
                if (a.value == value) {
                    return -1;
                }
                else if (b.value == value) {
                    return 1;
                }
                else return 0;
            })

        }

        try {
            this.Options.property("selected", d => d.value == self.defaultvalue);
        }
        catch { }

        return this;
    }

    DrawSelection() {

        const self = this;

        self.Selection = self.SELECTIONAREA.append("select");

        self.Options = self.Selection.selectAll("option")
            .data(self.optionsarray)
            .enter()
            .append("option")
            .text(d => d.name)
            .property("value", d => d.value)
            .property("selected", d => d.value == self.defaultvalue);

        self.Selection.on("change", function (d) {

            const selectedValue = d3.select(this).property("value");

            self.onSelect(selectedValue);
        });

        return self;
    }
}

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



        self.selectVarY.DrawSelection();
        self.selectVarX.DrawSelection();

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

    console.log("DATA", DATA)

    let x = new BubbleSelection(namedata, DATA, "population", "gdp", "population", "iso_code")
    // x.updateZ("gdp").updateX("gdp").updateY("population").updateT("country").updateDrawPlot()

}).catch(function (err) {
    console.error(err);
})

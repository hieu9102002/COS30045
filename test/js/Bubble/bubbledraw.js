
"use strict"

import { BubbleScale } from "./bubbledata.js"

function format(d) {
    try {
        return d.toLocaleString("en-US");
    }
    catch {
        return d;
    }
}

function formatid(d) {

    d = "_" + String(d);

    try {
        return d.replace(/\s/g, "_");
    }

    catch {
        return d;
    }
}

export class BubbleDraw extends BubbleScale {

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

        this.updateDomainT((data) => [...new Set(data.filter(d => d.render.appear).map(this.dataT))])

        this.DRAW = {
            id: id,
            param: {}
        }

        this.DRAW.param.width = 500
        this.DRAW.param.height = 500
        this.DRAW.param.margin = { left: 150, top: 60, bottom: 100, right: 450 }
        this.DRAW.param.padding = {
            inner: { left: 10, top: 10, bottom: 10, right: 10 },
            outer: { y: 0, x: 0 }
        }
        this.DRAW.param.zCircleX = this.DRAW.param.width + this.DRAW.param.margin.left + 40
        this.DRAW.param.zCircleY = this.DRAW.param.height - 100
        this.DRAW.param.zLabelX = this.DRAW.param.zCircleX + 50

        this.Scale = {
            X: this.scaleX.domain(this.domainX),
            Y: this.scaleY.domain(this.domainY),
            Z: this.scaleZ.domain(this.domainZ),
            T: this.scaleT,
        }

        this.drawPlot();

        return this;
    }

    drawPlot() {

        const self = this;

        d3.select(self.DRAW.id)
            .style("position", "relative")
            .style("width", `${100 + self.DRAW.param.width + self.DRAW.param.margin.left + self.DRAW.param.margin.right}px`)
            .style("height", `${100 + self.DRAW.param.height + self.DRAW.param.margin.top + self.DRAW.param.margin.bottom}px`)
            .style("overflow", "hidden")

        // append the svg object to the body of the page
        self.DRAW.svg = d3.select(self.DRAW.id)
            .append("svg")
            .attr("width", self.DRAW.param.width + self.DRAW.param.margin.left + self.DRAW.param.margin.right)
            .attr("height", self.DRAW.param.height + self.DRAW.param.margin.top + self.DRAW.param.margin.bottom)
            .append("g")
            .attr("transform", `translate(${self.DRAW.param.margin.left},${self.DRAW.param.margin.top})`);

        // ---------------------------//
        //       AXIS  AND SCALE      //
        // ---------------------------//

        // Add X axis scale
        self.Scale.X = self.scaleX
            .domain(self.domainX(self.data))
            .rangeRound([0, self.DRAW.param.width])
            .unknown(0);

        // Add X axis
        self.DRAW.xAxis = self.DRAW.svg.append("g")
            .attr("transform", `translate(0, ${self.DRAW.param.height + self.DRAW.param.padding.outer.x})`)
            .call(d3.axisBottom(self.Scale.X).tickValues([
                d3.min(self.data, self.dataX),
                d3.mean(self.data, self.dataX),
                d3.median(self.data, self.dataX),
                d3.max(self.data, self.dataX)
            ]));

        console.log(d3.axisBottom(self.Scale.X).scale().ticks())

        // Add X axis label:
        self.DRAW.xLabel = self.DRAW.svg.append("text")
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("x", self.DRAW.param.width + 20)
            .attr("y", self.DRAW.param.height + self.DRAW.param.padding.outer.x)
            .text(self.x);

        // Add Y axis scale
        self.Scale.Y = self.scaleY
            .domain(self.domainY(self.data))
            .rangeRound([self.DRAW.param.height, 0])
            .unknown(self.DRAW.param.height);

        // Add Y axis
        self.DRAW.yAxis = self.DRAW.svg.append("g")
            .attr("transform", `translate(${-self.DRAW.param.padding.outer.y}, 0)`)
            .call(d3.axisLeft(self.Scale.Y).tickValues([
                d3.min(self.data, self.dataY),
                d3.mean(self.data, self.dataY),
                d3.median(self.data, self.dataY),
                d3.max(self.data, self.dataY)
            ]));

        // Add Y axis label:
        self.DRAW.yLabel = self.DRAW.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20)
            .text(self.y)
            .attr("text-anchor", "start")

        // Add a scale for bubble size
        self.Scale.Z = self.scaleZ
            .domain(self.domainZ(self.data))
            .rangeRound([0, 30])
            .clamp(true)
            .unknown(0);

        // Add a scale for bubble color
        self.Scale.T = self.scaleT
            .domain(self.domainT(self.data))
            .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);


        // ---------------------------//
        //      TOOLTIP               //
        // ---------------------------//

        // -1- Create a tooltip div that is hidden by default:
        self.DRAW.tooltip = d3.select(self.DRAW.id)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")

        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        function showTooltip(e, d) {
            const html = `Country: ${d.data["country"]}` +
                `<br>Year: ${d.data["year"]}` +
                `<br>${self.t}: ${self.dataT(d)}` +
                `<br>Y axis: ${format(self.dataY(d))} (${self.y})` +
                `<br>X axis: ${format(self.dataX(d))} (${self.x})` +
                `<br>${self.z}: ${format(self.dataZ(d))}`

            self.DRAW.tooltip
                .style("opacity", 1)
                .style("left", (e.x) + 50 + "px")
                .style("top", (e.y) - 50 + "px")
                .html(html)
        }
        function moveTooltip(e, d) {
            self.DRAW.tooltip
                .style("left", (e.x) + 50 + "px")
                .style("top", (e.y) - 50 + "px")
        }
        function hideTooltip(e, d) {
            self.DRAW.tooltip
                .style("left", (e.x + self.DRAW.param.width) + 50 + "px")
                .style("top", (e.y + self.DRAW.param.height) - 50 + "px")
                .style("opacity", 0)
        }

        // ---------------------------//
        //       CIRCLES              //
        // ---------------------------//

        // Add dots
        self.DRAW.Points = self.DRAW.svg.append('g')
            .selectAll("point")
            .data(self.data)
            .enter()
            .append("g")
            .attr("class", d => "bubbles " + formatid(self.dataT(d)))

        self.DRAW.Points
            .style("visibility", d => {
                if (isNaN(parseInt(self.dataX(d)))
                    || isNaN(parseInt(self.dataY(d)))
                    || isNaN(parseInt(self.dataZ(d)))
                ) d.render.appear = false;
                else d.render.appear = true;

                if (d.render.appear) return "visible";

                else return "hidden";
            })

        self.DRAW.Points.append("circle")
            .attr("class", "bubble-circle")
            .attr("cx", d => self.Scale.X(self.dataX(d)))
            .attr("cy", d => self.Scale.Y(self.dataY(d)))
            .attr("r", d => self.Scale.Z(self.dataZ(d)))
            .attr("fill", d => self.Scale.T(self.dataT(d)))

        self.DRAW.Points.append("text")
            .attr("class", "bubble-text")
            .text(d => d.data["country"])
            .attr("x", d => self.Scale.X(self.dataX(d)) + self.Scale.Z(self.dataZ(d)))
            .attr("y", d => self.Scale.Y(self.dataY(d)) - self.Scale.Z(self.dataZ(d)))
            .attr("fill", d => self.Scale.T(self.dataT(d)))

        self.DRAW.Points
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

                const xLine = point.append("g")
                    .attr("class", "bubble-line-x")

                xLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", self.Scale.X(self.dataX(d)))
                    .attr("x2", self.Scale.X(self.dataX(d)))
                    .attr("y1", self.DRAW.param.height + self.DRAW.param.padding.outer.x + 20)
                    .attr("y2", self.Scale.Y(self.dataY(d)))

                xLine.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("font-weight", 0.5)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "text-before-edge")
                    .attr("font-size", "10px")
                    .attr("x", self.Scale.X(self.dataX(d)))
                    .attr("y", self.DRAW.param.height + self.DRAW.param.padding.outer.x + 20)
                    .text(format(self.dataX(d)))

                point.raise()
                point.select(".bubble-text").raise()
                point.select(".bubble-circle").raise()
            }

            if (point.select(".bubble-line-y").empty() && !isNaN(parseInt(self.dataY(d)))) {

                const yLine = point.append("g")
                    .attr("class", "bubble-line-y")

                yLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", -self.DRAW.param.padding.outer.y - 10)
                    .attr("x2", self.Scale.X(self.dataX(d)))
                    .attr("y1", self.Scale.Y(self.dataY(d)))
                    .attr("y2", self.Scale.Y(self.dataY(d)))

                yLine.append("text")
                    .attr("font-family", "sans-serif")
                    // .attr("fill", "blue")
                    .attr("font-weight", 0.5)
                    .attr("font-size", "10px")
                    .attr("dominant-baseline", "middle")
                    .attr("text-anchor", "end")
                    .attr("x", -self.DRAW.param.padding.outer.y - 10)
                    .attr("y", self.Scale.Y(self.dataY(d)))
                    .text(format(self.dataY(d)))

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

        // ---------------------------//
        //    CIRCLES EVENTS          //
        // ---------------------------//

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

        function showBubbleInLegends(point) {

            const d = point.datum()

            const pointLegend = point.append("g")
                .attr("class", "bubble-circle-legend")

            pointLegend.append("circle")
                .attr("cx", zCircleX)
                .attr("cy", zCircleY - self.Scale.Z(self.dataZ(d)))
                .attr("r", self.Scale.Z(self.dataZ(d)))
                .attr("fill", self.Scale.T(self.dataT(d)))

            pointLegend.append("line")
                .attr('x1', zCircleX)
                .attr('x2', zCircleX)
                .attr('y1', zCircleY - self.Scale.Z(self.dataZ(d)) - 80)
                .attr('y2', zCircleY - self.Scale.Z(self.dataZ(d)))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'))

            pointLegend.append("text")
                .text(`${self.z}: ${format(self.dataZ(d))}`)
                .attr("font-size", 12)
                .attr('text-anchor', 'middle')
                .attr('x', zCircleX)
                .attr('y', zCircleY - self.Scale.Z(self.dataZ(d)) - 80)


        }

        function hideBubbleInLegends(point) {

            point.selectAll(".bubble-circle-legend").remove()
        }


        function pointOnMouseOver(e, d) {

            showTooltip(e, d);

            const point = d3.select(this);

            point.raise()

            self.DRAW.svg.selectAll(".bubbles").style("opacity", .05)

            point.style("opacity", 1)

            if (!d.render.selected) {
                addAnnotations(point);
            }

            showBubbleInLegends(point)
        }

        function pointOnMouseMove(e, d) {

            moveTooltip(e, d);

            const point = d3.select(this);

            point.raise()

            self.DRAW.svg.selectAll(".bubbles").style("opacity", .05)

            point.style("opacity", 1)
        }

        function pointOnMouseOut(e, d) {

            hideTooltip(e, d);

            const point = d3.select(this);

            self.DRAW.svg.selectAll(".bubbles").style("opacity", 1)

            if (!d.render.selected) {
                removeAnnotations(point);
            }

            hideBubbleInLegends(point)
        }

        // ---------------------------//
        //       LEGEND BUBBLES       //
        // ---------------------------//

        // Add legend: circles
        self.DRAW.legendCircleValues = [
            { name: "Min", value: d3.min(self.data, self.dataZ) },
            { name: "Mean", value: d3.mean(self.data, self.dataZ) },
            { name: "Median", value: d3.median(self.data, self.dataZ) },
            { name: "Max", value: d3.max(self.data, self.dataZ) }
        ].sort((a, b) => (a.value - b.value))

        const zCircleX = self.DRAW.param.zCircleX
        const zCircleY = self.DRAW.param.zCircleY
        const zLabelX = self.DRAW.param.zLabelX

        self.DRAW.legendCircle = self.DRAW.svg
            .selectAll("legend")
            .data(self.DRAW.legendCircleValues)
            .enter()
            .append("g")

        self.DRAW.legendCircle.append("circle")
            .attr("cx", zCircleX)
            .attr("cy", d => zCircleY - self.Scale.Z(d.value))
            .attr("r", d => self.Scale.Z(d.value))
            .style("fill", "none")
            .attr("stroke", "black")

        let zLabelHeight = 0;
        let potentialY = zCircleY - self.Scale.Z(self.DRAW.legendCircleValues[0].value);

        // Add legend: labels
        self.DRAW.legendCircle.append("text")
            .text(d => `${d.name}: ${format(d.value)}`)
            .attr("font-size", 12)
            .attr('x', zLabelX)
            .attr('dominant-baseline', 'middle')
            .each(function (d, i) {
                const label = d3.select(this);
                if (zLabelHeight < label.node().getBBox().height)
                    zLabelHeight = label.node().getBBox().height
            })
            .attr('y', function (d) {
                d.y2 = Math.min(zCircleY - self.Scale.Z(d.value), potentialY);
                potentialY = d.y2 - zLabelHeight;
                return d.y2;
            })

        // reset values to draw line that points to center of circle
        for (const d of self.DRAW.legendCircleValues) {
            d.r = self.Scale.Z(d.value)
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
        self.DRAW.legendCircle.append("line")
            .attr('x1', d => d.x1)
            .attr('x2', d => d.x2)
            .attr('y1', d => d.y1)
            .attr('y2', d => d.y2)
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))

        // Legend title
        self.DRAW.legendCircleTitle = self.DRAW.svg.append("text")
            .attr('x', zCircleX)
            .attr("y", zCircleY + 20)
            .text(self.z)
            .attr("text-anchor", "middle")

        self.addLegendsGroup();

        return self;
    }

    addLegendsGroup() {

        // ---------------------------//
        //       LEGEND FOR GROUPS    //
        // ---------------------------//

        const self = this;

        // Add one dot in the legend for each name.
        const size = 20
        const zCircleX = self.DRAW.param.zCircleX

        const div = d3.select(self.DRAW.id)
            .append("div")
            .style("overflow", "auto")
            .style("position", "absolute")
            .style("right", "200px")
            .style("top", "60px")
            .style("width", "200px")
            .style("height", "200px")

        const svg = div
            .append("svg")
            .attr("x", zCircleX)
            .attr("y", 10)
            .attr("width", 150)
        // notice that svg height is not updated yet

        self.DRAW.legendGroups = svg
            .selectAll(".legendGroups")
            .data(self.domainT(self.data))
            .enter()
            .append("g")
            .attr("class", "legendGroups")
            .style("cursor", "move")

        self.DRAW.legendGroups.append("circle")
            .attr("cx", 7)
            .attr("cy", (d, i) => {
                const y = 10 + i * (size + 5)
                if (y + 20 >= svg.attr("height")) {
                    svg.attr("height", y + 20) // modify svg height so that svg contains all g
                }
                return y;
            })
            .attr("r", 7)
            .style("fill", d => self.Scale.T(d))
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        // Add labels beside legend dots
        self.DRAW.legendGroups.append("text")
            .attr("x", 7 + size * .8)
            .attr("y", (d, i) => 10 + i * (size + 5)) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", d => self.Scale.T(d))
            .text(d => d)
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        // ---------------------------//
        //       HIGHLIGHT GROUP      //
        // ---------------------------//

        // What to do when one group is hovered
        function highlight(e, d) {
            // reduce opacity of all groups
            self.DRAW.svg.selectAll(".bubbles").style("opacity", .05)
            // expect the one that is hovered
            self.DRAW.svg
                .selectAll("." + formatid(d))
                .style("opacity", 1)
        }

        // And when it is not hovered anymore
        function noHighlight(e, d) {
            self.DRAW.svg
                .selectAll(".bubbles")
                .style("opacity", 1)
        }

        return self;
    }

    updateDrawPlot() {

        const self = this;

        // ---------------------------//
        //       AXIS  AND SCALE      //
        // ---------------------------//

        // Update X Axis scale
        self.Scale.X = self.scaleX
            .domain(self.domainX(self.data))
            .rangeRound([0, self.DRAW.param.width])
            .unknown(0);

        // Update X Axis
        self.DRAW.xAxis
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .call(d3.axisBottom(self.Scale.X).tickValues([
                d3.min(self.data, self.dataX),
                d3.mean(self.data, self.dataX),
                d3.median(self.data, self.dataX),
                d3.max(self.data, self.dataX)
            ]));

        console.log(d3.axisBottom(self.Scale.X).scale().ticks())

        // Update X axis label:
        self.DRAW.xLabel
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.x);

        // Update Y axis scale
        self.Scale.Y = self.scaleY
            .domain(self.domainY(self.data))
            .rangeRound([self.DRAW.param.height, 0])
            .unknown(0);

        // Update Y Axis
        self.DRAW.yAxis
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .call(d3.axisLeft(self.Scale.Y).tickValues([
                d3.min(self.data, self.dataY),
                d3.mean(self.data, self.dataY),
                d3.median(self.data, self.dataY),
                d3.max(self.data, self.dataY)
            ]));

        // Update Y axis label:
        self.DRAW.yLabel
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.y)

        // Update scale for bubble size
        self.Scale.Z = self.scaleZ
            .domain(self.domainZ(self.data))
            .rangeRound([0, 30])
            .unknown(0)
            .clamp(true);

        // Update scale for bubble color
        self.Scale.T = self.scaleT
            .domain(self.domainT(self.data))
            .range(["#1f77b4",
                "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
            ]);

        // ---------------------------//
        //       CIRCLES              //
        // ---------------------------//

        // reset visibility
        self.DRAW.Points
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


        self.DRAW.Points.select(".bubble-circle")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", d => self.Scale.X(self.dataX(d)))
            .attr("cy", d => self.Scale.Y(self.dataY(d)))
            .attr("r", d => self.Scale.Z(self.dataZ(d)))
            .attr("fill", d => self.Scale.T(self.dataT(d)))

        self.DRAW.Points.select(".bubble-text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(d => d.data["country"])
            .attr("x", d => self.Scale.X(self.dataX(d)) + self.Scale.Z(self.dataZ(d)))
            .attr("y", d => self.Scale.Y(self.dataY(d)) - self.Scale.Z(self.dataZ(d)))
            .attr("fill", d => self.Scale.T(self.dataT(d)))



        // ---------------------------//
        //    CIRCLES ANNOTATIONS     //
        // ---------------------------//

        self.DRAW.Points.select(".bubble-line-x").select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x1", d => self.Scale.X(self.dataX(d)))
            .attr("x2", d => self.Scale.X(self.dataX(d)))
            .attr("y1", self.DRAW.param.height + self.DRAW.param.padding.outer.x + 20)
            .attr("y2", d => self.Scale.Y(self.dataY(d)))

        self.DRAW.Points.select(".bubble-line-x").select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", d => self.Scale.X(self.dataX(d)))
            .attr("y", self.DRAW.param.height + self.DRAW.param.padding.outer.x + 20)
            .text(d => format(self.dataX(d)))

        self.DRAW.Points.select(".bubble-line-y").select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x1", -self.DRAW.param.padding.outer.y - 10)
            .attr("x2", d => self.Scale.X(self.dataX(d)))
            .attr("y1", d => self.Scale.Y(self.dataY(d)))
            .attr("y2", d => self.Scale.Y(self.dataY(d)))

        self.DRAW.Points.select(".bubble-line-y").select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", -self.DRAW.param.padding.outer.y - 10)
            .attr("y", d => self.Scale.Y(self.dataY(d)))
            .text(d => format(self.dataY(d)))

        // ---------------------------//
        //       LEGEND BUBBLES       //
        // ---------------------------//

        // update data

        for (const d of self.DRAW.legendCircleValues) {
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

        self.DRAW.legendCircleValues.sort((a, b) => (a.value - b.value))

        const zCircleX = self.DRAW.param.zCircleX
        const zCircleY = self.DRAW.param.zCircleY
        const zLabelX = self.DRAW.param.zLabelX

        self.DRAW.legendCircle.select("circle")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", zCircleX)
            .attr("cy", d => zCircleY - self.Scale.Z(d.value))
            .attr("r", d => self.Scale.Z(d.value))
            .style("fill", "none")
            .attr("stroke", "black")

        let zLabelHeight = 0;
        let potentialY = zCircleY - self.Scale.Z(self.DRAW.legendCircleValues[0].value);

        // Add legend: labels
        self.DRAW.legendCircle.select("text")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(d => `${d.name}: ${format(d.value)}`)
            .attr("font-size", 12)
            .attr('x', zLabelX)
            .attr('dominant-baseline', 'middle')
            .each(function (d, i) {
                const label = d3.select(this);
                if (zLabelHeight < label.node().getBBox().height)
                    zLabelHeight = label.node().getBBox().height
            })
            .attr('y', function (d) {
                d.y2 = Math.min(zCircleY - self.Scale.Z(d.value), potentialY);
                potentialY = d.y2 - zLabelHeight;
                return d.y2;
            })

        for (const d of self.DRAW.legendCircleValues) {
            d.r = self.Scale.Z(d.value)
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
        self.DRAW.legendCircle.select("line")
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .attr('x1', d => d.x1)
            .attr('x2', d => d.x2)
            .attr('y1', d => d.y1)
            .attr('y2', d => d.y2)

        // Legend title
        self.DRAW.legendCircleTitle
            .transition("update")
            .duration(500)
            .ease(d3.easeLinear)
            .text(self.z)

        // ---------------------------//
        //       LEGEND FOR GROUPS    //
        // ---------------------------//

        self.DRAW.legendGroups.remove()

        self.addLegendsGroup();

        return self;
    }
}
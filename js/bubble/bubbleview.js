
"use strict"

import { BubbleModel } from "./bubblemodel.js"
import { LegendBubbles, LegendGroups, Tooltip, format } from "./utils.js"

class _BubbleViewStyle {

    width = 500; height = 500;

    margin = { left: 150, bottom: 100, top: 60, right: 100 }

    padding = {
        inner: { left: 10, bottom: 10, top: 10, right: 10 },
        outer: { left: 30, bottom: 30, top: 40, right: 100 }
    }

    zLegend = {
        circleX: 50,
        circleY: 150,
        svgWidth: 350,
        svgHeight: 200,
    }

    zCircleX = 150;
    zCircleY = 100;
    zCircleSVGHeight = 20;

    tLegendX = this.width + this.margin.left + 150;

    tLegendY = 100;
}

class _BubbleView {

    constructor(id) {
        this.id = id;
    }

    style = new _BubbleViewStyle();

    SVG;

    zoomArea;

    points;

    legendBubbleTitle;

    legendBubble;

    legendGroups;

    tooltip;

    xAxis; xLabel;
    yAxis; yLabel;

    ScaleX; ScaleY; ScaleZ; ScaleT;

    radiusMax; radiusMin;

    textPadding;


}

export class BubbleView extends BubbleModel {

    constructor(info, data, x, y, z, t, id) {

        super(info, data, x, y, z, t);

        this.info = info

        this.data = this.data.map(d => ({
            ...d, ...{
                render: {
                    selected: false,
                    appear: true,
                }
            }
        }));

        this.updateDomainT((data) => [...new Set(data.filter(d => d.render.appear).map(this.dataT))])

        this.VIEW = new _BubbleView(id)

        this.VIEW.ScaleX = this.scaleX.domain(this.domainX)
        this.VIEW.ScaleY = this.scaleY.domain(this.domainY)
        this.VIEW.ScaleZ = this.scaleZ.domain(this.domainZ)
        this.VIEW.ScaleT = this.scaleT;

        this.xAxisCall = (scale) => d3.axisBottom(scale).ticks(4)
        this.yAxisCall = (scale) => d3.axisLeft(scale).ticks(4)

        this.legendBubbleValues = (data) => [
            { name: "Min", value: d3.min(data, this.dataZ) },
            { name: "Mean", value: d3.mean(data, this.dataZ) },
            { name: "Median", value: d3.median(data, this.dataZ) },
            { name: "Half Max", value: d3.max(data, this.dataZ) / 2 },
            { name: "Max", value: d3.max(data, this.dataZ) }
        ].sort((a, b) => (a.value - b.value))

        this.VIEW.radiusMin = () => +document.getElementById('bubble-radius-range-min').value

        this.VIEW.radiusMax = () => +document.getElementById('bubble-radius-range-max').value

        this.updateDrawPlot(false)

        return this;
    }

    updateDrawPlot(applytransition = true) {

        function transit(selection) {
            if (!applytransition) return selection;
            else return selection
                .transition("update")
                .duration(500)
                .ease(d3.easePolyOut)
        }

        const MODEL = this;
        const VIEW = MODEL.VIEW;
        const STYLE = VIEW.style;

        const zCircleX = STYLE.zLegend.circleX
        const zCircleY = STYLE.zLegend.circleY

        // ------------------------------------- //
        //             DATA                      //
        // ------------------------------------- //

        // filter data

        let data = MODEL.data
            .map(d => {
                d.render.x = VIEW.ScaleX(MODEL.dataX(d))
                d.render.y = VIEW.ScaleY(MODEL.dataY(d))
                d.render.z = VIEW.ScaleZ(MODEL.dataZ(d))
                d.render.t = VIEW.ScaleT(MODEL.dataT(d))
                return d;
            }).filter(d => {
                if (isNaN(parseInt(MODEL.dataX(d)))
                    || isNaN(parseInt(MODEL.dataY(d)))
                    || isNaN(parseInt(MODEL.dataZ(d)))
                    || MODEL.dataT(d) == null
                    || MODEL.dataT(d) == undefined
                ) return false;
                else return true;
            })

        // ------------------------------------- //
        //             SCALE                     //
        // ------------------------------------- //

        // Set X axis scale
        VIEW.ScaleX = MODEL.scaleX
            .domain(MODEL.domainX(data))
            .range([0, STYLE.width])
            .unknown(0);

        // Set Y axis scale
        VIEW.ScaleY = MODEL.scaleY
            .domain(MODEL.domainY(data))
            .range([STYLE.height, 0])
            .unknown(STYLE.height);

        // Set a scale for bubble size
        VIEW.ScaleZ = MODEL.scaleZ
            .domain(MODEL.domainZ(data))
            .range([VIEW.radiusMin(), VIEW.radiusMax()])
            .clamp(true)
            .unknown(0);

        // Set a scale for bubble color
        VIEW.ScaleT = MODEL.scaleT
            .domain(MODEL.domainT(MODEL.data))
            .range(
                ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]
            );

        // ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"]
        // ["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"]

        const isnew = d3.select(VIEW.id).select("svg").empty()

        if (isnew) {

            VIEW.SVG = d3.select(VIEW.id).append("svg")
                .attr("width", STYLE.width + STYLE.margin.left + STYLE.margin.right)
                .attr("height", STYLE.height + STYLE.margin.top + STYLE.margin.bottom)
                .append("g")
                .attr("transform", `translate(${STYLE.margin.left},${STYLE.margin.top})`)

            VIEW.tooltip = new Tooltip(d3.select(VIEW.id));
        }
        // ---------------------------//
        //         ADD ZOOM           //
        // ---------------------------//

        // set zoom call function
        VIEW.zoom = d3.zoom()
        VIEW.zoom.scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([[0, 0], [STYLE.width, STYLE.height]])
            .on("zoom", onZoom);

        // set plotarea for zooming
        VIEW.zoomArea = VIEW.SVG.selectAll("#bubble-zoom-area").data([1]).join(

            enter => enter
                .append("rect")
                .attr("id", "bubble-zoom-area")
                .attr("x", -STYLE.padding.outer.left)
                .attr("y", -STYLE.padding.outer.top)
                .attr("width", STYLE.padding.outer.left + STYLE.width + STYLE.padding.outer.right)
                .attr("height", STYLE.padding.outer.top + STYLE.height + STYLE.padding.outer.bottom)
                .style("fill", "none")
                .style("pointer-events", "fill")
                .style("cursor", "move").call(VIEW.zoom),

            update => transit(update)
                .call(VIEW.zoom.transform, d3.zoomIdentity)

        )

        VIEW.zoomTransform = d3.zoomTransform(VIEW.zoomArea)

        function onZoom() {

            VIEW.zoomTransform = d3.zoomTransform(this);

            // recover the new scale
            const newX = VIEW.zoomTransform.rescaleX(VIEW.ScaleX);
            const newY = VIEW.zoomTransform.rescaleY(VIEW.ScaleY);

            // Update X Axis
            VIEW.xAxis.call(MODEL.xAxisCall(newX));

            // Update Y Axis
            VIEW.yAxis.call(MODEL.yAxisCall(newY));

            // Update points position
            VIEW.points.select(".bubble-circle")
                .attr("cx", d => newX(MODEL.dataX(d)))
                .attr("cy", d => newY(MODEL.dataY(d)))

            // Update point text position
            VIEW.points.select(".bubble-text")
                .attr("x", d => newX(MODEL.dataX(d)))
                .attr("y", d => newY(MODEL.dataY(d)) - VIEW.ScaleZ(MODEL.dataZ(d)) - 20)

            // Update annotations position

            VIEW.points.select(".bubble-line-x").select("line")
                .attr("x1", d => newX(MODEL.dataX(d)))
                .attr("x2", d => newX(MODEL.dataX(d)))
                .attr("y2", d => newY(MODEL.dataY(d)))

            VIEW.points.select(".bubble-line-x").select("text")
                .attr("x", d => newX(MODEL.dataX(d)))

            VIEW.points.select(".bubble-line-y").select("line")
                .attr("x2", d => newX(MODEL.dataX(d)))
                .attr("y1", d => newY(MODEL.dataY(d)))
                .attr("y2", d => newY(MODEL.dataY(d)))

            VIEW.points.select(".bubble-line-y").select("text")
                .attr("y", d => newY(MODEL.dataY(d)))

            // remove annotations if bubble is "out of chart"

            VIEW.points
                .style("visibility", "visible")
                .filter(
                    function (d, i) {
                        const point = d3.select(this).select(".bubble-circle"),
                            x = point.attr("cx"),
                            y = point.attr("cy")

                        return (x > STYLE.width
                            || x < 0
                            || y > STYLE.height
                            || y < 0
                        );
                    }
                ).style("visibility", "hidden")

        }

        // Reset zoom button

        d3.select("#Reset").on("click", () => {
            VIEW.zoomArea
                .transition("reset-zoom")
                .duration(500)
                .ease(d3.easePolyOut)
                .call(VIEW.zoom.transform, d3.zoomIdentity);
        });

        // add clip path
        VIEW.SVG.selectAll("#bubble-clip-path-area").data([1])
            .join(
                enter => enter
                    .append("defs")
                    .attr("id", "bubble-clip-path-area")
                    .append("SVG:clipPath")
                    .attr("id", "bubble-clip")
                    .append("SVG:rect")
                    .attr("x", -STYLE.padding.outer.left)
                    .attr("y", -STYLE.padding.outer.top)
                    .attr("width", STYLE.padding.outer.left + STYLE.width + STYLE.padding.outer.right)
                    .attr("height", STYLE.padding.outer.top + STYLE.height + STYLE.padding.outer.bottom)
            )


        // Add X axis label:
        VIEW.SVG.selectAll("#bubble-x-label").data([`X Axis: ${MODEL.info[MODEL.x].name} ${MODEL.info[MODEL.x].unit ? `(${MODEL.info[MODEL.x].unit})` : ""
            }`]).join(

                enter => enter.append("text")
                    .attr("id", "bubble-x-label")
                    .attr("text-anchor", "middle")
                    .attr("x", STYLE.width / 2)
                    .attr("y", STYLE.height + STYLE.padding.outer.bottom + 40)
                    .text(text => text)
                ,
                update => transit(update).text(text => text)
            )

        // Add X axis
        VIEW.xAxis = VIEW.SVG.selectAll("#bubble-x-axis").data([1]).join(

            enter => enter
                .append("g")
                .attr("id", "bubble-x-axis")
                .attr("transform", `translate(0, ${STYLE.height + STYLE.padding.outer.bottom})`)
                .call(MODEL.xAxisCall(VIEW.ScaleX)),

            update => transit(update).call(MODEL.xAxisCall(VIEW.ScaleX))
        )


        // Add Y axis label:
        VIEW.SVG.selectAll("#bubble-y-label").data([`Y Axis: ${MODEL.info[MODEL.y].name} ${MODEL.info[MODEL.y].unit ? `(${MODEL.info[MODEL.y].unit}` : ""
            })`]).join(

                enter => enter.append("text")
                    .attr("id", "bubble-y-label")
                    .attr("text-anchor", "middle")
                    .attr("x", - STYLE.height / 2)
                    .attr("y", -50 - STYLE.padding.outer.left)
                    .attr("transform", `rotate(-90)`)
                    .text(text => text)
                ,
                update => transit(update).text(text => text)
            )

        // Add Y axis
        VIEW.yAxis = VIEW.SVG.selectAll("#bubble-y-axis").data([1]).join(

            enter => enter
                .append("g")
                .attr("id", "bubble-y-axis")
                .attr("transform", `translate(${-STYLE.padding.outer.left}, 0)`)
                .call(MODEL.yAxisCall(VIEW.ScaleY)),

            update => transit(update).call(MODEL.yAxisCall(VIEW.ScaleY))
        )

        VIEW.points = VIEW.SVG
            .selectAll(".bubbles")
            .data(data, d => d.id)
            .join(
                function (enter) {

                    enter = enter.append("g")
                        .attr("class", "bubbles")
                        .style("opacity", 1)

                    enter.append("circle")
                        .attr("class", "bubble-circle")
                        .attr("clip-path", "url(#bubble-clip)")
                        .style("opacity", 1)
                        .attr("cx", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("cy", d => VIEW.ScaleY(MODEL.dataY(d)))
                        .attr("fill", d => VIEW.ScaleT(MODEL.dataT(d)))
                        .attr("r", d => 0)
                        .transition("enter")
                        .duration(500)
                        .ease(d3.easePolyOut)
                        .attr("r", d => VIEW.ScaleZ(MODEL.dataZ(d)))

                    enter.append("text")
                        .attr("class", "bubble-text")
                        .attr("text-anchor", "middle")
                        .attr("clip-path", "url(#bubble-clip)")
                        .text(d => d.data["country"])
                        .style("visibility", d => {
                            if (d.data["iso_code"] == "USA") return "visible"
                            else return "hidden"
                        })
                        .attr("x", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("y", d => VIEW.ScaleY(MODEL.dataY(d)) - VIEW.ScaleZ(MODEL.dataZ(d)) - 20)
                        .attr("fill", d => VIEW.ScaleT(MODEL.dataT(d)))

                    enter
                        .on("click", pointOnClick)
                        .on("mouseover", pointOnMouseOver)
                        .on("mousemove", pointOnMouseMove)
                        .on("mouseout", pointOnMouseOut)

                    return enter
                },
                function (update) {

                    transit(update.select(".bubble-circle"))
                        .attr("cx", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("cy", d => VIEW.ScaleY(MODEL.dataY(d)))
                        .attr("r", d => VIEW.ScaleZ(MODEL.dataZ(d)))
                        .attr("fill", d => VIEW.ScaleT(MODEL.dataT(d)))

                    transit(update.select(".bubble-text"))
                        .text(d => d.data["country"])
                        .attr("x", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("y", d => VIEW.ScaleY(MODEL.dataY(d)) - VIEW.ScaleZ(MODEL.dataZ(d) - 20))
                        .attr("fill", d => VIEW.ScaleT(MODEL.dataT(d)))



                    // ---------------------------//
                    //    CIRCLES ANNOTATIONS     //
                    // ---------------------------//

                    transit(update.select(".bubble-line-x").select("line"))
                        .attr("x1", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("x2", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("y1", VIEW.style.height + VIEW.style.padding.outer.bottom + 20)
                        .attr("y2", d => VIEW.ScaleY(MODEL.dataY(d)))

                    transit(update.select(".bubble-line-x").select("text"))
                        .attr("x", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("y", VIEW.style.height + VIEW.style.padding.outer.bottom + 20)
                        .text(d => format(MODEL.dataX(d)))

                    transit(update.select(".bubble-line-y").select("line"))
                        .attr("x1", -VIEW.style.padding.outer.left - 10)
                        .attr("x2", d => VIEW.ScaleX(MODEL.dataX(d)))
                        .attr("y1", d => VIEW.ScaleY(MODEL.dataY(d)))
                        .attr("y2", d => VIEW.ScaleY(MODEL.dataY(d)))

                    transit(update.select(".bubble-line-y").select("text"))
                        .attr("x", -VIEW.style.padding.outer.left - 10)
                        .attr("y", d => VIEW.ScaleY(MODEL.dataY(d)))
                        .text(d => format(MODEL.dataY(d)))

                    return update
                },
                function (exit) {
                    transit(exit).remove()
                }
            )

        // ---------------------------//
        //    CIRCLES ANNOTATIONS     //
        // ---------------------------//

        function addAnnotations(point) {

            const d = point.datum();

            const pointRender = point.select(".bubble-circle").node().getBBox();

            const pointX = pointRender.x + pointRender.width / 2
            const pointY = pointRender.y + pointRender.height / 2

            if (point.select(".bubble-line-x").empty() && !isNaN(parseInt(MODEL.dataX(d)))) {

                const xLine = point.append("g")
                    .attr("class", "bubble-line-x")

                xLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", pointX)
                    .attr("x2", pointX)
                    .attr("y1", STYLE.height + STYLE.padding.outer.bottom + 20)
                    .attr("y2", pointY)

                xLine.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("fill", "blue")
                    .attr("font-weight", 0.5)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "text-before-edge")
                    .attr("font-size", "10px")
                    .attr("x", pointX)
                    .attr("y", STYLE.height + STYLE.padding.outer.bottom + 20)
                    .text(format(MODEL.dataX(d)))

                point.raise()
                point.select(".bubble-text").raise()
                point.select(".bubble-circle").raise()
            }

            if (point.select(".bubble-line-y").empty() && !isNaN(parseInt(MODEL.dataY(d)))) {

                const yLine = point.append("g")
                    .attr("class", "bubble-line-y")

                yLine.append("line")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4")
                    .attr("x1", -STYLE.padding.outer.left - 10)
                    .attr("x2", pointX)
                    .attr("y1", pointY)
                    .attr("y2", pointY)

                yLine.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("fill", "blue")
                    .attr("font-weight", 0.5)
                    .attr("font-size", "10px")
                    .attr("dominant-baseline", "middle")
                    .attr("text-anchor", "end")
                    .attr("x", -STYLE.padding.outer.left - 10)
                    .attr("y", pointY)
                    .text(format(MODEL.dataY(d)))

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
                point.select(".bubble-text").style("visibility", "visible")
            }

            else {
                // [pivot USA]
                point.select(".bubble-text").style("visibility", d => d.data["iso_code"] == "USA" ? "visible" : "hidden")
                removeAnnotations(point);
            }
        }

        function pointOnMouseOver(e, d) {

            const html = `Country: ${d.data["country"]}` +
                `<br>Group: ${MODEL.dataT(d)}` +
                `<br>Y axis: ${format(MODEL.dataY(d), MODEL.info[MODEL.y].format)} ${MODEL.info[MODEL.y].unit_name ? `(${MODEL.info[MODEL.y].unit_name})` : ""
                }` +
                `<br>X axis: ${format(MODEL.dataX(d), MODEL.info[MODEL.x].format)} ${MODEL.info[MODEL.x].unit_name ? `(${MODEL.info[MODEL.x].unit_name})` : ""
                }` +
                `<br>${MODEL.info[MODEL.z].name}: ${format(MODEL.dataZ(d))} 
                ${MODEL.info[MODEL.z].unit_name ? `(${MODEL.info[MODEL.z].unit_name})` : ""
                }`

            VIEW.tooltip.html(html).show(e.x, e.y);

            const point = d3.select(this);

            point.raise()

            VIEW.SVG.selectAll(".bubble-circle").style("opacity", 0.05)

            point.select(".bubble-circle").style("opacity", 1)

            point.select(".bubble-text").style("visibility", "visible")

            if (!d.render.selected) {
                addAnnotations(point);
            }

            showBubbleInLegends(point)
        }

        function pointOnMouseMove(e, d) {

            VIEW.tooltip.move(e.x, e.y);
        }

        function pointOnMouseOut(e, d) {

            VIEW.tooltip.hide();

            const point = d3.select(this);

            VIEW.SVG.selectAll(".bubble-circle").style("opacity", 0.8)

            if (!d.render.selected) {
                // [pivot USA]
                point.select(".bubble-text").style("visibility", d => d.data["iso_code"] == "USA" ? "visible" : "hidden")
                removeAnnotations(point);
            }

            hideBubbleInLegends(point)
        }

        function showBubbleInLegends(point) {

            const d = point.datum()

            const pointLegend = VIEW.legendBubble.parent.append("g")
                .attr("class", "bubble-circle-legend")

            pointLegend.append("circle")
                .attr("cx", zCircleX)
                .attr("cy", zCircleY - VIEW.ScaleZ(MODEL.dataZ(d)))
                .attr("r", VIEW.ScaleZ(MODEL.dataZ(d)))
                .attr("fill", VIEW.ScaleT(MODEL.dataT(d)))

            pointLegend.append("line")
                .attr('x1', zCircleX)
                .attr('x2', zCircleX)
                .attr('y1', zCircleY - VIEW.ScaleZ(MODEL.dataZ(d)) - 80)
                .attr('y2', zCircleY - VIEW.ScaleZ(MODEL.dataZ(d)))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'))

            pointLegend.append("text")
                .text(`${`${MODEL.info[MODEL.z].name}`}: ${format(MODEL.dataZ(d), MODEL.info[MODEL.z].format)}`)
                .attr("font-size", 12)
                .attr('text-anchor', 'middle')
                .attr('x', zCircleX)
                .attr('y', zCircleY - VIEW.ScaleZ(MODEL.dataZ(d)) - 80)

            VIEW.legendBubble.selections().raise()


        }

        function hideBubbleInLegends(point) {

            d3.selectAll(".bubble-circle-legend").remove()
        }

        // ---------------------------//
        //       LEGEND BUBBLES       //
        // ---------------------------//

        if (isnew) {

            // add new div and svg for legend bubbles
            const legendBubblesDiv = d3.select(VIEW.id)
                .append("div")
                .attr("id", "legend-radius-div")
                .style("width", STYLE.zLegend.svgWidth + "px")
                .style("height", STYLE.zLegend.svgHeight + "px")
                .style("position", "absolute")
                .style("left", `${STYLE.tLegendX}px`)
                .style("bottom", `${STYLE.tLegendY}px`)

            const legendBubbleSVG = legendBubblesDiv
                .append("svg")
                .attr("width", STYLE.zLegend.svgWidth)
                .attr("height", STYLE.zLegend.svgHeight)

            VIEW.legendBubble = new LegendBubbles(VIEW.ScaleZ, legendBubbleSVG, zCircleX, zCircleY);
        }

        VIEW.legendBubble.update(MODEL.legendBubbleValues(data))

        // label for legends of bubbles

        d3.select("#legend-radius-div").selectAll("#bubble-z-label")
            .data([`${MODEL.info[MODEL.z].name} ${MODEL.info[MODEL.z].unit ? `(${MODEL.info[MODEL.z].unit})` : ""
                }`])
            .join(
                enter => enter.append("div")
                    .attr("id", "bubble-z-label")
                    .attr('x', zCircleX)
                    .attr("y", zCircleY + 20)
                    .html(text => text)
                    .attr("text-anchor", "middle"),
                update => update
                    .html(text => text)
                    .attr("text-anchor", "middle")
            )

        // ---------------------------//
        //       LEGEND GROUPS       //
        // ---------------------------//

        let groups = MODEL.domainT(data)
            .map((d) => ({ id: MODEL.t + d, value: d, color: VIEW.ScaleT(d) }))

        if (MODEL.info[MODEL.t].order != undefined) {
            console.log(MODEL.info[MODEL.t].order)
            let order = MODEL.info[MODEL.t].order.slice()
            groups.sort((a, b) => {
                if (order.indexOf(a.value) != -1 && order.indexOf(b.value) != -1) {
                    return order.indexOf(a.value) - order.indexOf(b.value)
                }

                else if (order.indexOf(a.value) != -1) {
                    return -1
                }

                else if (order.indexOf(b.value) != -1) {
                    return 1
                }

                else {
                    return a.value.localeCompare(b.value);
                }
            })
        }

        else {
            groups.sort((a, b) => a.value.localeCompare(b.value))
        }


        if (isnew) {
            const div = d3.select(VIEW.id)
                .append("div")
                .style("overflow", "auto")
                .style("position", "absolute")
                .style("left", `${STYLE.tLegendX}px`)
                .style("top", `${STYLE.tLegendY}px`)
                .style("width", "260px")
                .style("height", "200px")

            const svg = div
                .append("svg")
                .attr("x", zCircleX)
                .attr("y", 10)
                .attr("width", 250)
            // notice that svg height is not updated yet

            VIEW.legendGroups = new LegendGroups(svg)
        }

        VIEW.legendGroups.update(groups)

        VIEW.legendGroups.selections()
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)


        // ---------------------------//
        //       HIGHLIGHT GROUP      //
        // ---------------------------//

        // What to do when one group is hovered
        function highlight(e, d) {
            // reduce opacity of all groups
            VIEW.points.style("opacity", .05)
            // except the one that is hovered
            const highlightpoints = VIEW.points.filter(_d => MODEL.dataT(_d) == d.value)

            highlightpoints.style("opacity", 1)
        }

        // And when it is not hovered anymore
        function noHighlight(e, d) {
            VIEW.points.style("opacity", 1)
        }

        // -------------------------------- //
        //          DESELECT BUTTONS        //
        // -------------------------------- //
        d3.select("#Deselect").on("click", () => {
            VIEW.points.each(function (d) {
                const point = d3.select(this);
                removeAnnotations(point);
                pointOnMouseOut(0, d);
                d.render.selected = false;
                pointOnMouseOut(0, d);
            })
        })

        return MODEL;
    }
}


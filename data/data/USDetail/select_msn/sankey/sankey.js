// https://gist.github.com/mobidots/f86a31ce14a3227affd1c1287794d1a6
// https://gist.github.com/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455

"use strict";


// set id and class name 
const ID = { chart: "chart", sankey: "sankey" };
const CLASS = { nodes: "node", links: "link" };

// create svg chart
const CHART = d3.select("#" + ID.chart);

const svgw = CHART.node().getBoundingClientRect(),
    svgh = CHART.node().getBoundingClientRect().height;

console.log(svgw, svgh);

const svgWidth = 1000,
    svgHeight = 700;

// append svg
const svg = CHART.append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);


// set the dimensions and margins of the graph
const sankeyMargin = { top: 10, right: 10, bottom: 10, left: 10 },
    sankeyareaWidth = svgWidth - sankeyMargin.left - sankeyMargin.right,
    sankeyareaHeight = svgHeight - sankeyMargin.top - sankeyMargin.bottom,
    sankeyNodeWidth = 60,
    // sankeyNodePadding = 10,
    nodeTextPadding = 6;

// format variables
const Format = d3.format(",.0f"),
    Color = d3.scaleOrdinal(d3.schemeCategory10);


// append (create) sankey
const sankeyarea = svg.append("g")
    .attr("transform", "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")")
    .attr("id", ID.sankey);

// Set the sankey diagram properties
const Sankey = d3.sankey()
    .nodeWidth(sankeyNodeWidth)
    // .nodePadding(sankeyNodePadding)
    .size([sankeyareaWidth, sankeyareaHeight]);

// load data and draw sankey
d3.json("sankey.json")
    .then(function (sankeydata) {

        // initialize graph data
        let graph = Sankey(sankeydata);

        // add links
        const links = sankeyarea.append("g")
            .selectAll("." + CLASS.links)
            .data(graph.links)
            .enter()
            .append("g");

        // add path
        links.append("path")
            .attr("class", CLASS.links)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", (d) => d.width);

        // add link titles (tooltips)
        links.append("title")
            .text(function (d) {
                return d.source.name + " → " + d.target.name + "\n" + d.data.value;
            });

        links.append("text")
            .text(function (d) {
                return d.source.name + " → " + d.target.name + "\n" + d.data.value;
            });


        // add nodes
        const nodes = sankeyarea
            .append("g")
            .selectAll("." + CLASS.nodes)
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", CLASS.nodes)
            // call the function for moving the node
            .call(

                d3.drag()
                    .subject(function (d) {
                        return d;
                    })
                    .on("start", function () {
                        this.parentNode.appendChild(this);
                    })
                    .on("drag", DragMove)
            );



        // add the rectangles for the nodes
        nodes.append("rect")
            .attr("x", function (d) {
                return d.x0;
            })
            .attr("y", function (d) {
                return d.y0;
            })
            .attr("height", function (d) {
                d.rectHeight = d.y1 - d.y0;
                return d.rectHeight;
            })
            .attr("width", Sankey.nodeWidth())
            .style("fill", function (d) {
                return (d.color = Color(d.name.replace(/ .*/, "")));
            })
            .attr("stroke", "none");

        // add title for nodes when mouseover
        nodes.append("title")
            .text(function (d) {
                return d.name + "\n" + d.data.value.toLocaleString('en-US') + " Btu";
            });

        // add in the text for the nodes
        nodes.append("text")
            .text(function (d) {
                return d.name + ": " + d.data.value.toLocaleString('en-US') + " Btu";
            })
            .attr("y", function (d) {
                return (d.y1 + d.y0) / 2;
            })
            // .attr("dy", "0.35em")
            .attr("x", function (d) {
                return d.x0 - nodeTextPadding;
            })
            .attr("text-anchor", "end")
            .filter(function (d) {
                return d.x0 < sankeyareaWidth / 2;
            })
            .attr("x", function (d) {
                return d.x1 + nodeTextPadding;
            })
            .attr("text-anchor", "start");

        // update link colors after defining node colors

        links.append("linearGradient")
            .attr("id", d => {
                d.linearGradientId = `linearGradient-${d.data.id}`;
                return d.linearGradientId;
            })
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0)
            .call(gradient => gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d => d.source.color)
            )
            .call(gradient => gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d => d.target.color)
            );

        links.attr("stroke", (d) => {
            return `url("#${d.linearGradientId}"`;
        });

        // the function for moving the nodes
        function DragMove(mouse) {

            // https://github.com/d3/d3-drag#drag-events

            // change position of rect, and the datum values follow suit
            d3.select(this)
                .select("rect")
                .attr("y", function (d) {

                    d.y0 = Math.max(
                        0,
                        Math.min(
                            d.y0 + mouse.dy,
                            sankeyareaHeight - d.rectHeight
                        )
                    );

                    d.y1 = d.y0 + d.rectHeight;

                    return d.y0;
                })
                .attr("x", function (d) {

                    d.x0 = Math.max(
                        0,
                        Math.min(
                            d.x0 + mouse.dx,
                            sankeyareaWidth - Sankey.nodeWidth()
                        )
                    );

                    d.x1 = d.x0 + Sankey.nodeWidth();

                    return d.x0;
                });

            // redraw text
            d3.select(this)
                .select("text")
                .attr("y", function (d) {
                    return (d.y0 + d.y1) / 2;
                })
                .attr("dy", "0.35em")
                .attr("x", function (d) {
                    return d.x0 - 6;
                })
                .attr("text-anchor", "end")
                .filter(function (d) {
                    return d.x0 < sankeyareaWidth / 2;
                })
                .attr("x", function (d) {
                    return d.x1 + 6;
                })
                .attr("text-anchor", "start");

            // update graph data

            graph = ReLayout(graph);

            Sankey.update(graph);

            // redraw links

            links.selectAll("path")
                .attr("d", d3.sankeyLinkHorizontal());

            links.selectAll("linearGradient")
                .attr("x1", d => d.source.x1)
                .attr("x2", d => d.target.x0);


        };

        // the function for reordering the links when a node is moved
        function ReLayout(graph) {

            for (let _node of graph.nodes) {

                _node.sourceLinks.sort((a, b) => {
                    return a.ty - b.ty;
                });

                let sy = _node.y0;

                for (let _link of _node.sourceLinks) {
                    _link.sy = sy;
                    sy += _link.width;
                }

                _node.targetLinks.sort((a, b) => {
                    return a.sy - b.sy;
                });

                let ty = _node.y0;

                for (let _link of _node.targetLinks) {
                    _link.ty = ty;
                    ty += _link.width;
                }
            }

            return graph;
        }

    });
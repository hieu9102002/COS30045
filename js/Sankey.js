// https://gist.github.com/mobidots/f86a31ce14a3227affd1c1287794d1a6
// https://gist.github.com/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455

"use strict";

const minVisibleLink = 0,
    minVisibleNode = 0;

// set id and class name 
const ID = { chart: "sankey-chart", sankey: "sankey" };
const CLASS = { nodes: "node", links: "link" };

// create svg chart
const CHART = d3.select("#" + ID.chart);

const svgWidth = 900,
    svgHeight = 500;

CHART.style("width", `${svgWidth} px`)

// append svg
const svgsankey = CHART.append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);


// set the dimensions and margins of the graph
const sankeyMargin = { top: 20, right: 20, bottom: 20, left: 20 },
    sankeyareaWidth = svgWidth - sankeyMargin.left - sankeyMargin.right,
    sankeyareaHeight = svgHeight - sankeyMargin.top - sankeyMargin.bottom,
    sankeyNodeWidth = 100,
    sankeyNodePadding = 10,
    nodeTextPadding = 6;

// format variables
const Format = d3.format(",.0f"),
    Color = function (d) {

        let _color = 0;

        switch (d.data.id) {
            case "Solar":
                _color = '#2155CD';
                break;

            case "Wind":
                _color = '#a6cee3';
                break;

            case "Geothermal":
                _color = '#d7191c';
                break;

            case "Biomass":
                _color = '#33a02c';
                break;

            case "Hydropower":
                _color = '#b2df8a';
                break;

            case "ElectricPower":
                _color = '#36AE7C';
                break;

            case "ElectricLoss":
                _color = '#36AE7C';
                break;

            case "Transportation":
                _color = '#010101';
                break;

            case "Industrial":
                _color = '#69779B';
                break;

            case "Commercial":
                _color = '#ACDBDF';
                break;

            case "Residential":
                _color = '#F0ECE2';
                break;

            default:
                _color = '';
            // d3.scaleOrdinal(d3.schemeCategory10)(d.name.replace(/ .*/, ""));
            // https://www.heavy.ai/blog/12-color-palettes-for-telling-better-stories-with-your-data
        }

        console.log(_color)

        return _color;
    };
// ['#d7191c','#fdae61','#ffffbf','#abd9e9','#2c7bb6']
// ['#d7191c','#fdae61','#ffffbf','#abdda4','#2b83ba']
// ['#d7191c','#fdae61','#ffffbf','#abd9e9','#2c7bb6']
// https://colorbrewer2.org/?type=qualitative&scheme=Paired&n=4
// ['#a6cee3','#1f78b4','#b2df8a','#33a02c']
// https://colorhunt.co/palette/e8f9fd79dae80aa1dd2155cd


// append (create) sankey
const sankeyarea = svgsankey.append("g")
    .attr("transform", "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")")
    .attr("id", ID.sankey);

// Set the sankey diagram properties
const Sankey = d3.sankey()
    .nodeWidth(sankeyNodeWidth)
    .nodePadding(sankeyNodePadding)
    .size([sankeyareaWidth, sankeyareaHeight]);

// load data and draw sankey
d3.json("./data/sankey.json")
    .then(function (sankeydata) {

        // initialize graph data
        let graph = Sankey(sankeydata);

        for (let d of graph.nodes) {

            d.rectHeight = d.y1 - d.y0;

            d.color = Color(d);
        }

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
            .attr("stroke-width", (d) => Math.max(d.width, minVisibleLink));

        // add link titles (tooltips)
        links.append("title")
            .text(function (d) {
                return d.source.name + " → " + d.target.name + "\n" + d.data.value.toLocaleString('en-US');
            });

        // add line gradient for link color
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

        // add link colors after adding line gradient
        links.attr("stroke", (d) => {
            return `url("#${d.linearGradientId}"`;
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
                return Math.max(minVisibleNode, d.rectHeight);
            })
            .attr("width", Sankey.nodeWidth())
            .style("fill", function (d) {
                return (d.color);
            })
            .attr("stroke", "none");

        // add title for nodes when mouseover
        nodes.append("title")
            .text(function (d) {
                return d.name + "\n" + d.data.value.toLocaleString('en-US') + " BBtu";
            });

        // add in the text for the nodes
        nodes.append("text")
            .text(function (d) {
                return d.name + "\n"; 
                // + d.data.value.toLocaleString('en-US') + " BBtu";
            })
            .attr("y", function (d) {
                return (d.y0) - nodeTextPadding;
            })
            // .attr("dy", "0.35em")
            .attr("x", function (d) {
                return d.x1 - nodeTextPadding;
            })
            .attr("text-anchor", "end")
            .filter(function (d) {
                return d.x0 < sankeyareaWidth / 2;
            })
            .attr("x", function (d) {
                return d.x0 + nodeTextPadding;
            })
            .attr("text-anchor", "start");

        // the function for moving the nodes
        function DragMove(mouse) {

            // https://github.com/d3/d3-drag#drag-events

            // node

            const node = d3.select(this);

            // change position of rect, and the datum values follow suit
            node.select("rect")
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
            node.select("text")
                .attr("y", function (d) {
                    return (d.y0) - nodeTextPadding;
                })
                // .attr("dy", "0.35em")
                .attr("x", function (d) {
                    return d.x1 - nodeTextPadding;
                })
                .attr("text-anchor", "end")
                .filter(function (d) {
                    return d.x0 < sankeyareaWidth / 2;
                })
                .attr("x", function (d) {
                    return d.x0 + nodeTextPadding;
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
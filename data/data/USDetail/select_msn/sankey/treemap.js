'use strict';

const margin = { top: 40, right: 10, bottom: 10, left: 10 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    color = d3.scaleOrdinal(d3.schemeCategory10)

const treemap = d3.treemap().size([width, height]);

const svgTreemap = d3.select("#treemap").append("div")
    .style("position", "relative")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("height", (height + margin.top + margin.bottom) + "px")
    .style("left", margin.left + "px")
    .style("top", margin.top + "px");

d3.json("treemap.json", function (error, data) {
    if (error) throw error;

    const root = d3.hierarchy(data, (d) => d.children)
        .sum((d) => d.size);

    const tree = treemap(root);

    const node = svgTreemap.datum(root).selectAll(".node")
        .data(tree.leaves())
        .enter().append("div")
        .attr("class", "node")
        .style("left", (d) => d.x0 + "px")
        .style("top", (d) => d.y0 + "px")
        .style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
        .style("height", (d) => Math.max(0, d.y1 - d.y0 - 1) + "px")
        .style("background", (d) => color(d.parent.data.name))
        .text((d) => d.data.name);

    d3.selectAll("input").on("change", function change() {
        const value = this.value === "count"
            ? (d) => { return d.size ? 1 : 0; }
            : (d) => { return d.size; };

        const newRoot = d3.hierarchy(data, (d) => d.children)
            .sum(value);

        node.data(treemap(newRoot).leaves())
            .transition()
            .duration(1500)
            .style("left", (d) => d.x0 + "px")
            .style("top", (d) => d.y0 + "px")
            .style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
            .style("height", (d) => Math.max(0, d.y1 - d.y0 - 1) + "px")
    });
});
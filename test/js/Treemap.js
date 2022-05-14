// https://d3-graph-gallery.com/graph/treemap_json.html

"use strict";

// Treemap().draw();

export default class Treemap {

    constructor(ID = "#my_dataviz") {

        this.DATA = {};

        // set the dimensions and margins of the graph
        this.margin = { top: 10, right: 10, bottom: 10, left: 10 },
        this.width = 445 - this.margin.left - this.margin.right,
        this.height = 445 - this.margin.top - this.margin.bottom;

        // append the svg object to the body of the page
        this.svg = d3.select(ID)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    }

    formatToTree(nodedata, name = "Sources") {

        let formatted_data = {
            name: name,
            children: []
        };

        for (const node in nodedata) {

            formatted_data.children.push({
                name: node,
                value: nodedata[node]
            });
        }

        formatted_data.children.sort((leaf1, leaf2) => (leaf2.value - leaf1.value));

        return formatted_data;
    }

    reset() {

        console.log(this.ID);

        this.svg.html("");

        return this;
    }

    setTreedata(data) {

        this.DATA = data;

        console.log(data);

        return this;
    }


    draw() {

        // Give the data to this cluster layout:
        const root = d3.hierarchy(this.DATA).sum(function (d) { return d.value }) // Here the size of each leave is given in the 'value' field in input data

        // Then d3.treemap computes the position of each element of the hierarchy
        d3.treemap()
            .size([this.width, this.height])
            .padding(2)
            (root)

        // use this information to add rectangles:
        this.svg
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "slateblue")

        // and to add the text labels
        this.svg
            .selectAll("text")
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("x", function (d) { return d.x0 + 5 })    // +10 to adjust position (more right)
            .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
            .text(function (d) { return d.data.name })
            .attr("font-size", "15px")
            .attr("fill", "white")

        return this;

    }
}




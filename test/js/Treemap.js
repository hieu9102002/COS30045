// https://d3-graph-gallery.com/graph/treemap_json.html

"use strict";

// Treemap().draw();

export default function Treemap(ID = "#treemap") {

    let TREEDATA = {}, ATTR;

    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // set the paddings of the text labels
    const textPadding = 5,
        textSize = 15,
        lineSpacing = 2;

    // append the svg object to the body of the page
    const svg = d3.select(ID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.setData = (attr) => {

        ATTR = attr;

        return this;
    }

    this.formatToTree = (nodedata, id, value, name = "Sources") => {

        if (Object.keys(nodedata).length == 0) {
            return {
                name: id,
                value: value
            }
        }

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

    this.reset = () => {

        svg.html("");

        return this;
    }

    this.setTreedata = (data) => {

        TREEDATA = data;

        return this;
    }

    this.draw = () => {

        // Give the data to this cluster layout:
        const root = d3.hierarchy(TREEDATA)
            .sum(function (d) {

                // Here the size of each leave is given in the 'value' field in input data
                return d.value

            })

        // Then d3.treemap computes the position of each element of the hierarchy
        d3.treemap()
            .size([width, height])
            .padding(2)
            (root)

        const rootsum = root.leaves().reduce(function (sum, next) { return sum + next.value; }, 0);

        let texts;

        for (let d of root.leaves()) {

            if (d.data.value != undefined) {

                d.data.percent = d.data.value / rootsum;
            }

            texts = {
                name: {
                    text: "",
                    row: 0,
                    order: 1,
                },
                value: {
                    text: "",
                    row: 1,
                    order: 2,
                },
                percent: {
                    text: "",
                    row: 2,
                    order: 0,
                }
            }

            texts.name.text = ATTR[d.data.name] == undefined ? d.data.name : ATTR[d.data.name].name

            if (d.value == undefined) {
                if (d.data.value == undefined) {
                    texts.value.text = "";
                }
                d.value = d.data.value;
                texts.value.text = d.data.value.toLocaleString('en-US') + " BBtu";
            }
            texts.value.text = d.value.toLocaleString('en-US') + " BBtu";

            texts.percent.text = `${Math.round(d.data.percent * 100 * 100) / 100} %`

            d.text = [
                texts.percent,
                texts.name,
                texts.value,
            ];

            for (let _text of d.text) {
                _text.x = d.x0 + textPadding;
                _text.y = d.y0 + (textSize + textPadding);
            }
        }

        const tiles = svg.selectAll(".tiles")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("class", "tiles")


        // use this information to add rectangles:
        tiles.append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) {
                d.rectWidth1 = d.x1 - d.x0;
                return d.x1 - d.x0;
            })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", (d) => {
                return ATTR[d.data.name] == undefined ? 0 : ATTR[d.data.name].color;
            })
            .each(function (d) {
                d.rectBBox = this.getBBox();
            });

        const labels = tiles.selectAll("text")
            .data((d) => {
                d.text.sort((a, b) => (a.row - b.row));
                return d.text;
            })
            .enter()
            .append("text")
            .attr("font-size", textSize + "px")
            .attr("fill", "white")
            .text(d => d.text)
            .attr("x", d => d.x)
            .each(function (d) {
                d.BBox = this.getBBox();
                console.log(d);
            })

        // reevaluate texts
        for (let d of root.leaves()) {

            d.text.sort((a, b) => (a.order - b.order));

            let allTextHeight = textPadding + textSize;

            for (let _text of d.text) {
                if (_text.BBox.width + textPadding >= d.rectBBox.width) {
                    _text.visible = false;
                }
                else {
                    if (allTextHeight + textSize + lineSpacing >= d.rectBBox.height) {

                        _text.visible = false;
                    }

                    else {
                        _text.y = d.y0 + allTextHeight;
                        _text.visible = true;
                    }

                    allTextHeight += textSize + lineSpacing;

                }
            }

            d.text.sort((a, b) => (a.row - b.row));

            let nextY = d.y0 + textPadding + textSize;

            for (let _text of d.text) {
                if (_text.visible) {
                    _text.y = nextY;
                    nextY += textSize + lineSpacing;
                }
            }
        }

        labels.attr("y", d => d.y)
            .attr("visibility", (d) => d.visible ? "visible" : "hidden");

        return this;

    }

    return this;
}


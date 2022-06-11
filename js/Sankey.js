// https://gist.github.com/mobidots/f86a31ce14a3227affd1c1287794d1a6
// https://gist.github.com/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455

"use strict";

let Main = {
    TreemapSource: new Treemap("#treemap-source"),
    TreemapTarget: new Treemap("#treemap-target"),
}

Promise.all([
    d3.csv("./data/usstates/final/energyflow.csv"),
    d3.json("./data/usstates/info/info.json", d => {
        for (let k in d) {
            if (!isNaN(parseInt(d[k]))) {
                d.k = +d.k
            }
        }
        return d;
    }),
]).then(function (files) {

    // console.log(OWID)

    // Scatter2(OWID);

    let s = formatSankeyData(files[0], files[1], STATE, YEAR, [
        "Biomass", "Geothermal", "Wind", "Solar", "Hydropower",
        "ElectricPower", "Transportation", "Industrial", "Commercial", "Residential",
        // "FossilFuel",
        // "Coal", "Petroleum", "NaturalGas",
        // "Nuclear",
        // "ElectricLoss", "ElectricImport", "ElectricExport",
        // "NetInterstateImport", "NetInterstateExport",
    ])

    console.log(s)

    Main.TreemapSource.setData(files[1]);
    Main.TreemapTarget.setData(files[1]);

    drawSankey(s)

}).catch(function (err) {
    console.error(err);
})

var STATE = "US"
var YEAR = 2019

// set class and id attributes values
const
    ID = "sankey-chart",
    node_class = "node",
    link_class = "link"

const
    minVisibleLink = 0,
    minVisibleNode = 0;

// set the styles of the chart

const
    svgWidth = 700,
    svgHeight = 400,

    margin = { top: 20, right: 200, bottom: 20, left: 160 },
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom

// select svg chart
const CHARTAREA = d3.select(`#${ID}`)
    .style("width", `${svgWidth} px`);

// add svg
const svg = CHARTAREA.append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "sankey");

// add nodes and links
var g
// add nodes
g = svg.append("g");
const NODES = () => g.selectAll("." + node_class)
// add links
g = svg.append("g");
const LINKS = () => g.selectAll("." + link_class)

// create sankey graph model object
var GRAPH;

const
    nodeWidth = 20,
    nodePadding = 30,
    nodeTextPadding = 6;

// Set the sankey diagram properties
const SANKEYMODEL = d3.sankey()
    .nodeWidth(nodeWidth)
    // .nodePadding(nodePadding)
    .size([width, height]);

// add tooltip
const tooltip = CHARTAREA
    .append("div")
    .style("position", "absolute")

    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")

    .style("visibility", "hidden")
    .attr("id", "sankey-tooltip");

function tooltipOnMouseOver(event, d) {

    tooltip.html(d.tooltip)
        .style("visibility", "visible")
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY) + "px")
}

function tooltipOnMouseMove(event, d) {

    let x = (event.pageX) + 20;
    let y = event.pageY > 1650 ? 1650 : event.pageY;

    tooltip
        .style("transform", "translateY(-55%)")
        .style("left", x + "px")
        .style("top", y + "px")
}

function tooltipOnMouseOut(event, d) {

    tooltip.style("visibility", "hidden");
}

// the function for selecting the needed-to-render data and returning the sankey input object
function formatSankeyData(DATASET, INFO, state, year, needednodes, strict = true) {

    // prevent modification of data
    const dataset = DATASET;
    const info = JSON.parse(JSON.stringify(INFO));

    // get needed leafs

    let neededleafs = []

    for (let node of needednodes) {
        console.log(info[node]["type"])
        if (info[node]["type"] == "group") {
            console.log(info[node]["leafs"])
            neededleafs = neededleafs.concat(info[node]["leafs"])
        }
        else {
            neededleafs.push(node)
        }
    }

    // remove duplicates
    neededleafs = [...new Set(neededleafs)];

    // select links from needed leafs
    let neededlinks = Object.values(info).filter(link => link.type == "link" && neededleafs.includes(link.source) && neededleafs.includes(link.target))

    // set nodes "from to links" attributes
    for (let node in info) {

        if (info[node]["type"] != "node") {
            continue
        }

        info[node].linksFrom = Object.values(info).filter(d => d.type == "link" && d.source == node).map(d => d.id)
        info[node].linksTo = Object.values(info).filter(d => d.type == "link" && d.target == node).map(d => d.id)

        info[node].nFrom = info[node].linksFrom.length;
        info[node].nTo = info[node].linksTo.length;
    }

    // filter links
    if (strict) {
        // if there is not enough flows flow into the node, 
        // then all flows from that node is invalid

        let diff = 1
        // stop if there is no more links to be filtered
        while (diff) {

            let old_len = neededlinks.length

            neededleafs.forEach(node => {

                info[node].currentFrom = neededlinks.filter(link => link.source == node);
                info[node].currentTo = neededlinks.filter(link => link.target == node);

                info[node].ncurrentFrom = info[node].currentFrom.length;
                info[node].ncurrentTo = info[node].currentTo.length;

            })

            neededlinks = neededlinks.filter(link => !(
                info[link.source].ncurrentTo > 0 &&
                info[link.source].ncurrentTo < info[link.source].nTo
            ))

            let new_len = neededlinks.length

            diff = old_len - new_len
        }

    }

    // calculate links values
    const data = dataset.find(d => d.StateCode == state && d.Year == year);
    neededlinks.forEach(link => { link.value = +data[link.id] })

    // calculate group links, modify links as well
    needednodes.filter(node => info[node].type == "group").forEach(
        group => {

            for (let link of neededlinks) {
                if (info[group].leafs.includes(link.source)) {
                    link.source = group
                }
                if (info[group].leafs.includes(link.target)) {
                    link.target = group
                }
                link.id = link.source + "->" + link.target;
            }
        }
    )

    // calculate group values
    // basically just merge links that have the same source and target

    neededlinks.sort((a, b) => a.id.localeCompare(b.id))

    let neededlinksmap = {}

    for (let link of neededlinks) {
        if (neededlinksmap[link.id] == undefined) {
            neededlinksmap[link.id] = link;
        }
        else {
            neededlinksmap[link.id].value += link.value;
        }
    }

    // return sankey input data

    neededlinks = Object.values(neededlinksmap);

    let result = {
        nodes: [...new Set(
            neededlinks.map(link => link.source).concat(
                neededlinks.map(link => link.target)
            )
        )].map(nodeid => {

            let value = Math.max(
                neededlinks.filter(link => link.source == nodeid).map(link => link.value).reduce((a, b) => (a + b), 0),
                neededlinks.filter(link => link.target == nodeid).map(link => link.value).reduce((a, b) => (a + b), 0),
            )

            return {
                sid: state + "_" + nodeid,
                node: nodeid,
                name: nodeid,
                value: value,
                data: {
                    ...info[nodeid],
                    total: +data[nodeid],
                    value: value
                }
            }
        }),
        links: neededlinks.map(link => ({
            sid: state + "_" + link.id,
            source: link.source,
            target: link.target,
            value: link.value,
            data: link
        }))
    }

    result.nodes.sort((a, b) => a.data.order - b.data.order).forEach((node, i) => {
        node.node = i;
    })

    result.links.forEach(link => {

        link.source = result.nodes.find(node => node.data.id == link.source).node
        link.target = result.nodes.find(node => node.data.id == link.target).node

    })

    return result;

}

// the function for initializing the graph object from d3.sankey()
function graphInitialize(sankeydata) {

    let graph = SANKEYMODEL(sankeydata);

    let sankeydataclone = Object.assign({}, sankeydata);

    delete sankeydataclone.nodes;
    delete sankeydataclone.links;

    graph = Object.assign({}, graph, sankeydataclone);

    graph.nodes.forEach(d => {
        d.rectHeight = d.y1 - d.y0;
        d.color = d.data.color;
        d.selected = false;
        d.visible = true;
        console.log("POP", d.data)
        d.tooltip = `${d.data.name}
            <br>${d.data.value.toLocaleString('en-US')} BBtu
            <br>${STATE}, ${YEAR}`;

        d.original = {
            color: d.data.color
        }
    })

    graph.links.forEach(d => {

        d.tooltip = `Energy consumption by ${d.target.data.name} from ${d.source.data.name}
            <br>${d.data.value.toLocaleString('en-US')} BBtu
            <br>${STATE}, ${YEAR}`;

        d.visible = true;

        d.original = {
            color: 0
        }
    })

    return graph;
}

// the function for reordering the links when a node is dragged
function graphReorderLinks(graph) {

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

// the function for new nodes
function nodeOnEnter(node) {

    node = node.append("g")
        .attr("class", node_class)
        .attr("cursor", "move")

    // add the rectangles for the nodes
    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => Math.max(minVisibleNode, d.rectHeight))
        .attr("width", SANKEYMODEL.nodeWidth())
        .style("fill", d => d.color);

    // add in the text for the nodes
    node.append("text")
        .text(d => d.data.name + "\n"
            // + d.data.value.toLocaleString('en-US') + " BBtu";
        )
        .attr("y", d => (d.y1 + d.y0) / 2 - nodeTextPadding)
        .attr("dy", "0.5em")
        .attr("text-anchor", "start")
        .attr("x", d => d.x1 + nodeTextPadding)
        .filter(d => d.x0 < width / 2)
        .attr("text-anchor", "end")
        .attr("x", d => d.x0 - nodeTextPadding)
        ;

    // add title to show that this node can be click
    node.append("title")
        .text("Click to reveal information")

    // add onclick event
    node.on("click", nodeOnClick);

    // add drag event
    node.call(d3.drag().subject(d => d).on("drag", nodeOnDrag));

    // add node mouse hover events
    node.on("mouseover", tooltipOnMouseOver)
        .on("mousemove", tooltipOnMouseMove)
        .on("mouseout", tooltipOnMouseOut);

    return node;
}

// the function for moving the nodes
function nodeOnDrag(mouse, d) {

    // prevent node from going outside of svg area
    d.y0 = Math.max(
        0,
        Math.min(
            d.y0 + mouse.dy,
            height - d.rectHeight
        )
    );

    // update y1
    d.y1 = d.y0 + d.rectHeight;


    // prevent node from going outside of svg area
    d.x0 = Math.max(
        0,
        Math.min(
            d.x0 + mouse.dx,
            width - SANKEYMODEL.nodeWidth()
        )
    );

    // update x1
    d.x1 = d.x0 + SANKEYMODEL.nodeWidth();

    // update graph data
    GRAPH = graphReorderLinks(GRAPH);
    SANKEYMODEL.update(GRAPH);

    tooltip.style("visibility", "hidden");

    // node
    const node = d3.select(this);

    // change position of rect, and the datum values follow suit
    node.select("rect")
        .attr("y", d => d.y0)
        .attr("x", d => d.x0);

    // redraw text
    node.select("text")
        .attr("y", d => (d.y1 + d.y0) / 2 - nodeTextPadding)
        .attr("text-anchor", "start")
        .attr("x", d => d.x1 + nodeTextPadding)
        .filter(d => d.x0 < width / 2)
        .attr("text-anchor", "end")
        .attr("x", d => d.x0 - nodeTextPadding);

    // redraw links
    LINKS().selectAll("path").attr("d", d3.sankeyLinkHorizontal());

    // reset links gradient posisiton
    LINKS().selectAll("linearGradient")
        .attr("x1", d => d.source.x1)
        .attr("x2", d => d.target.x0);

};

function nodeOnClick(event, d) {

    const node = d3.select(this);

    d.selected = !d.selected;

    // if selected
    if (d.selected) {

        // deselect all nodes and links
        // this will make d.selected = false

        for (let _node of GRAPH.nodes) {
            _node.selected = false;
            _node.color = "grey";
            _node.visible = false;
        }

        for (let link of GRAPH.links) {
            link.color = "grey";
            link.visible = false;
        }

        // return the original style for the selected color
        d.selected = true;
        d.visible = true;

        d.color = d.original.color;

        for (let _link of d.sourceLinks) {
            _link.target.color = _link.target.original.color;
            _link.target.visible = true;
            _link.visible = true
            _link.color = _link.target.original.color;
        }

        for (let _link of d.targetLinks) {
            _link.source.color = _link.source.original.color;
            _link.source.visible = true;
            _link.visible = true
            _link.color = _link.source.original.color;
        }

        const nodesdata = {
            sources: d.targetLinks.reduce((prevobj, link) => ({ ...prevobj, [link.data.source]: link.data.value}), {}),
            targets: d.sourceLinks.reduce((prevobj, link) => ({ ...prevobj, [link.data.target]: link.data.value}), {}),
        }

        const treedatasource = Main.TreemapSource.formatToTree(nodesdata.sources, d.data.id, d.value, d.data.id);

        const treedatatarget = Main.TreemapSource.formatToTree(nodesdata.targets, d.data.id, d.value, d.data.id);

        Main.TreemapSource = Main.TreemapSource.reset();

        Main.TreemapTarget = Main.TreemapTarget.reset();

        Main.TreemapSource.setTreedata(treedatasource).draw();

        Main.TreemapTarget.setTreedata(treedatatarget).draw();

        let sourceClicked = d.sourceLinks.length > 0;

        if (sourceClicked) {
            d3.select("#treemap-source").attr("hidden", true);
            d3.select("#treemap-target").attr("hidden", null);
        } else {
            d3.select("#treemap-source").attr("hidden", null);
            d3.select("#treemap-target").attr("hidden", true);
        }

    }

    // else if not selected
    else {

        // reset attributes

        for (let node of GRAPH.nodes) {
            node.selected = false;
            node.color = node.original.color;
            node.visible = true;
        }

        for (let link of GRAPH.links) {
            link.color = link.original.color;
            link.visible = true;
        }

    }

    // update GRAPH
    SANKEYMODEL.update(GRAPH);

    // reset title
    NODES().select("title").text(d => d.selected ? "Click to reveal all nodes" : "Click to reveal node information")

    // reset nodes color
    NODES().selectAll("rect").style("fill", (d) => d.color);

    // reset texts visibility
    NODES().selectAll("text").style("visibility", (d) => d.visible ? "visible" : "hidden");

    // reset node opacity
    NODES().style("opacity", (d) => d.visible ? 1 : 0.05);

    // reset links colors
    LINKS().selectAll("path").style("stroke", (d) => d.color);
    LINKS().style("opacity", (d) => d.visible ? 1 : 0.005);

    // raise links and nodes
    LINKS().filter(d => d.visible).raise()
    NODES().filter(d => d.visible).raise()

}

// function to format selected node data to draw treemap
function onClickFormatSankeyNode(d) {

    return {
        sources: d.targetLinks.reduce((prevobj, link) => ({ ...prevobj, [link.data.source]: link.data.value}), {}),
        targets: d.sourceLinks.reduce((prevobj, link) => ({ ...prevobj, [link.data.target]: link.data.value}), {}),
    }

}

function linkOnEnter(link) {

    link = link.append("g")
        .attr("class", link_class)

    // add path
    link.append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("fill", "none")
        .attr("stroke-width", (d) => Math.max(d.width, minVisibleLink));

    // add line gradient for link color
    link.append("linearGradient")
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
    link.attr("stroke", (d) => {
        d.original.color = `url("#${d.linearGradientId}"`;
        d.color = d.original.color;
        return `url("#${d.linearGradientId}"`;
    });

    // add link mouse over events
    link.on("mouseover", tooltipOnMouseOver)
        .on("mousemove", tooltipOnMouseMove)
        .on("mouseout", tooltipOnMouseOut);

    return link;

}

// main function for drawing sankey
function drawSankey(sankeydata) {

    GRAPH = graphInitialize(sankeydata);

    LINKS().data(GRAPH.links, d => d.sid)
        .join(linkOnEnter)

    // add or update nodes
    NODES().data(GRAPH.nodes, d => d.sid)
        .join(nodeOnEnter)

}

function Treemap(ID = "#treemap") {

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
        // .append("svg")
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height + margin.top + margin.bottom)
        // .append("g")
        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

        let tooltip = "";

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

            texts.name.text = ATTR[d.data.name] == undefined ? d.data.name : ATTR[d.data.name].name;
            tooltip +=  ATTR[d.data.name] == undefined ? "<b>"+d.data.name : "<b>"+ATTR[d.data.name].name + "</b><br/>";

            if (d.value == undefined) {
                if (d.data.value == undefined) {
                    texts.value.text = "";
                }
                d.value = d.data.value;
                texts.value.text = d.data.value.toLocaleString('en-US') + " BBtu";
                tooltip += texts.value.text = d.data.value.toLocaleString('en-US') + " BBtu" + "<br/>";
            }
            texts.value.text = d.value.toLocaleString('en-US') + " BBtu";
            tooltip += texts.value.text = d.data.value.toLocaleString('en-US') + " BBtu" + "<br/>";


            texts.percent.text = `${Math.round(d.data.percent * 100 * 100) / 100} %`
            tooltip += `${Math.round(d.data.percent * 100 * 100) / 100} %` + "<br>";

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

        console.log(tooltip)

        const tiles = svg.selectAll(".tiles")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("class", "tiles")


        // // use this information to add rectangles:
        // // tiles.append("rect")
        // //     .attr('x', function (d) { return d.x0; })
        // //     .attr('y', function (d) { return d.y0; })
        // //     .attr('width', function (d) {
        // //         d.rectWidth1 = d.x1 - d.x0;
        // //         return d.x1 - d.x0;
        // //     })
        // //     .attr('height', function (d) { return d.y1 - d.y0; })
        // //     .style("stroke", "black")
        // //     .style("fill", (d) => {
        // //         return ATTR[d.data.name] == undefined ? 0 : ATTR[d.data.name].color;
        // //     })
        // //     .each(function (d) {
        // //         d.rectBBox = this.getBBox();
        // //     });
        
        // // const labels = tiles.selectAll("text")
        // //     .data((d) => {
        // //         d.text.sort((a, b) => (a.row - b.row));
        // //         return d.text;
        // //     })
        // //     .enter()
        // //     .append("text")
        // //     .attr("font-size", textSize + "px")
        // //     .attr("fill", "white")
        // //     .text(d => d.text)
        // //     .attr("x", d => d.x)
        // //     .each(function (d) {
        // //         d.BBox = this.getBBox();
        // //     })

        // // // reevaluate texts
        // // for (let d of root.leaves()) {

        // //     d.text.sort((a, b) => (a.order - b.order));

        // //     let allTextHeight = textPadding + textSize;

        // //     for (let _text of d.text) {
        // //         if (_text.BBox.width + textPadding >= d.rectBBox.width) {
        // //             _text.visible = false;
        // //         }
        // //         else {
        // //             if (allTextHeight + textSize + lineSpacing >= d.rectBBox.height) {

        // //                 _text.visible = false;
        // //             }

        // //             else {
        // //                 _text.y = d.y0 + allTextHeight;
        // //                 _text.visible = true;
        // //             }

        // //             allTextHeight += textSize + lineSpacing;

        // //         }
        // //     }

        // //     d.text.sort((a, b) => (a.row - b.row));

        // //     let nextY = d.y0 + textPadding + textSize;

        // //     for (let _text of d.text) {
        // //         if (_text.visible) {
        // //             _text.y = nextY;
        // //             nextY += textSize + lineSpacing;
        // //         }
        // //     }
        // // }

        // // labels.attr("y", d => d.y)
        // //     .attr("visibility", (d) => d.visible ? "visible" : "hidden");

        d3.select(ID).append("p").html(tooltip)

        return this;

    }

    return this;
}
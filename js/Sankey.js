// https://gist.github.com/mobidots/f86a31ce14a3227affd1c1287794d1a6
// https://gist.github.com/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455

"use strict";

// load data and draw sankey

Promise.all([
    d3.json("./data/sankey/attr.json"),
    d3.json("./data/sankey/groups.json"),
    d3.json("./data/sankey/values.json"),
]).then(function (files) {
    const jsondata = {
        attr: files[0],
        groups: files[1],
        data: files[2]
    }

    SANKEY(jsondata).state("CA").year(2018).draw();

}).catch(function (err) {
    console.error(err);
})

// d3.json("./data/sankey/data.json")
//     .then(function (jsondata) {

//         let s = SANKEY(jsondata).state("CA").year(2018)
//         s.draw();

//     });



function SANKEY(JSONDATA) {

    const INPUTCREATOR = D3SankeyInputCreator(JSONDATA);

    const SANKEYDRAWER = D3SankeyDrawer();

    const ATTR = JSONDATA.attr;
    const GROUPMAP = JSONDATA.groups;
    const DATASET = JSONDATA.data;

    let STATE = "US",
        YEAR = 2019,
        STATEDATA = DATASET[STATE][YEAR],
        NEEDEDNODES = [
            "Solar",
            "Wind",
            "Geothermal",
            "Hydropower",
            "Biomass",
            "ElectricPower",
            "ElectricLoss",
            "Transportation",
            "Industrial",
            "Commercial",
            "Residential",
        ]

    SANKEY.state = (state) => { STATE = state; return SANKEY; }

    SANKEY.year = (year) => { YEAR = year; return SANKEY; }

    SANKEY.neededNodes = (neededNodes) => { NEEDEDNODES = neededNodes; return SANKEY; }

    SANKEY.draw = () => {

        STATEDATA = DATASET[STATE][YEAR];

        let sankeydata = INPUTCREATOR.create(STATEDATA, NEEDEDNODES);

        SANKEYDRAWER.drawsankey(sankeydata);

        return SANKEY;
    }

    return SANKEY;
}

function D3SankeyInputCreator(JSONDATA) {

    const ATTR = JSONDATA.attr;
    const GROUPS = JSONDATA.groups;

    let STATEDATA, NEEDEDNODES, NEEDEDGROUPS;

    D3SankeyInputCreator.create = (statedata, neededNodes) => {

        STATEDATA = statedata;

        NEEDEDNODES = neededNodes;

        NEEDEDGROUPS = addGroupDescendants();

        let selectedLinks = select_links_from_needed_nodes(true);

        let valueMap = calculate_values(selectedLinks);

        let pointsMap = group_nodes(selectedLinks, valueMap, NEEDEDGROUPS);

        let selectedNodes = select_nodes_from_selected_links(selectedLinks, pointsMap); // these nodes include groups

        let sankeyinputdata = format_input_data(selectedLinks, selectedNodes, valueMap, pointsMap);

        return sankeyinputdata;

    }

    function addGroupDescendants() {

        let neededGroups = [];

        for (const node of NEEDEDNODES) {

            if (GROUPS.descendants_of[node] != undefined) {

                neededGroups.push(node);

                for (const descendant of GROUPS.descendants_of[node]) {
                    if (!NEEDEDNODES.includes(descendant)) {
                        NEEDEDNODES.push(descendant);
                    }
                }
            }
        }

        return neededGroups;
    }

    function select_links_from_needed_nodes(strict = false) {

        let BeginsAt = {}, // map[node]: how many links begin with this node
            EndsAt = {}; // map[node]: how many links end at this node

        let selectedLinksMap = {}, // map[linkid]: is the link still valid to be included? 
            selectedLinks = []; // list of links that are needed

        for (const link in STATEDATA.links) {

            const source = ATTR[link].source;
            const target = ATTR[link].target;

            for (let map of [BeginsAt, EndsAt]) {
                for (const node of [source, target]) {
                    if (map[node] == undefined) map[node] = 0;
                }
            }

            EndsAt[target]++;

            BeginsAt[source]++;

            if (NEEDEDNODES.includes(source) && NEEDEDNODES.includes(target)) {

                selectedLinksMap[link] = true;

                selectedLinks.push(link);

            }
        }

        let selectedLinksIsValid = !strict;

        while (!selectedLinksIsValid) {

            selectedLinksIsValid = true;

            let SelectedBeginsAt = {}, // map[node]: how many selected links begin with this node
                SelectedEndsAt = {}; // map[node]: how many selected links end at this node

            for (const link of selectedLinks) {

                const source = ATTR[link].source;
                const target = ATTR[link].target;

                for (let map of [SelectedBeginsAt, SelectedEndsAt]) {
                    for (let node of [source, target]) {
                        if (map[node] == undefined) map[node] = 0;
                    }
                }

                SelectedEndsAt[target]++;

                SelectedBeginsAt[source]++;

            }

            for (const link of selectedLinks) {

                const source = ATTR[link].source;
                const target = ATTR[link].target;

                if (SelectedEndsAt[source] > 0) {
                    if (SelectedEndsAt[source] < EndsAt[source]) {
                        SelectedBeginsAt[target]--;
                        selectedLinksMap[link] = false;
                        selectedLinksIsValid = false;
                    }
                }
            }

            selectedLinks = [];

            for (const link in selectedLinksMap) {

                if (selectedLinksMap[link]) {

                    selectedLinks.push(link);

                }
            }
        }

        return selectedLinks;
    }

    function select_nodes_from_selected_links(selectedLinks, pointsMap) {

        const sourceMap = pointsMap.sourceMap,
            targetMap = pointsMap.targetMap;

        let selectedNodes = [];

        for (const link of selectedLinks) {
            const source = sourceMap[link];
            const target = targetMap[link];

            for (const node of [source, target]) {
                if (!selectedNodes.includes(node)) {
                    selectedNodes.push(node);
                }
            }
        }

        return selectedNodes;
    }

    function format_input_data(selectedLinks, selectedNodes, valueMap, pointsMap) {

        let sankeyinputdata = {
            nodes: [],
            links: []
        }

        console.log(selectedNodes);

        selectedNodes.sort((node1id, node2id) => {

            const node1 = ATTR[node1id];
            const node2 = ATTR[node2id];

            if (node1.column != node1.column) {
                return node1.column - node2.column;
            }
            return (node1.order - node2.order);
        });

        let nodeidmap = {};

        for (let i = 0; i < selectedNodes.length; i++) {

            const nodeid = selectedNodes[i];

            nodeidmap[nodeid] = i;

            const value = valueMap[nodeid];

            const total = STATEDATA[nodeid];

            let node = ATTR[nodeid];

            node.value = value;

            node.total = total;

            let nodeformatted = {
                node: i,
                name: node.name,
                data: node
            }

            sankeyinputdata.nodes.push(nodeformatted);
        }

        console.log(valueMap)

        for (const linkid of selectedLinks) {

            const value = valueMap[linkid];
            const source = pointsMap.sourceMap[linkid];
            const target = pointsMap.targetMap[linkid];

            let link = ATTR[linkid];

            link.value = value;

            let linkformatted = {
                source: nodeidmap[source],
                target: nodeidmap[target],
                value: value,
                data: link,
            }

            sankeyinputdata.links.push(linkformatted);
        }

        console.log(sankeyinputdata)

        return sankeyinputdata;
    }

    function calculate_values(selectedLinks) {

        let valueMap = {},
            valueMapBeginsAt = {},
            valueMapEndsAt = {};

        for (const link of selectedLinks) {

            valueMap[link] = STATEDATA.links[link];

            const source = ATTR[link].source;
            const target = ATTR[link].target;

            for (const node of [source, target]) {
                for (let map of [valueMap, valueMapBeginsAt, valueMapEndsAt]) {
                    if (map[node] == undefined) {
                        map[node] = 0;
                    }
                }

            }

            valueMapBeginsAt[source] += valueMap[link];
            valueMapEndsAt[target] += valueMap[link];

        }

        for (const link of selectedLinks) {


            const source = ATTR[link].source;
            const target = ATTR[link].target;

            for (const node of [source, target]) {
                valueMap[node] = Math.max(valueMapBeginsAt[node], valueMapEndsAt[node]);

            }

        }

        return valueMap;
    }

    function group_nodes(selectedLinks, valueMap, neededGroups) {

        let sourceMap = {},
            targetMap = {};

        for (const link of selectedLinks) {

            const source = ATTR[link].source;
            const target = ATTR[link].target;

            sourceMap[link] = source;
            targetMap[link] = target;

        }

        for (const group of neededGroups) {

            valueMap[group] = 0;

            const descendants = GROUPS.descendants_of[group];

            for (const descendant of descendants) {

                if(valueMap[descendant] == undefined) {
                    valueMap[descendant] = 0;
                }

                valueMap[group] += valueMap[descendant];

            }

            for (const link of selectedLinks) {

                for (let map of [sourceMap, targetMap]) {

                    const node = map[link];

                    if (descendants.includes(node)) {

                        map[link] = group;

                    }
                }

            }

        }

        return {
            sourceMap: sourceMap,
            targetMap: targetMap,
        }

    }

    return D3SankeyInputCreator;

}

function D3SankeyDrawer() {

    const minVisibleLink = 0;
    const minVisibleNode = 0;

    const svgWidth = 900,
        svgHeight = 500;

    // set the dimensions and margins of the graph
    const sankeyMargin = { top: 20, right: 20, bottom: 20, left: 20 },
        sankeyareaWidth = svgWidth - sankeyMargin.left - sankeyMargin.right,
        sankeyareaHeight = svgHeight - sankeyMargin.top - sankeyMargin.bottom,
        sankeyNodeWidth = 100,
        sankeyNodePadding = 50,
        nodeTextPadding = 6;

    // create svg chart
    const CHART = d3.select("#sankey-chart");

    CHART.style("width", `${svgWidth} px`)

    // append svg
    const svgsankey = CHART.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);


    // append (create) sankey
    const sankeyarea = svgsankey.append("g")
        .attr("transform", "translate(" + sankeyMargin.left + "," + sankeyMargin.top + ")")
        .attr("id", "sankey");

    // Set the sankey diagram properties
    const d3sankeygraph = d3.sankey()
        .nodeWidth(sankeyNodeWidth)
        // .nodePadding(sankeyNodePadding)
        .size([sankeyareaWidth, sankeyareaHeight]);

    D3SankeyDrawer.drawsankey = (sankeydata) => {

        let graph = d3sankeygraph(sankeydata);

        for (let d of graph.nodes) {
            d.rectHeight = d.y1 - d.y0;
            d.color = d.data.color;
            d.selected = false;
            d.original = {
                color: d.data.color
            }
        }

        for (let d of graph.links) {

            d.original = {
                color: 0
            }
        }

        // add links
        const links = sankeyarea.append("g")
            .selectAll(".link")
            .data(graph.links)
            .enter()
            .append("g")
            .attr("class", "link");

        // add path
        links.append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("fill", "none")
            .attr("stroke-width", (d) => Math.max(d.width, minVisibleLink));

        // add link titles (tooltips)
        links.append("title")
            .attr("class", ".tooltip")
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
            d.original.color = `url("#${d.linearGradientId}"`;
            d.color = d.original.color;
            return `url("#${d.linearGradientId}"`;
        });

        // add nodes
        const nodes = sankeyarea.append("g")
            .selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("cursor", "move");

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
            .attr("width", d3sankeygraph.nodeWidth())
            .style("fill", function (d) {
                return (d.color);
            });

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

        graph.resetcolor = () => {
            for (let node of graph.nodes) {
                node.selected = false;
                node.color = node.original.color;
            }

            for (let link of graph.links) {
                link.color = link.original.color;
            }
        }

        graph.deselectnodes = () => {

            for (let node of graph.nodes) {
                node.selected = false;
                node.color = "grey";
            }

            for (let link of graph.links) {
                link.color = "grey";
            }
        }

        // add onclick event
        nodes.on("click", function (event, d) {

            const node = d3.select(this);

            d.selected = !d.selected;

            if (d.selected) {

                graph.deselectnodes(); // this will make d.selected = false

                d.selected = true;

                d.color = d.original.color;

                for (let link of d.sourceLinks) {
                    link.target.color = link.target.original.color;
                    link.color = link.target.original.color;
                }

                for (let link of d.targetLinks) {
                    link.source.color = link.source.original.color;
                    link.color = link.source.original.color;
                }
            }

            else {
                graph.resetcolor();
            }

            d3sankeygraph.update(graph);

            nodes.selectAll("rect")
                .style("fill", (d) => d.color);

            links.selectAll("path")
                .attr("stroke", (d) => d.color);

        });

        // add drag event
        nodes.call(
            // call the function for moving the node
            d3.drag()
                .subject(function (d) { return d; })
                // onstart interfering with click
                // .on("start", function () { this.parentNode.appendChild(this); })
                .on("drag", DragMove)
        );

        // the function for moving the nodes
        function DragMove(mouse) {

            // https://github.com/d3/d3-drag#drag-events

            // node
            const node = d3.select(this);

            // change position of rect, and the datum values follow suit
            node.select("rect")
                .attr("y", function (d) {

                    // prevent node from going outside of svg area
                    d.y0 = Math.max(
                        0,
                        Math.min(
                            d.y0 + mouse.dy,
                            sankeyareaHeight - d.rectHeight
                        )
                    );

                    // update y1
                    d.y1 = d.y0 + d.rectHeight;

                    return d.y0;
                })
                .attr("x", function (d) {

                    // prevent node from going outside of svg area
                    d.x0 = Math.max(
                        0,
                        Math.min(
                            d.x0 + mouse.dx,
                            sankeyareaWidth - d3sankeygraph.nodeWidth()
                        )
                    );

                    // update x1
                    d.x1 = d.x0 + d3sankeygraph.nodeWidth();

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

            graph.relayout();

            d3sankeygraph.update(graph);

            // redraw links

            links.selectAll("path")
                .attr("d", d3.sankeyLinkHorizontal());

            links.selectAll("linearGradient")
                .attr("x1", d => d.source.x1)
                .attr("x2", d => d.target.x0);


        };

        // the function for reordering the links when a node is dragged
        graph.relayout = () => {

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

    }

    return D3SankeyDrawer;
}

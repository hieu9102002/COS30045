// https://gist.github.com/mobidots/f86a31ce14a3227affd1c1287794d1a6
// https://gist.github.com/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455

"use strict";

import Treemap from "./Treemap.js";

let Main = {
    TreemapSource: new Treemap("#treemap-source"),
    TreemapTarget: new Treemap("#treemap-target"),
    Sankey: new Sankey(),
}


Promise.all([
    d3.json("./data/sankey/attr.json"),
    d3.json("./data/sankey/groups.json"),
    d3.json("./data/sankey/values.json"),
]).then(function (files) {
    const jsondata = {
        ATTR: files[0],
        GROUPS: files[1],
        VALUES: files[2]
    }

    Main.TreemapSource.setData(jsondata.ATTR);
    Main.TreemapTarget.setData(jsondata.ATTR);

    Main.Sankey.setData(jsondata).draw();

}).catch(function (err) {
    console.error(err);
})

function SankeyInput() {

    let ATTR, GROUPS, VALUES, STATEVALUES,
        NEEDEDNODES, STATE, YEAR,
        STRICT = true,
        ALLOW_DUPLICATES = false;

    this.setData = (attr, groups, values) => {

        ATTR = attr;
        GROUPS = groups;
        VALUES = values;

        return this;

    }

    this.createInput = (state, year, neededNodes) => {

        STATE = state;

        YEAR = year;

        NEEDEDNODES = neededNodes;

        STATEVALUES = VALUES[STATE][YEAR];

        let neededGroups = add_groups_descendants();

        let selectedLinks = select_links_from_needed_nodes();

        let valueMap = calculate_values(selectedLinks);

        let pointsMap = group_nodes(selectedLinks, valueMap, neededGroups);

        let selectedNodes = select_nodes_from_selected_links(selectedLinks, pointsMap);
        // selectedNodes includes groups

        let sankeyinputdata = format_input_data(selectedLinks, selectedNodes, valueMap, pointsMap);

        return sankeyinputdata;

    }

    function add_groups_descendants() {

        let neededGroups = [];

        for (const node of NEEDEDNODES) {

            if (GROUPS.descendants_of[node] == undefined) {
                continue;
            }

            else {

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

    function select_links_from_needed_nodes() {

        let BeginsAt = {}, // map[node]: how many links begin with this node
            EndsAt = {}; // map[node]: how many links end at this node

        let selectedLinksMap = {}, // map[linkid]: is the link still valid to be included? 
            selectedLinks = []; // list of links that are needed

        for (const link in STATEVALUES.links) {

            const source = ATTR[link].source;
            const target = ATTR[link].target;

            for (let map of [BeginsAt, EndsAt]) {
                for (const node of [source, target]) {
                    if (map[node] == undefined) map[node] = 0;
                }
            }

            if (GROUPS.descendants_of[source] == undefined) {

                BeginsAt[source]++;
            }

            if (GROUPS.descendants_of[target] == undefined) {

                EndsAt[target]++;
            }

            if (NEEDEDNODES.includes(source) && NEEDEDNODES.includes(target)) {

                selectedLinksMap[link] = true;

                selectedLinks.push(link);

            }
        }

        let selectedLinksIsValid = !STRICT;

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

    function calculate_values(selectedLinks) {

        let valueMap = {},
            valueMapBeginsAt = {},
            valueMapEndsAt = {};

        for (const link of selectedLinks) {

            valueMap[link] = STATEVALUES.links[link];

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

                if (valueMap[descendant] == undefined) {
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

        selectedNodes.sort((node1id, node2id) => {

            const node1 = ATTR[node1id];
            const node2 = ATTR[node2id];

            if (node2.column != node1.column) {
                return node1.column - node2.column;
            }
            return (node1.order - node2.order);
        });

        let nodeidmap = {};

        for (let i = 0; i < selectedNodes.length; i++) {

            const nodeid = selectedNodes[i];

            nodeidmap[nodeid] = i;

            const value = valueMap[nodeid];

            const total = STATEVALUES[nodeid];

            let data = {};

            Object.assign(data, ATTR[nodeid]);

            data.value = value;
            data.total = total;
            data.state = STATE;
            data.year = YEAR;

            let nodeformatted = {
                node: i,
                name: data.name,
                data: data
            }

            sankeyinputdata.nodes.push(nodeformatted);
        }

        for (const linkid of selectedLinks) {

            const value = valueMap[linkid];
            const source = pointsMap.sourceMap[linkid];
            const target = pointsMap.targetMap[linkid];

            let data = {}

            Object.assign(data, ATTR[linkid]);

            data.value = value;
            data.source = source;
            data.target = target;
            data.state = STATE;
            data.year = YEAR;

            let linkformatted = {
                source: nodeidmap[source],
                target: nodeidmap[target],
                value: value,
                data: data,
            }

            sankeyinputdata.links.push(linkformatted);
        }

        if (!ALLOW_DUPLICATES) {

            let appearedValueMap = {};

            for (const linkformatted of sankeyinputdata.links) {

                const linkformattedid = linkformatted.data.source + "->" + linkformatted.data.target;

                if (appearedValueMap[linkformattedid] == undefined) {

                    appearedValueMap[linkformattedid] = 0;

                }

                appearedValueMap[linkformattedid] += linkformatted.value;
            }

            sankeyinputdata.links = [];

            for (const linkid in appearedValueMap) {

                const source = linkid.split("->")[0];
                const target = linkid.split("->")[1];
                const value = appearedValueMap[linkid];

                let linkformatted = {
                    source: nodeidmap[source],
                    target: nodeidmap[target],
                    value: value,
                    data: {
                        source: source,
                        target: target,
                        value: value,
                        id: linkid,
                        state: STATE,
                        year: YEAR,
                    },
                }

                sankeyinputdata.links.push(linkformatted);
            }
        }

        sankeyinputdata.nasa = 10;

        return sankeyinputdata;
    }

    return this;

}

function SankeyDrawer(ID = "#sankey-chart") {

    const minVisibleLink = 0;
    const minVisibleNode = 0;

    const svgWidth = 900;
    const svgHeight = 500;

    // set the dimensions and margins of the graph
    const margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom,
        nodeWidth = 10,
        nodePadding = 50,
        nodeTextPadding = 6;

    // Set the sankey diagram properties
    const d3sankeygraph = d3.sankey()
        .nodeWidth(nodeWidth)
        // .nodePadding(sankeyNodePadding)
        .size([width, height]);

    // select svg chart
    const CHARTAREA = d3.select(ID)
        .style("width", `${svgWidth} px`);

    // add svg
    const svg = CHARTAREA.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // append (create) sankey
    const svgsankey = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("id", "sankey");

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

    function onMouseOverTooltip(event, d) {

        tooltip.html(d.tooltip)
            .style("visibility", "visible")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px")
    }

    function onMouseMoveTooltip(event, d) {

        let x = (event.pageX) + 20;
        let y = event.pageY > 1650 ? 1650 : event.pageY;

        tooltip
            .style("transform", "translateY(-55%)")
            .style("left", x + "px")
            .style("top", y + "px")
    }

    function onMouseOutTooltip(event, d) {

        tooltip.style("visibility", "hidden");
    }

    function initialize_graph(sankeydata) {

        let graph = d3sankeygraph(sankeydata);

        let sankeydataclone = Object.assign({}, sankeydata);

        delete sankeydataclone.nodes;
        delete sankeydataclone.links;

        graph = Object.assign({}, graph, sankeydataclone);

        for (let d of graph.nodes) {
            d.rectHeight = d.y1 - d.y0;
            d.color = d.data.color;
            d.selected = false;
            d.textVisible = true;
            d.tooltip = `${d.data.name}
                <br>${d.data.value.toLocaleString('en-US')} BBtu
                <br>${d.data.state}, ${d.data.year}`;

            d.original = {
                color: d.data.color
            }
        }

        for (let d of graph.links) {

            d.tooltip = `${d.source.data.name} to ${d.target.data.name}
                <br>${d.data.value.toLocaleString('en-US')} BBtu
                <br>${d.data.state}, ${d.data.year}`;

            d.original = {
                color: 0
            }
        }

        return graph;
    }

    // draw default treemap
    function drawDefaultTreemap(graph) {

        let firstNodes = []

        for (const node of graph.nodes) {
            if (node.sourceLinks.length == 0) {

            }
        }

    }

    // the function for reordering the links when a node is dragged
    function reorderLinks(graph) {

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

    this.reset = () => {
        svgsankey.html("");
        return this;
    }

    this.drawsankey = (sankeydata) => {

        let graph = initialize_graph(sankeydata);

        drawDefaultTreemap(graph);

        // add links
        const links = svgsankey.append("g")
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
        const nodes = svgsankey.append("g")
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

        // add in the text for the nodes
        nodes.append("text")
            .text(function (d) {
                return d.name + "\n";
                // + d.data.value.toLocaleString('en-US') + " BBtu";
            })
            .attr("y", d => (d.y1 + d.y0) / 2 - nodeTextPadding)
            .attr("dy", "0.5em")
            .attr("x", d => d.x0 - nodeTextPadding)
            .attr("text-anchor", "end")
            .filter(d => d.x0 < width / 2)
            .attr("x", d => d.x1 + nodeTextPadding)
            .attr("text-anchor", "start");

        // add onclick event
        nodes.on("click", onClickNode);

        // add drag event
        nodes.call(
            // call the function for moving the node
            d3.drag().subject(function (d) { return d; })
                // onstart interfering with onclick
                // .on("start", function () { this.parentNode.appendChild(this); })
                .on("drag", onDragNode)
                .on("end", onDragEndNode)
        );

        // add node mouse hover events
        nodes.on("mouseover", onMouseOverTooltip)
            .on("mousemove", onMouseMoveTooltip)
            .on("mouseout", onMouseOutTooltip);

        // add link mouse over events
        links.on("mouseover", onMouseOverTooltip)
            .on("mousemove", onMouseMoveTooltip)
            .on("mouseout", onMouseOutTooltip);


        // the function for moving the nodes
        function onDragNode(mouse, d) {

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
                    width - d3sankeygraph.nodeWidth()
                )
            );

            // update x1
            d.x1 = d.x0 + d3sankeygraph.nodeWidth();

            // update graph data

            graph = reorderLinks(graph);

            d3sankeygraph.update(graph);


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
                .attr("x", d => d.x1 - nodeTextPadding)
                .attr("text-anchor", "end")
                .filter(d => d.x0 < width / 2)
                .attr("x", d => d.x0 + nodeTextPadding)
                .attr("text-anchor", "start");

            // redraw links

            links.selectAll("path")
                .attr("d", d3.sankeyLinkHorizontal());

            links.selectAll("linearGradient")
                .attr("x1", d => d.source.x1)
                .attr("x2", d => d.target.x0);

        };

        function onDragEndNode() {

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
                .attr("x", d => d.x1 - nodeTextPadding)
                .attr("text-anchor", "end")
                .filter(d => d.x0 < width / 2)
                .attr("x", d => d.x0 + nodeTextPadding)
                .attr("text-anchor", "start");

            // redraw links

            links.selectAll("path")
                .attr("d", d3.sankeyLinkHorizontal());

            links.selectAll("linearGradient")
                .attr("x1", d => d.source.x1)
                .attr("x2", d => d.target.x0);


        };

        function onClickNode(event, d) {

            const node = d3.select(this);

            d.selected = !d.selected;

            if (d.selected) {

                // deselect all nodes
                // this will make d.selected = false

                for (let _node of graph.nodes) {
                    _node.selected = false;
                    _node.color = "grey";
                    _node.textVisible = false;
                }

                for (let link of graph.links) {
                    link.color = "grey";
                }

                d.selected = true;

                d.textVisible = true;

                d.color = d.original.color;

                for (let _link of d.sourceLinks) {
                    _link.target.color = _link.target.original.color;
                    _link.target.textVisible = true;
                    _link.color = _link.target.original.color;
                }

                for (let _link of d.targetLinks) {
                    _link.source.color = _link.source.original.color;
                    _link.source.textVisible = true;
                    _link.color = _link.source.original.color;
                }

                const nodesdata = onClickFormatSankeyNode(d);

                const treedatasource = Main.TreemapSource.formatToTree(nodesdata.sources, d.data.id, d.value, d.data.id);

                const treedatatarget = Main.TreemapSource.formatToTree(nodesdata.targets, d.data.id, d.value, d.data.id);

                Main.TreemapSource = Main.TreemapSource.reset();

                Main.TreemapTarget = Main.TreemapTarget.reset();

                Main.TreemapSource.setTreedata(treedatasource).draw();

                Main.TreemapTarget.setTreedata(treedatatarget).draw();
            }

            else {

                // reset attributes

                for (let node of graph.nodes) {
                    node.selected = false;
                    node.color = node.original.color;
                    node.textVisible = true;
                }

                for (let link of graph.links) {
                    link.color = link.original.color;
                }
            }

            d3sankeygraph.update(graph);

            nodes.selectAll("rect")
                .style("fill", (d) => d.color);

            nodes.selectAll("text")
                .style("visibility", (d) => {
                    return d.textVisible ? "visible" : "hidden";
                });

            links.selectAll("path")
                .style("stroke", (d) => d.color);

        }

        // function to format selected node data to draw treemap
        function onClickFormatSankeyNode(d) {

            let sources = {}, targets = {};

            for (const link of d.sourceLinks) {
                targets[link.data.target] = link.data.value;
            }

            for (const link of d.targetLinks) {
                sources[link.data.source] = link.data.value;
            }

            return {
                sources: sources,
                targets: targets,
            }

        }

        return this;
    }

    return this;
}

export default function Sankey() {

    let ATTR, GROUPS, VALUES,
        STATE = "US", YEAR = 2019,
        NEEDEDNODES = [
            "Solar",
            "Wind",
            "Geothermal",
            "Hydropower",
            "Biomass",
            "Coal", "Petroleum", "NaturalGas",
            "Nuclear",
            "ElectricPower",
            "ElectricLoss",
            "Transportation",
            "Industrial",
            "Commercial",
            "Residential",
            "ElectricImport",
            "ElectricExport",
            "NetInterstateImport",
            "NetInterstateExport",
        ]

    let SankeyInputs = new SankeyInput();

    let SankeyDrawers = new SankeyDrawer();

    this.setData = (data) => {

        ATTR = data.ATTR;
        GROUPS = data.GROUPS;
        VALUES = data.VALUES;

        SankeyInputs.setData(
            ATTR,
            GROUPS,
            VALUES
        );

        return this;

    }

    this.state = (state) => { STATE = state; return this; }

    this.year = (year) => { YEAR = year; return this; }

    this.neededNodes = (neededNodes) => { NEEDEDNODES = neededNodes; return this; }

    this.draw = () => {

        let sankeydata = SankeyInputs.createInput(
            STATE,
            YEAR,
            NEEDEDNODES,
        );

        SankeyDrawers.reset();

        SankeyDrawers.drawsankey(sankeydata);

        return this;
    }

    return this;
}

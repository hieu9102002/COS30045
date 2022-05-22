// https://d3-graph-gallery.com/graph/interactivity_button.html
// https://d3-graph-gallery.com/graph/scatter_basic.html


"use strict";

// Scatter();

export function Scatter(DATA, ID = "#scatter-plot") {

    console.log(DATA);

    let ATTR, GROUPS, VALUES;

    // let varX = "x", varY = "y";
    let varX = "Renewable", varY = "FossilFuel", varCircle = "Total";

    ATTR = DATA.ATTR;
    GROUPS = DATA.GROUPS;
    VALUES = DATA.VALUES;

    let dataAll = selectData(ATTR, GROUPS, VALUES);
    let data = dataAll.data;
    const dataattr = dataAll.attr;

    // set the dimensions and margins of the graph
    const width = 500, height = 500;
    const margin = { top: 30, right: 200, bottom: 30, left: 60 };
    const valueMargin = { top: 50, right: 50, bottom: 10, left: 10 };
    const svgWidth = width + margin.left + margin.right; const svgHeight = height + margin.top + margin.bottom;
    const fontSize = 12, axisLabelMargin = 7;
    const minRadius = 5, textMargin = 5;
    const circleRange = { min: 1, max: 30 };

    // create areas inside chart area
    const SELECTIONS = d3.select(ID).append("div")
        .attr("id", "#scatter-plot-selections");

    const CHART = d3.select(ID).append("div")
        .attr("id", "scatter-plot-chart")


    let xList = [], yList = [];
    for (let d of data) {
        xList.push(d.data[varX]);
        yList.push(d.data[varY]);
    }
    let maxX = d3.max(data, d => d.data[varX]);
    let minX = d3.min(data, d => d.data[varX]);
    let maxY = d3.max(data, d => d.data[varY]);
    let minY = d3.min(data, d => d.data[varY]);
    let maxCircle = d3.max(data, d => d.data[varCircle]);
    let minCircle = d3.min(data, d => d.data[varCircle]);
    let orderScaleX = d3.scalePoint().domain(xList.sort((a, b) => (a - b))).range([1, xList.length]);
    let orderScaleY = d3.scalePoint().domain(yList.sort((a, b) => (a - b))).range([1, yList.length]);
    let circleScale = d3.scaleSqrt().domain([minCircle, maxCircle]).range([circleRange.min, circleRange.max]);
    let xAxisMin = minX;
    let yAxisMin = minY;
    let xScaleType = "Line";

    // Add svg
    const svg = CHART.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("x", width + axisLabelMargin)
        .attr("y", height)
        .attr("font-size", fontSize + "px")
        .text(ATTR[varX].name);

    // Add Y axis label:
    svg.append("text")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        // .attr("transform", "rotate(90)")
        .attr("x", axisLabelMargin)
        .attr("y", 0)
        .attr("font-size", fontSize + "px")
        .text(ATTR[varY].name);

    // Add X scale
    let xScale = d3.scaleLinear()
        .domain([xAxisMin, maxX])
        .range([0, width]);

    let xScaleValue = x => x;

    // Add X axis call
    let xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width)

    let xAxis = d3.axisBottom().scale(xScale.domain([xAxisMin, xAxisMax]));

    // Draw X axis
    const xAxisLine = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .attr("font-size", fontSize + "px");

    // Add Y scale
    let yScale = d3.scaleLinear()
        .domain([yAxisMin, maxY])
        .range([height, 0]);

    let yScaleValue = x => x;

    let yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0);
    // Add Y axis call
    let yAxis = d3.axisLeft().scale(yScale.domain([yAxisMin, yAxisMax]));

    // Draw Y axis
    const yAxisLine = svg.append("g")
        .call(yAxis)
        .attr("font-size", fontSize + "px");

    // Add points
    const points = svg.append('g')
        .selectAll(".scatter-point")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "scatter-point")
        .style("cursor", "move");

    // For each point, add a circle
    points.append("circle")
        .attr("cx", d => xScale(d.data[varX]))
        .attr("cy", d => yScale(d.data[varY]))
        .attr("r", (d) => {
            d.radius = circleScale(d.data[varCircle]);
            return d.radius;
        })
        .style("fill",(d) => {
            console.log(d.name == "United States", d.name)
            if(d.name == "United States") return "red";
            return "#69b3a2"
        });

    // For each point, add a label
    points.append("text")
        .text(d => `${d.name} (${d.data[varX].toLocaleString('en-US')}; ${d.data[varY].toLocaleString('en-US')})`)
        .attr("x", d => d.radius + xScale(d.data[varX]))
        .attr("y", d => - d.radius + yScale(d.data[varY]))
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "purple");

    points.on("click", function (e, d) {
        d.selected = !d.selected;

        const point = d3.select(this);

        // bring element to forth
        this.parentNode.appendChild(this);

        if (d.selected) {
            point.select("circle")
                .style("fill", "blue");
        }
        else {
            point.select("circle")
                .style("fill", "#69b3a2");
        }

    });

    // Add options

    const scaleOptions = [
        {
            name: "Linear",
            value: "Linear",
            scale: d3.scaleLinear(),
            scaleValue: x => x
        },
        {
            name: "Log",
            value: "Log",
            scale: d3.scaleLinear(),
            scaleValue: x => x
        },
        {
            name: "Order",
            value: "Order",
            scale: d3.scaleLinear(),
            scaleValue: d3.scalePoint()
                .domain(yList.sort((a, b) => (a - b)))
                .range([1, yList.length])
        },
    ]

    const selectY = SELECTIONS.append("select")

    selectY.selectAll("option")
        .data(scaleOptions)
        .enter()
        .append("option")
        .text(function (d) { return "Y Scale " + d.name; })
        .attr("value", function (d) { return d.value; });

    selectY.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateYScale(selectedOption);
    });

    function updateYScale(selectedOption) {
        switch (selectedOption) {
            case "Linear":
                yScale = d3.scaleLinear()
                    .domain([yAxisMin, maxY])
                    .range([height, 0]);
                yScaleValue = x => x;

                yAxisMin = minY;

                yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0)

                break;
            case "Log":
                yScale = d3.scaleSymlog()
                    .domain([yAxisMin, maxY])
                    .range([height, 0]);
                yScaleValue = x => x;

                yAxisMin = minY;

                yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0);

                break;
            case "Order":
                yScaleValue = d3.scalePoint()
                    .domain(yList.sort((a, b) => (a - b)))
                    .range([1, yList.length]);

                yScale = d3.scaleLinear()
                    .domain([0, yList.length])
                    .range([height, 0]);

                yAxisMin = 0;

                yAxisMax = yList.length + 1;

                break;
            default:
                break;
        }

        yAxis.scale(yScale.domain([yAxisMin, yAxisMax]));

        redrawY();

    }

    const selectX = SELECTIONS.append("select")

    selectX.selectAll("option")
        .data(scaleOptions)
        .enter()
        .append("option")
        .text(function (d) { return "X Scale " + d.name; })
        .attr("value", function (d) { return d.value; });

    selectX.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateXScale(selectedOption);
    });

    function updateXScale(selectedOption) {
        switch (selectedOption) {
            case "Linear":
                xScale = d3.scaleLinear()
                    .domain([xAxisMin, maxX])
                    .range([0, width]);
                xScaleValue = x => x;
                xAxisMin = minX;
                xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width);
                break;
            case "Log":
                xScale = d3.scaleSymlog()
                    .domain([xAxisMin, maxX])
                    .range([0, width]);
                xScaleValue = x => x;
                xAxisMin = minX;
                xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width)
                break;
            case "Order":
                xScaleValue = d3.scalePoint()
                    .domain(xList.sort((a, b) => (a - b)))
                    .range([1, xList.length]);

                xScale = d3.scaleLinear()
                    .domain([0, xList.length])
                    .range([0, width]);
                xAxisMin = 0;
                xAxisMax = xList.length + 1;
                break;
            default:
                break;
        }

        xAxis.scale(xScale.domain([xAxisMin, xAxisMax]));

        redrawX();

    }

    function redrawY() {
        yAxisLine
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .call(yAxis);

        points.select("circle")
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cy", d => yScale(yScaleValue(d.data[varY])));

        // For each point, add a label
        points.select("text")
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("y", d => - d.radius + yScale(yScaleValue(d.data[varY])))
    }

    function redrawX() {
        xAxisLine
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .call(xAxis);

        points.select("circle")
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", d => xScale(xScaleValue(d.data[varX])));

        // For each point, add a label
        points.select("text")
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", d => d.radius + xScale(xScaleValue(d.data[varX])))
    }

    const selectValueX = SELECTIONS.append("select")

    selectValueX.selectAll("option")
        .data(dataattr)
        .enter()
        .append("option")
        .text(function (d) { return d.name; })
        .attr("value", function (d) { return d.value; });

    selectValueX.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateXValue(selectedOption);
    });

    function updateXValue(option) {
        varX = option;
        maxX = d3.max(data, d => d.data[varX]);
        minX = d3.min(data, d => d.data[varX]);
        console.log(varX)

        xScale.domain([xAxisMin, maxX])

        xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width);

        xScale.domain([xAxisMin, xAxisMax]);

        xAxis.scale(xScale.domain([xAxisMin, xAxisMax]));

        redrawX();

    }

    return this;

}

function selectData(ATTR, GROUPS, VALUES) {

    let selectednodes = {};

    let selecteddata = {
        data: [],
        attr: []
    };

    for (let state in VALUES) {
        if (state == "US") continue;
        selecteddata.data.push({
            name: state,
            data: VALUES[state][2019].nodes
        });
        for (const node in VALUES[state][2019].nodes) {
            if (selectednodes[node] == undefined) {
                selectednodes[node] = true;
                selecteddata.attr.push(
                    {
                        name: ATTR[node].name,
                        value: node
                    }
                )
            }
        }
    }

    return selecteddata;

}

export function Scatter2(DATA, ID = "#scatter-plot-2") {

    console.log(DATA);

    let ATTR, GROUPS, VALUES;

    // let varX = "x", varY = "y";
    let varX = "electricity_generation", varY = "renewables_electricity", varCircle = "population";

    let dataAll = selectData2(DATA);
    let data = dataAll.data;
    const dataattr = dataAll.attr;

    // set the dimensions and margins of the graph
    const width = 500, height = 500;
    const margin = { top: 30, right: 200, bottom: 30, left: 60 };
    const valueMargin = { top: 50, right: 50, bottom: 10, left: 10 };
    const svgWidth = width + margin.left + margin.right; const svgHeight = height + margin.top + margin.bottom;
    const fontSize = 12, axisLabelMargin = 7;
    const minRadius = 5, textMargin = 5;
    const circleRange = { min: 1, max: 30 };

    // create areas inside chart area
    const SELECTIONS = d3.select(ID).append("div")
        .attr("id", "#scatter-plot-selections");

    const CHART = d3.select(ID).append("div")
        .attr("id", "scatter-plot-chart")


    let xList = [], yList = [];
    for (let d of data) {
        xList.push(d.data[varX]);
        yList.push(d.data[varY]);
    }
    let maxX = d3.max(data, d => d.data[varX]);
    let minX = d3.min(data, d => d.data[varX]);
    let maxY = d3.max(data, d => d.data[varY]);
    let minY = d3.min(data, d => d.data[varY]);
    let maxCircle = d3.max(data, d => d.data[varCircle]);
    let minCircle = d3.min(data, d => d.data[varCircle]);
    let orderScaleX = d3.scalePoint().domain(xList.sort((a, b) => (a - b))).range([1, xList.length]);
    let orderScaleY = d3.scalePoint().domain(yList.sort((a, b) => (a - b))).range([1, yList.length]);
    let circleScale = d3.scaleSqrt().domain([minCircle, maxCircle]).range([circleRange.min, circleRange.max]);
    let xAxisMin = minX;
    let yAxisMin = minY;
    let xScaleType = "Line";

    // Add svg
    const svg = CHART.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("x", width + axisLabelMargin)
        .attr("y", height)
        .attr("font-size", fontSize + "px")
        .text(varX);

    // Add Y axis label:
    svg.append("text")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        // .attr("transform", "rotate(90)")
        .attr("x", axisLabelMargin)
        .attr("y", 0)
        .attr("font-size", fontSize + "px")
        .text(varY);

    // Add X scale
    let xScale = d3.scaleLinear()
        .domain([xAxisMin, maxX])
        .range([0, width]);

    let xScaleValue = x => x;

    // Add X axis call
    let xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width)

    let xAxis = d3.axisBottom().scale(xScale.domain([xAxisMin, xAxisMax]));

    // Draw X axis
    const xAxisLine = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .attr("font-size", fontSize + "px");

    // Add Y scale
    let yScale = d3.scaleLinear()
        .domain([yAxisMin, maxY])
        .range([height, 0]);

    let yScaleValue = x => x;

    let yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0);
    // Add Y axis call
    let yAxis = d3.axisLeft().scale(yScale.domain([yAxisMin, yAxisMax]));

    // Draw Y axis
    const yAxisLine = svg.append("g")
        .call(yAxis)
        .attr("font-size", fontSize + "px");

    // Add points
    const points = svg.append('g')
        .selectAll(".scatter-point")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "scatter-point")
        .style("cursor", "move");

    // For each point, add a circle
    points.append("circle")
        .attr("cx", d => xScale(d.data[varX]))
        .attr("cy", d => yScale(d.data[varY]))
        .attr("r", (d) => {
            d.radius = circleScale(d.data[varCircle]);
            return d.radius;
        })
        .style("fill", (d) => {
            console.log(d.name == "United States", d.name)
            if(d.name == "United States") return "red";
            return "#69b3a2"
        });

    // For each point, add a label
    points.append("text")
        .text(d => `${d.name} (${d.data[varX]}; ${d.data[varY]})`)
        .attr("x", d => d.radius + xScale(d.data[varX]))
        .attr("y", d => - d.radius + yScale(d.data[varY]))
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize + "px")
        .attr("fill", "purple");

    points.on("click", function (e, d) {
        d.selected = !d.selected;

        const point = d3.select(this);

        // bring element to forth
        this.parentNode.appendChild(this);

        if (d.selected) {
            point.select("circle")
                .style("fill", "blue");
        }
        else {
            point.select("circle")
                .style("fill", "#69b3a2");
        }

    });

    // Add options

    const scaleOptions = [
        {
            name: "Linear",
            value: "Linear",
            scale: d3.scaleLinear(),
            scaleValue: x => x
        },
        {
            name: "Log",
            value: "Log",
            scale: d3.scaleLinear(),
            scaleValue: x => x
        },
        {
            name: "Order",
            value: "Order",
            scale: d3.scaleLinear(),
            scaleValue: d3.scalePoint()
                .domain(yList.sort((a, b) => (a - b)))
                .range([1, yList.length])
        },
    ]

    const selectY = SELECTIONS.append("select")

    selectY.selectAll("option")
        .data(scaleOptions)
        .enter()
        .append("option")
        .text(function (d) { return "Y Scale " + d.name; })
        .attr("value", function (d) { return d.value; });

    selectY.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateYScale(selectedOption);
    });

    function updateYScale(selectedOption) {
        switch (selectedOption) {
            case "Linear":
                yScale = d3.scaleLinear()
                    .domain([yAxisMin, maxY])
                    .range([height, 0]);
                yScaleValue = x => x;

                yAxisMin = minY;

                yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0)

                break;
            case "Log":
                yScale = d3.scaleSymlog()
                    .domain([yAxisMin, maxY])
                    .range([height, 0]);
                yScaleValue = x => x;

                yAxisMin = minY;

                yAxisMax = yScale.copy().range([height, valueMargin.top]).invert(0);

                break;
            case "Order":
                yScaleValue = d3.scalePoint()
                    .domain(yList.sort((a, b) => (a - b)))
                    .range([1, yList.length]);

                yScale = d3.scaleLinear()
                    .domain([0, yList.length])
                    .range([height, 0]);

                yAxisMin = 0;

                yAxisMax = yList.length + 1;

                break;
            default:
                break;
        }

        yAxis.scale(yScale.domain([yAxisMin, yAxisMax]));

        redrawY();

    }

    const selectX = SELECTIONS.append("select")

    selectX.selectAll("option")
        .data(scaleOptions)
        .enter()
        .append("option")
        .text(function (d) { return "X Scale " + d.name; })
        .attr("value", function (d) { return d.value; });

    selectX.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateXScale(selectedOption);
    });

    function updateXScale(selectedOption) {
        switch (selectedOption) {
            case "Linear":
                xScale = d3.scaleLinear()
                    .domain([xAxisMin, maxX])
                    .range([0, width]);
                xScaleValue = x => x;
                xAxisMin = minX;
                xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width);
                break;
            case "Log":
                xScale = d3.scaleSymlog()
                    .domain([xAxisMin, maxX])
                    .range([0, width]);
                xScaleValue = x => x;
                xAxisMin = minX;
                xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width)
                break;
            case "Order":
                xScaleValue = d3.scalePoint()
                    .domain(xList.sort((a, b) => (a - b)))
                    .range([1, xList.length]);

                xScale = d3.scaleLinear()
                    .domain([0, xList.length])
                    .range([0, width]);
                xAxisMin = 0;
                xAxisMax = xList.length + 1;
                break;
            default:
                break;
        }

        xAxis.scale(xScale.domain([xAxisMin, xAxisMax]));

        redrawX();

    }

    function redrawY() {
        yAxisLine
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .call(yAxis);

        points.select("circle")
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cy", d => yScale(yScaleValue(d.data[varY])));

        // For each point, add a label
        points.select("text")
            .transition("ChangeYScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("y", d => - d.radius + yScale(yScaleValue(d.data[varY])))
    }

    function redrawX() {
        xAxisLine
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .call(xAxis);

        points.select("circle")
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("cx", d => xScale(xScaleValue(d.data[varX])));

        // For each point, add a label
        points.select("text")
            .transition("ChangeXScale")
            .duration(500)
            .ease(d3.easeLinear)
            .attr("x", d => d.radius + xScale(xScaleValue(d.data[varX])))
    }

    const selectValueX = SELECTIONS.append("select")

    selectValueX.selectAll("option")
        .data(dataattr)
        .enter()
        .append("option")
        .text(function (d) { return d.name; })
        .attr("value", function (d) { return d.value; });

    selectValueX.on("change", function (d) {

        const selectedOption = d3.select(this).property("value");

        updateXValue(selectedOption);
    });

    function updateXValue(option) {
        varX = option;
        maxX = d3.max(data, d => d.data[varX]);
        minX = d3.min(data, d => d.data[varX]);
        console.log(varX)

        xScale.domain([xAxisMin, maxX])

        xAxisMax = xScale.copy().range([0, width - valueMargin.right]).invert(width);

        xScale.domain([xAxisMin, xAxisMax]);

        xAxis.scale(xScale.domain([xAxisMin, xAxisMax]));

        redrawX();

    }

    return this;

}

function selectData2(OWID) {

    let selectednodes = {};

    let selecteddata = {
        data: [],
        attr: []
    };

    for (let country in OWID) {
        if(country == "World") continue;
        selecteddata.data.push({
            name: country,
            data: OWID[country].data.at(-1)
        });
        for (const node in OWID[country].data.at(-1)) {
            if (selectednodes[node] == undefined) {
                selectednodes[node] = true;
                selecteddata.attr.push(
                    {
                        name: node,
                        value: node
                    }
                )
            }
        }
    }

    console.log(selecteddata)

    return selecteddata;

}
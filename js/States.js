window.onload = () => {
    var margin = { top: 10, right: 0, bottom: 20, left: 10 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var textMargin = 14;
    var innerPadding = 0.05;

    d3.csv("./data/publication-grids.csv", d => {
        return {
            code: d.code,
            row: +d.row - 1,
            col: +d.col - 1,
            data: []
        }
    }).then(statesCell => {
        d3.csv("./data/state-data.csv", d => {
            return {
                code: d.State,
                renewables: +d["Renewable energy total consumption"],
                non_renewables: 1 - parseFloat(d["Renewable energy total consumption"])
            }
        }).then(stateData => {
            //calculate cell size
            var pie = d3.pie();

            statesCell.forEach(stateCell => {
                const data = stateData.find(state => state.code == stateCell.code);

                stateCell.data.push(data.renewables);
                stateCell.data.push(data.non_renewables);

                stateCell.pie = pie(stateCell.data);
                stateCell.pie.forEach(pie => pie.code = stateCell.code)
            });

            console.log(statesCell)

            var maxRow = d3.max(statesCell, d => parseInt(d.row)) + 1;
            var maxCol = d3.max(statesCell, d => parseInt(d.col)) + 1;

            let rowScale = d3.scaleBand()
                .domain(d3.range(maxRow))
                .range([0, height])
                .paddingInner(innerPadding);

            let colScale = d3.scaleBand()
                .domain(d3.range(maxCol))
                .range([0, width])
                .paddingInner(innerPadding);

            var colBandwidth = colScale.bandwidth();
            var rowBandwidth = rowScale.bandwidth();

            var svg = d3.select("#svg-div")
                .append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .attr("fill", "grey")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var state = svg.selectAll(".state")
                .data(statesCell)
                .enter()
                .append("g")
                .attr("class", "state")
                .attr("id", d => d.code)
                .attr("transform", d => "translate(" + colScale(d.col) + "," + rowScale(d.row) + ")");

            let color = d3.scaleOrdinal(['#7fbf7b', '#af8dc3']);
            var outerRadius = rowBandwidth / 2;
            var innerRadius = 0;

            var arc = d3.arc()
                .outerRadius(outerRadius)
                .innerRadius(innerRadius);


            var arcs = state.selectAll("g.arc")
                .data(d => d.pie)
                .enter()
                .append("g")
                .attr("class", "arc")
                .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

            arcs.append("path")
                .attr("fill", (_, i) => color(i))
                .attr("d", (d, i) => arc(d, i));

            state.append("text")
                .attr("class", "state-label")
                .text(d => d.code)
                .attr("x", 0)
                .attr("y", textMargin);

            arcs.append("text")
                .text(d => parseInt(d.value * 100))
                .attr("transform", d => "translate(" + arc.centroid(d) + ")")
                .attr("class", "mouseover-label")
                .attr("id", d => "label-" + d.code + d.index);
        })
    })
}
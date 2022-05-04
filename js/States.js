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
            years: [],
            renewable_percentage_2019: 0
        }
    }).then(statesCell => {
        d3.json("./data/transformed2new.json").then(stateData => {
            //calculate cell size

            statesCell.forEach(stateCell => {
                const data = stateData.data.find(state => state.code == stateCell.code);
                stateCell.years = data.years.map(year => {
                    return {
                        year: year.year,
                        Biomass: year.Biomass / year.TotalPrimary,
                        Geothermal: year.Geothermal / year.TotalPrimary,
                        Hydropower: year.Hydropower / year.TotalPrimary,
                        Solar: year.Solar / year.TotalPrimary,
                        Wind: year.Wind / year.TotalPrimary,
                        Other: year.OtherRenewables / year.TotalPrimary
                    }
                })
                stateCell.renewable_percentage_2019 = data.years.at(-1).TotalRenewable / data.years.at(-1).TotalPrimary;
            });

            var maxRow = d3.max(statesCell, d => parseInt(d.row)) + 1;
            var maxCol = d3.max(statesCell, d => parseInt(d.col)) + 1;

            const USdata2019 = stateData.data.find(state=>state.code=="US").years.at(-1);
            const USRenewablePercentage2019 = USdata2019.TotalRenewable/USdata2019.TotalPrimary;

            console.log(statesCell)
            console.log(USRenewablePercentage2019);

            let rowScale = d3.scaleBand()
                .domain(d3.range(maxRow))
                .range([0, height])
                .paddingInner(innerPadding);

            let colScale = d3.scaleBand()
                .domain(d3.range(maxCol))
                .range([0, width])
                .paddingInner(innerPadding);

            let stack = d3.stack()
                .keys(["Hydropower", "Solar", "Wind", "Geothermal", "Biomass", "Other"]);

            let color = d3.scaleOrdinal(['#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'].reverse());

            var colBandwidth = colScale.bandwidth();
            var rowBandwidth = rowScale.bandwidth();

            var xScale = d3.scaleBand()
                .domain(statesCell[0].years.map(year => year.year))
                .range([0, colBandwidth]);

            var yScale = d3.scaleLinear()
                .domain([0, 1])
                .range([rowBandwidth, 0]);

            var svg = d3.select("#svg-div")
                .append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var state = svg.selectAll(".state")
                .data(statesCell)
                .enter()
                .append("g")
                .attr("class", d=> {
                    let result = "state ";
                    if (d.renewable_percentage_2019 >= USRenewablePercentage2019) result+="over-mean";
                    else result +="under-mean";
                    return result;    
                })
                .attr("id", d => d.code)
                .attr("transform", d => "translate(" + colScale(d.col) + "," + rowScale(d.row) + ")")
                .attr("visibility", "visible")
                .on("mouseenter", onSmallMultiplesMouseEnter)
                .on("mouseleave", onSmallMultiplesMouseLeave)
                .on("mousemove", onSmallMultiplesMouseMove);

            state.append("rect")
                .attr("height", rowBandwidth)
                .attr("width", colBandwidth)
                .attr("class", "small-multiples-border");

            var groups = state.selectAll("g.small-multiples")
                .data(d => stack(d.years))
                .enter()
                .append("g")
                .attr("class", "small-multiples")
                .style("fill", (d) => color(d.key));

            var rects = groups.selectAll("rect.state-data")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.data.year))
                .attr("y", d => yScale(d[1]))
                .attr("height", d => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("class", "state-data")
                .on("mouseover", onDataMouseOver);

            state.append("text")
                .attr("class", "state-label")
                .text(d => d.code)
                .attr("x", 0)
                .attr("y", textMargin);

            
            state.append("line")
                .attr("class", "vertical-line")
                .attr("visibility", "hidden")
                .attr("y1", 0)
                .attr("y2", rowBandwidth);

            let stateFilter = document.getElementById("state-filter")
            stateFilter.onchange = () => {
                let selected = stateFilter.value;
                console.log(selected);
                switch(selected){
                    case "all":
                        state.attr("visibility", "visible");
                        break;
                    case "over-mean":
                        svg.selectAll(".state.over-mean")
                            .attr("visibility", "visible");
                        svg.selectAll(".state.under-mean")
                            .attr("visibility", "collapse");
                        break;
                    case "under-mean":
                        svg.selectAll(".state.under-mean")
                            .attr("visibility", "visible");
                        svg.selectAll(".state.over-mean")
                            .attr("visibility", "collapse");
                        break;
                }
            }

            function onDataMouseOver(e, d) {

                const state = d3.select(this.parentNode.parentNode).datum().code;

                let yearData = ""

                Object.keys(d.data).forEach(k=>yearData+=k=="year"?k+": "+d.data[k]+"<br>":k+": "+(d.data[k]*100).toFixed(2)+"%<br>");
                d3.select("#tooltip")
                    .html("State: " + state +"<br>"+yearData)

            }

            function onSmallMultiplesMouseEnter(e, d) {
                svg.selectAll(".vertical-line")
                    .attr("visibility", "visible");
            }

            function onSmallMultiplesMouseLeave(e,d){
                svg.selectAll(".vertical-line")
                    .attr("visibility", "hidden");
            }

            function onSmallMultiplesMouseMove(e, d) {
                let coords = d3.pointer(e);
                svg.selectAll(".vertical-line")
                    .attr("x1", coords[0])
                    .attr("x2", coords[0])
            }
        })
    })
}

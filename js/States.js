window.onload = () => {
    var margin = { top: 10, right: 0, bottom: 20, left: 10 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var textMargin = 14;
    var innerPadding = 0.05;

    d3.csv("./data/publication-grids.csv", d=>{
        return {
            code: d.code,
            row: +d.row-1,
            col: +d.col-1,
            years:[]
        }
    }).then(statesCell => {
        d3.json("./data/transformed2new.json").then(stateData =>{
            //calculate cell size

            statesCell.forEach(stateCell => {
                const data = stateData.data.find(state => state.code == stateCell.code);
                stateCell.years = data.years.map(year => {
                    return{
                        year: year.year,
                        Biomass: year.Biomass/year.TotalPrimary,
                        Geothermal: year.Geothermal/year.TotalPrimary,
                        Hydropower: year.Hydropower/year.TotalPrimary,
                        Solar: year.Solar/year.TotalPrimary,
                        Wind: year.Wind/year.TotalPrimary,
                        Other: year.OtherRenewables/year.TotalPrimary
                    }
                })
            });
            
            var maxRow = d3.max(statesCell, d => parseInt(d.row))+1;
            var maxCol = d3.max(statesCell, d => parseInt(d.col))+1;

            let rowScale = d3.scaleBand()
                .domain(d3.range(maxRow))
                .range([0,height])
                .paddingInner(innerPadding);

            let colScale = d3.scaleBand()
                .domain(d3.range(maxCol))
                .range([0,width])
                .paddingInner(innerPadding);

            let stack = d3.stack()
                .keys(["Hydropower", "Solar", "Wind", "Geothermal", "Biomass", "Other"]);

            let color = d3.scaleOrdinal(d3.schemeCategory10);

            var colBandwidth = colScale.bandwidth();
            var rowBandwidth = rowScale.bandwidth();

            var xScale = d3.scaleBand()
                .domain(d3.range(18))
                .range([0,colBandwidth]);

            var yScale = d3.scaleLinear()
                .domain([0,1])
                .range([rowBandwidth,0]);

            var svg = d3.select("#svg-div")
                .append("svg")
                .attr("width", width+margin.right+margin.left)
                .attr("height", height+margin.top+margin.bottom)
                .append("g")
                .attr("transform", "translate("+margin.left+","+ margin.top+")");

            var state = svg.selectAll(".state")
                .data(statesCell)
                .enter()
                .append("g")
                .attr("class", "state")
                .attr("id", d=>d.code)
                .attr("transform", d=>"translate(" + colScale(d.col) +","+rowScale(d.row)+")" );

            state.append("rect")
                .attr("height", rowBandwidth)
                .attr("width", colBandwidth)
                .attr("class", "small-multiples-border");
            
            var groups = state.selectAll("g.small-multiples")
                .data(d=>stack(d.years))
                .enter()
                .append("g")
                .attr("class", "small-multiples")
                .style("fill", (_,i)=>color(i));

            var rects = groups.selectAll("rect.state-data")
                .data(d=>d)
                .enter()
                .append("rect")
                .attr("x", (_,i)=>xScale(i))
                .attr("y", d=>yScale(d[1]))
                .attr("height", d=>yScale(d[0])-yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("class", "state-data");

            state.append("text")
                .attr("class", "state-label")
                .text(d=>d.code)
                .attr("x", 0)
                .attr("y", textMargin);
        })
    })
}
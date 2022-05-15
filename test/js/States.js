//US states dictionary
const USStates = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
};


window.onload = () => {
    //setup margin
    var margin = { top: 10, right: 10, bottom: 20, left: 10 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var textMargin = 14;
    var innerPadding = 0.05;


    d3.csv("./data/publication-grids.csv", d => { //Read in US grid file
        return {
            code: d.code,
            row: +d.row - 1,
            col: +d.col - 1,
            years: [],
            renewable_percentage_2019: 0
        }
    }).then(statesCell => {
        d3.json("./data/transformed.json").then(stateData => { //Read in data file
            //combine two files

            statesCell.forEach(stateCell => {
                const data = stateData.data.find(state => state.code == stateCell.code);
                stateCell.years = data.years.map(year => {
                    return {
                        year: year.year,
                        Biomass: year.Biomass / year.Total,
                        Geothermal: year.Geothermal / year.Total,
                        Hydropower: year.Hydropower / year.Total,
                        Solar: year.Solar / year.Total,
                        Wind: year.Wind / year.Total,
                        Coal: year.Coal / year.Total,
                        Petroleum: year.Petroleum / year.Total,
                        NaturalGas: year.NaturalGas / year.Total,
                        Nuclear: year.Nuclear / year.Total
                    }
                })
                stateCell.renewable_percentage_2019 = data.years.at(-1).Renewable / data.years.at(-1).Total;
            });

            //calculate rows and columns of small multiples
            var maxRow = d3.max(statesCell, d => parseInt(d.row)) + 1;
            var maxCol = d3.max(statesCell, d => parseInt(d.col)) + 1;

            //calculate constants
            var USdata = stateData.data.find(state => state.code == "US");
            var USData = {
                code: "US",
                years: USdata.years.map(year => {
                    return {
                        year: year.year,
                        Biomass: year.Biomass / year.Total,
                        Geothermal: year.Geothermal / year.Total,
                        Hydropower: year.Hydropower / year.Total,
                        Solar: year.Solar / year.Total,
                        Wind: year.Wind / year.Total,
                        Coal: year.Coal / year.Total,
                        Petroleum: year.Petroleum / year.Total,
                        NaturalGas: year.NaturalGas / year.Total,
                        Nuclear: year.Nuclear / year.Total,
                        TotalRenewable: year.Renewable / year.Total,
                    }
                })
            }
            const USdata2019 = USData.years.at(-1);
            const USRenewablePercentage2019 = USdata2019.TotalRenewable;

            //create scales
            let rowScale = d3.scaleBand()
                .domain(d3.range(maxRow))
                .rangeRound([0, height])
                .paddingInner(innerPadding);

            let colScale = d3.scaleBand()
                .domain(d3.range(maxCol))
                .rangeRound([0, width])
                .paddingInner(innerPadding);

            let keys = ["Hydropower", "Solar", "Wind", "Geothermal", "Biomass", "Coal", "Petroleum", "NaturalGas", "Nuclear"]
            let stack = d3.stack()
                .keys(keys);

            let color = {
                Hydropower: "#1aff1a",
                Solar: "#71ff5b",
                Wind: "#9cfe85",
                Geothermal: "#befcac",
                Biomass: "#dcfad1",
                Coal: "#4b0092",
                Petroleum: "#723ca7",
                NaturalGas: "#956abb",
                Nuclear: "#b797cf"
            };

            var colBandwidth = colScale.bandwidth();
            var rowBandwidth = rowScale.bandwidth();

            var xScale = d3.scaleBand()
                .domain(statesCell[0].years.map(year => year.year))
                .rangeRound([0, colBandwidth]);

            var yScale = d3.scaleLinear()
                .domain([0, 1])
                .range([rowBandwidth, 0]);

            //create svg
            var svg = d3.select("#svg-div")
                .append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //create small multiples
            var state = svg.selectAll(".state")
                .data(statesCell)
                .enter()
                .append("g")
                .attr("class", d => {
                    let result = "state ";
                    if (d.renewable_percentage_2019 >= USRenewablePercentage2019) result += "over-mean";
                    else result += "under-mean";
                    return result;
                })
                .attr("id", d => d.code)
                .attr("transform", d => "translate(" + colScale(d.col) + "," + rowScale(d.row) + ")")
                .style("opacity", 1)
                .attr("visibility", "visible")
                .on("mouseenter", onSmallMultiplesMouseEnter)
                .on("mouseleave", onSmallMultiplesMouseLeave)
                .on("mousemove", onSmallMultiplesMouseMove);

            //create highlight for state search
            var highlight = state.append("rect")
                .attr("height", rowBandwidth + 4)
                .attr("width", colBandwidth + 4)
                .attr("x", -2)
                .attr("y", -2)
                .attr("class", "small-multiples-highlight")
                .attr("id", d => d.code + "-highlight")
                .style("opacity", 0);

            //create background
            state.append("rect")
                .attr("height", rowBandwidth)
                .attr("width", colBandwidth)
                .attr("class", "small-multiples-background")
                .attr("id", d => d.code + "-background")

            //create the stacked bar charts
            var groups = state.selectAll("g.stacked-group")
                .data(d => stack(d.years))
                .enter()
                .append("g")
                .attr("class", "stacked-group")
                .style("fill", (d) => color[d.key]);

            groups.selectAll("rect.state-data")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.data.year))
                .attr("y", d => yScale(d[1]))
                .attr("height", d => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("class", "state-data")
                .on("mouseover", onDataMouseOver)
                .on("mousemove", onDataMouseMove)
                .on("mouseleave", onDataMouseLeave);

            //create the state names
            state.append("text")
                .attr("class", "state-label")
                .text(d => d.code)
                .attr("x", 0)
                .attr("y", textMargin);

            //create seeker line
            let seekerLine = svg.append("line")
                .attr("class", "vertical-line")
                .attr("visibility", "hidden");

            //implement state filter function
            let stateFilter = document.getElementById("state-filter")
            stateFilter.onchange = () => {
                let selected = stateFilter.value;
                switch (selected) {
                    case "all":
                        state.transition()
                            .style("opacity", 1)
                            .attr("visibility", "visible");
                        break;
                    case "over-mean":
                        svg.selectAll(".state.over-mean")
                            .transition()
                            .style("opacity", 1)
                            .attr("visibility", "visible");
                        svg.selectAll(".state.under-mean")
                            .transition()
                            .style("opacity", 0)
                            .attr("visibility", "hidden");
                        break;
                    case "under-mean":
                        svg.selectAll(".state.under-mean")
                            .transition()
                            .style("opacity", 1)
                            .attr("visibility", "visible");
                        svg.selectAll(".state.over-mean")
                            .style("opacity", 0)
                            .attr("visibility", "hidden");
                        break;
                }
            }

            // ----------------
            // Create a tooltip
            // ----------------
            var tooltip = d3.select("#svg-div")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip");

            var highlightSvg = createHighlightChart(USData, color, keys, tooltip, stateData);
            var label = drawLabel(color);

            //implement state search function
            let stateSearch = document.getElementById("state-search");
            autocomplete(stateSearch, USStates);
            stateSearch.onchange = () => {
                setTimeout(() => {
                    highlightSearchedState();
                }, 500);
            }

            function highlightSearchedState() {
                highlight
                    .style("opacity", function () {
                        let id = d3.select(this.parentNode).attr("id");
                        return +(id === USStates[stateSearch.value]);
                    })
                let state = statesCell.find(state => state.code === USStates[stateSearch.value])
                if (state == undefined) state = USData;
                redrawHighlight(state);
            }

            function onDataMouseOver(e, d) {

                const state = d3.select(this.parentNode.parentNode).datum().code;
                const year = d.data.year;

                let yearData = "";
                yearData += "Year: " + year + "<br/>";

                var countryData = stateData.data.find(d => d.code === state);
                var data = countryData.years.find(d => d.year === year);

                Object.keys(color)
                    .reverse()
                    .forEach(
                        k => yearData += k + ": " + Number(data[k]).toLocaleString() + " BBtu<br>"
                    )

                tooltip
                    .html("State: " + Object.keys(USStates).find(key => USStates[key] === state) + "<br>" + yearData)
                    .style("opacity", 1);

            }

            function onDataMouseMove(e, d) {
                let y = e.pageY > 650 ? 650 : e.pageY;
                tooltip.style("transform", "translateY(-55%)")
                    .style("left", (e.pageX) + colBandwidth + "px")
                    .style("top", y + "px")
            }

            function onDataMouseLeave(e, d) {
                tooltip
                    .style("opacity", 0)
                    .style("left", "-100px")
                    .style("top", "-100px");
            }

            function onSmallMultiplesMouseEnter(e, data) {
                svg.selectAll(".vertical-line")
                    .attr("visibility", "visible");

                //remove all other highlights
                highlight.style("opacity", d => +(d.code == data.code));

                //highlight the one that is moused
                d3.select(this)
                    .select(".small-multiples-highlight")
                    .style("opacity", 1);

                redrawHighlight(data);
            }

            function onSmallMultiplesMouseLeave(e, d) {
                svg.selectAll(".vertical-line")
                    .attr("visibility", "hidden");

                //remove highlight of current one
                d3.select(this)
                    .select(".small-multiples-highlight")
                    .style("opacity", 0);

                //re-highlight search if available
                if (stateSearch.value != '')
                    highlightSearchedState()
                else
                    redrawHighlight(USData);
            }

            function onSmallMultiplesMouseMove(e, d) {
                let coords = d3.pointer(e, svg);
                seekerLine
                    .attr("x1", coords[0] - margin.left)
                    .attr("x2", coords[0] - margin.left)
                    .attr("y1", rowScale(d.row))
                    .attr("y2", rowScale(d.row) + rowBandwidth);
            }

            function redrawHighlight(data) {
                var yScaleRedraw = d3.scaleLinear()
                    .domain([0, 1])
                    .range([160, 0]);

                var groupsRedraw = highlightSvg.selectAll("g.stacked-group")
                    .data(stack(data.years));

                groupsRedraw.selectAll("rect.state-data")
                    .data(d => d)
                    .transition()
                    .attr("y", d => yScaleRedraw(d[1]))
                    .attr("height", d => yScaleRedraw(d[0]) - yScaleRedraw(d[1]))

                //create the state names
                highlightSvg.selectAll(".state-label")
                    .attr("class", "state-label")
                    .text(data.code)
                    .attr("x", 0)
                    .attr("y", textMargin);
            }
        })
    })
}

function autocomplete(inp, input_arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    var arr = Object.keys(input_arr);
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + " autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function drawLabel(color) {
    var keys = Object.keys(color).reverse()
    var svg = d3.select("#svg-label")
        .append("svg")
        .attr("height", 190)
        .attr("width", 450);

    var size = 15;

    svg.selectAll("mycolors")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", 100)
        .attr("y", (_, i) => 10 + i * (size + 5))
        .attr("width", size)
        .attr("height", size)
        .style("fill", d => color[d]);

    svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("x", 100 + size * 1.2)
        .attr("y", (_, i) => 10 + i * (size + 5) + (size / 2)) // 100 is where the first dot appears. 25 is the distance between dots
        .text(d => d)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

    return svg;
}

function createHighlightChart(data, color, keys, tooltip, stateData) {
    var textMargin = 14;
    var innerPadding = 0.05;

    let stack = d3.stack()
        .keys(keys);
    //setup margin
    var margin = { top: 10, right: 50, bottom: 20, left: 50 },
        width = 400 - margin.left - margin.right,
        height = 190 - margin.top - margin.bottom;
    var svg = d3.select("#svg-overall")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xScale = d3.scaleBand()
        .domain(data.years.map(year => year.year))
        .rangeRound([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    let xAxis = (g) =>
        g
            .attr(
                "transform",
                "translate(0," + height + ")"
            )
            .call(d3.axisBottom(xScale)
                .tickValues([d3.min(data.years, d => d.year), d3.max(data.years, d => d.year)])
                .tickSizeInner([0])
                .tickPadding([10]));

    let yAxis = (g) =>
        g
            .attr(
                "transform",
                "translate(" + width + ",0)"
            )
            .call(d3.axisRight(yScale).ticks(2, ".0%").tickValues([0, 1]));

    var groups = svg.selectAll("g.stacked-group")
        .data(stack(data.years))
        .enter()
        .append("g")
        .attr("class", "stacked-group")
        .style("fill", (d) => color[d.key]);

    groups.selectAll("rect.state-data")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d.data.year))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("class", "state-data")
        .style("stroke-width", 3)
        .on("mouseover", onDataMouseOver)
        .on("mousemove", onDataMouseMove)
        .on("mouseleave", onDataMouseLeave);

    //create the state names
    svg.append("text")
        .attr("class", "state-label")
        .text(data.code)
        .attr("x", 0)
        .attr("y", textMargin);


    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    function onDataMouseOver(e, d) {
        const state = svg.select(".state-label").text();
        const year = d.data.year;

        let yearData = "";
        yearData += state === "US" ? "US overall data <br/>" : "State: " + Object.keys(USStates).find(key => USStates[key] === state) + "<br>";
        yearData += "Year: " + year + "<br/>";
        var countryData = stateData.data.find(d => d.code === state);
        var data = countryData.years.find(d => d.year === year);

        Object.keys(color)
            .reverse()
            .forEach(
                k => yearData += k + ": " + Number(data[k]).toLocaleString() + " BBtu<br>"
        )

        tooltip
            .html(yearData)
            .style("opacity", 1);

        d3.select(this).style("stroke", "black");
    }

    function onDataMouseMove(e, d) {
        tooltip.style("transform", "translateY(-55%)")
            .style("left", (e.pageX) + 200 + "px")
            .style("top", "200px")
    }

    function onDataMouseLeave(e, d) {
        tooltip
            .style("opacity", 0)
            .style("left", "-100px")
            .style("top", "-100px");

        d3.select(this).style("stroke", "none")
    }

    return svg;
}

function GridTileMap() {
    return this;
}
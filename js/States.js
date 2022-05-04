window.onload = () => {
    //setup margin
    var margin = { top: 10, right: 10, bottom: 20, left: 10 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var textMargin = 14;
    var innerPadding = 0.05;
    
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
    d3.csv("./data/publication-grids.csv", d => { //Read in US grid file
        return {
            code: d.code,
            row: +d.row - 1,
            col: +d.col - 1,
            years: [],
            renewable_percentage_2019: 0
        }
    }).then(statesCell => {
        d3.json("./data/transformed2new.json").then(stateData => { //Read in data file
            //combine two files

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

            //calculate rows and columns of small multiples
            var maxRow = d3.max(statesCell, d => parseInt(d.row)) + 1;
            var maxCol = d3.max(statesCell, d => parseInt(d.col)) + 1;

            //calculate constants
            const USdata2019 = stateData.data.find(state=>state.code=="US").years.at(-1);
            const USRenewablePercentage2019 = USdata2019.TotalRenewable/USdata2019.TotalPrimary;

            //create scales
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
                .attr("class", d=> {
                    let result = "state ";
                    if (d.renewable_percentage_2019 >= USRenewablePercentage2019) result+="over-mean";
                    else result +="under-mean";
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
                .attr("height", rowBandwidth+4)
                .attr("width", colBandwidth+4)
                .attr("x", -2)
                .attr("y", -2)
                .attr("class", "small-multiples-highlight")
                .attr("id", d=>d.code+"-highlight")
                .style("opacity", 0);

            //create background
            state.append("rect")
                .attr("height", rowBandwidth)
                .attr("width", colBandwidth)
                .attr("class", "small-multiples-background")
                .attr("id", d=>d.code+"-highlight")
            
            //create the stacked bar charts
            var groups = state.selectAll("g.small-multiples")
                .data(d => stack(d.years))
                .enter()
                .append("g")
                .attr("class", "small-multiples")
                .style("fill", (d) => color(d.key));

            groups.selectAll("rect.state-data")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.data.year))
                .attr("y", d => yScale(d[1]))
                .attr("height", d => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("class", "state-data")
                .on("mouseover", onDataMouseOver);
            
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
                switch(selected){
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
            
            //implement state search function
            let stateSearch = document.getElementById("state-search");
            autocomplete(stateSearch, USStates);
            stateSearch.onchange = () => {
                setTimeout(() => {
                    highlightSearchedState();
                }, 500);  
            }

            function highlightSearchedState () {
                highlight
                    .style("opacity", function () {
                        let id = d3.select(this.parentNode).attr("id");
                        return +(id === USStates[stateSearch.value]);
                    })
            }

            function onDataMouseOver(e, d) {

                const state = d3.select(this.parentNode.parentNode).datum().code;

                let yearData = ""

                Object.keys(d.data).forEach(k=>yearData+=k=="year"?k+": "+d.data[k]+"<br>":k+": "+(d.data[k]*100).toFixed(2)+"%<br>");
                d3.select("#tooltip")
                    .html("State: " + state +"<br>"+yearData)

            }

            function onSmallMultiplesMouseEnter(e, data) {
                svg.selectAll(".vertical-line")
                    .attr("visibility", "visible");

                //remove all other highlights
                highlight.style("opacity", d=>+(d.code==data.code));

                //highlight the one that is moused
                d3.select(this)
                    .select(".small-multiples-highlight")
                    .style("opacity", 1);
            }

            function onSmallMultiplesMouseLeave(e,d){
                svg.selectAll(".vertical-line")
                    .attr("visibility", "hidden");
                
                //remove highlight of current one
                d3.select(this)
                    .select(".small-multiples-highlight")
                    .style("opacity", 0);

                //re-highlight search if available
                if (stateSearch.value != '') 
                    highlightSearchedState()
            }

            function onSmallMultiplesMouseMove(e, d) {
                let coords = d3.pointer(e, svg);
                seekerLine
                    .attr("x1", coords[0] - margin.left)
                    .attr("x2", coords[0] - margin.left)
                    .attr("y1", rowScale(d.row))
                    .attr("y2", rowScale(d.row) + rowBandwidth);
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
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
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
                b.addEventListener("click", function(e) {
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
    inp.addEventListener("keydown", function(e) {
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
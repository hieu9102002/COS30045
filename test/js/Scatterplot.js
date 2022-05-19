// https://d3-graph-gallery.com/graph/interactivity_button.html
// https://d3-graph-gallery.com/graph/scatter_basic.html


import { Scatters } from "./scatterplot/index.js"

let AAA = d3.scale("symlog").domain([0, 31]).rangeRound([0, 300])

let x = new Scatters("#scatter-plot")
x.initData([
    {
        data: {
            x: 0,
            y: AAA(0)
        }
    },
    {
        data: {
            x: 1,
            y: AAA(1)
        }
    },
    {
        data: {
            x: 2,
            y: AAA(2)
        }
    },
    {
        data: {
            x: 31,
            y: AAA(31)
        }
    },
    {
        data: {
            x: 11,
            y: AAA(11)
        }
    },
    {
        data: {
            x: 21,
            y: AAA(21)
        }
    },
]).initScatterPLot().initSelections()


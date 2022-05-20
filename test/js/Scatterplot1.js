// https://d3-graph-gallery.com/graph/interactivity_button.html
// https://d3-graph-gallery.com/graph/scatter_basic.html


import { Scatters } from "./scatterplot/index.js"

// let AAA = d3.scale("symlog").domain([0, 31]).rangeRound([0, 300])

// let x = new Scatters("#scatter-plot")
// x.Data([
//     {
//         data: {
//             x: 0,
//             y: AAA(0)
//         }
//     },
//     {
//         data: {
//             x: 1,
//             y: AAA(1)
//         }
//     },
//     {
//         data: {
//             x: 2,
//             y: AAA(2)
//         }
//     },
//     {
//         data: {
//             x: 31,
//             y: AAA(31)
//         }
//     },
//     {
//         data: {
//             x: 11,
//             y: AAA(11)
//         }
//     },
//     {
//         data: {
//             x: 21,
//             y: AAA(21)
//         }
//     },
// ]).initScatterPLot().initSelections()




Promise.all([
    d3.json("./data/owid/owid.json"),
    d3.json("./data/owid/owidname.json"),
]).then(function (files) {
    const jsondata = files[0]
    const namedata = files[1]
    let DATA = [];
    for(const k of jsondata) {
        DATA.push({
            data: k
        })
    }

    console.log(DATA)

    let x = new Scatters("#scatter-plot")

    x.Data(DATA).OptionX(namedata)
    .OptionY(namedata)
    .OptionCircle(namedata)
    .DefaultX("population")
    .DefaultY("population")
    .drawScatterPLot()
    .DataX(d => d.data["population"])
    .DataY(d => d.data["population"])
    .DataText(d => d.data["country"])
    .drawSelections()

}).catch(function (err) {
    console.error(err);
})

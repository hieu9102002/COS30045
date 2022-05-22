
"use strict";

window.onload = () => {

    const Main = Main();

    Promise.all([
        d3.json("./data/sankey/attr.json"),
        d3.json("./data/sankey/groups.json"),
        d3.json("./data/sankey/values.json"),
        d3.csv("./data/publication-grids.csv"),

    ]).then(function (loadedfiles) {

        const DATA = {
            ATTR: loadedfiles[0],
            GROUPS: loadedfiles[1],
            VALUES: loadedfiles[2],
            STATECELLS: loadedfiles[3],
        }

        Main.setData(DATA).drawCharts();

    }).catch((err) => { console.error(err); });
}

function Main() {

    Main.DATA;
    Main.Sankey = Sankey();
    Main.TileGridMap = TileGridMap();

    Main.setData = (DATA) => {

        Main.DATA = DATA;

        return Main;

    }

    Main.drawCharts = () => {

        Main.Sankey.setData(Main.DATA).draw();
        Main.TileGridMap.setData(Main.DATA).draw();

        return Main;

    }

    return Main;

}

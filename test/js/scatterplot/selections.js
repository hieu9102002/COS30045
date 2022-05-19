
"use strict";

export class Selections {

    constructor(selectionarea) {

        this.SELECTIONAREA = selectionarea;
        this.valueOnSelect = function (option) {

        }

    }

    initValueOnSelect(callback) {

        this.valueOnSelect = callback;

        return this;

    }

    initOptions(data) {

        this.options = data;

        return this;

    }

    initDefault(option) {
        this.options.sort((a, b) => {
            if (a.value == option) {
                return -1;
            }
            else if (b.value == option) {
                return 1;
            }
            else return 0;
        })

        return this;
    }

    initSelection() {

        this.initSelectionSelection()
            .initSelectionOptions()
            .initSelectionOnSelect();
    }

    initSelectionSelection() {

        this.selection = this.SELECTIONAREA.append("select");

        return this;
    }

    initSelectionOptions() {

        this.selection.selectAll("option")
            .data(this.options)
            .enter()
            .append("option")
            .text(function (d) { return d.name; })
            .attr("value", function (d) { return d.value; });

        return this;
    }

    initSelectionOnSelect() {

        let self = this;

        this.selection.on("change", function (d) {

            const selectedOption = d3.select(this).property("value");

            self.valueOnSelect(selectedOption);
        });

        return this;
    }
}

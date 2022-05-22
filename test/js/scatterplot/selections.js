
"use strict";

export class Selections {

    constructor(selectionarea) {

        this.SELECTIONAREA = selectionarea;

        this.optionsarray
        this.Selection
        this.Options
        this.defaultvalue

        this.valueOnSelect = function (option) {

        }

    }

    initValueOnSelect(callback) {

        this.valueOnSelect = callback;

        return this;

    }

    OptionsData(array) {

        this.optionsarray = array;

        this.defaultvalue = this.optionsarray[0].value;

        return this;
    }

    DefaultValue(value, sort=false) {

        this.defaultvalue = value;

        if(sort) {

            this.optionsarray.sort((a, b) => {
                if (a.value == value) {
                    return -1;
                }
                else if (b.value == value) {
                    return 1;
                }
                else return 0;
            })

        }

        try {
            this.Options.property("selected", d => d.value == self.defaultvalue);
        }
        catch {}

        return this;
    }

    DrawSelection() {

        const self = this;

        self.Selection = self.SELECTIONAREA.append("select");

        self.Options = self.Selection.selectAll("option")
            .data(self.optionsarray)
            .enter()
            .append("option")
            .text(d => d.name)
            .property("value", d => d.value)
            .property("selected", d => d.value == self.defaultvalue);

            self.Selection.on("change", function (d) {

                const selectedValue = d3.select(this).property("value");
    
                self.valueOnSelect(selectedValue);
            });

        return self;
    }
}

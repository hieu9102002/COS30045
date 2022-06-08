"use strict"

export function randomcolor(i) {

    const colorlist = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]

    if (typeof i === 'number') {
        return colorlist[i % colorlist.length];
    }

    else {
        return colorlist[Math.floor(Math.random() * colorlist.length)];
    }
}

export function format(d, d3format = undefined) {
    let d_formatted = d;

    if (d3format == "$") {
        try {
            d_formatted = d.toLocaleString("en-US");
            d_formatted = "$" + d_formatted
        }
        catch { }
    }
    else if (d3format == "%") {
        try {
            d_formatted = d.toLocaleString("en-US");
            d_formatted = d_formatted + "%"
        }
        catch { }
    }
    else {
        try { d_formatted = d.toLocaleString("en-US"); }
        catch { }
    }

    return d_formatted;
}

export class MultipleElements {

    constructor(parent, class_, elementid) {

        this.parent = parent;

        this.class = class_;

        this.selections = () => this.parent.selectAll("." + this.class);

        this.values = [];

        this.elementid = elementid;
    }

    update(values) {

        this.updatemodel(values).updateview();

        return this;

    }

    updatemodel(values) {

        this.values = values

        return this;
    }

    updateview() {

        const self = this;

        self.selections()
            .data(self.values, function (d, i, arr) { return self.elementid(d, i, arr) ? self.elementid(d, i, arr) : this.id })
            .join(
                function (enter) { return self.elementOnEnter(enter) },
                function (update) { return self.elementOnUpdate(update) },
                function (exit) { return self.elementOnExit(exit) },
            );

        return self;
    }

    elementOnEnter(enter) { return enter; }

    elementOnUpdate(update) { return update; }

    elementOnExit(exit) { return exit.remove(); }
}

export class LegendBubbles extends MultipleElements {

    constructor(scale, svg, x, y, class_ = "bubble-legend-circle") {

        super(svg, class_, d => d.name);

        this.scale = scale;

        this.param = {
            x: x,
            y: y,
            fontSize: 12,
            textHeight: 15,
            textX: x + 60,
        }
    }

    update(values) {

        this.updatemodel(values).updateview();

        return this;

    }

    updatemodel(values) {

        if (!Array.isArray(values)) {
            values = Object.entries(values).map(d => ({ name: d[0], value: d[1] }))
        }

        values.sort((a, b) => a.value - b.value);

        for (let i = 0; i < values.length; i++) {

            let d = values[i];

            let render = {
                circle: {
                    x: this.param.x,
                    y: null,
                    r: this.scale(d.value),
                },
                text: {
                    x: this.param.textX,
                    y: null,
                    fontSize: this.param.fontSize,
                    text: d.text ? d.text : (d.name ? `${d.name}: ${format(d.value)}` : `${format(d.value)}`)
                },
                line: {
                    x1: null, y1: null, x2: null, y2: null,
                }
            }

            render.circle.y = this.param.y - render.circle.r;

            if (i == 0) {
                render.text.y = render.circle.y;
            }
            else {
                render.text.y = Math.min(
                    values[i - 1].render.text.y - this.param.textHeight,
                    render.circle.y
                );
            }

            render.line.x1 = render.text.x - 2;
            render.line.y1 = render.text.y;

            render.line.x2 = render.circle.x;
            render.line.y2 = render.circle.y;

            let dd = Math.sqrt((render.line.y2 - render.line.y1) ** 2 + (render.line.x2 - render.line.x1) ** 2)
            dd = render.circle.r / dd;

            render.line.x2 = render.line.x2 + (render.line.x1 - render.line.x2) * dd
            render.line.y2 = render.line.y2 - (render.line.y2 - render.line.y1) * dd

            d.render = render;

        }

        this.values = values;

        return this;
    }

    elementOnEnter(enter) {

        const self = this;

        enter = enter.append("g")
            .attr("class", self.class)

        enter.append("circle")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("cx", d => d.render.circle.x)
            .attr("cy", d => d.render.circle.y + d.render.circle.r)
            .attr("r", 0)
            .transition("legends").duration(500)
            .attr("cy", d => d.render.circle.y)
            .attr("r", d => d.render.circle.r)

        enter.append("text")
            .attr('x', d => d.render.text.x)
            .attr('y', d => d.render.text.y)
            .transition("legends").duration(500)
            .attr('dominant-baseline', 'middle')
            .attr("font-size", d => d.render.text.fontSize)
            .text(d => d.render.text.text)

        enter.append("line")
            .attr('class', self.param.lineClass)
            .attr('x1', d => d.render.line.x1)
            .attr('y1', d => d.render.line.y1)
            .attr('x2', d => d.render.line.x1)
            .attr('y2', d => d.render.line.y1)
            .transition("legends").duration(500)
            .attr('x2', d => d.render.line.x2)
            .attr('y2', d => d.render.line.y2)
            .attr('stroke', 'black')
            .attr('stroke-dasharray', ('2,2'))

        return enter;

    }

    elementOnUpdate(update) {

        update.select("circle")
            .transition("legends").duration(500)
            .attr("cx", d => d.render.circle.x)
            .attr("cy", d => d.render.circle.y)
            .attr("r", d => d.render.circle.r)

        update.select("text")
            .transition("legends").duration(500)
            .text(d => d.render.text.text)
            .attr('x', d => d.render.text.x)
            .attr('y', d => d.render.text.y)

        update.select("line")
            .transition("legends").duration(500)
            .attr('x1', d => d.render.line.x1)
            .attr('x2', d => d.render.line.x2)
            .attr('y1', d => d.render.line.y1)
            .attr('y2', d => d.render.line.y2)

        return update;

    }

    elementOnExit(exit) {

        exit.selectAll("circle")
            .transition("legends").duration(500)
            .attr("cy", d => d.render.circle.y + d.render.circle.r)
            .attr("r", 0)

        exit.selectAll("text")
            .remove()

        exit.selectAll("line")
            .remove()

        exit.transition("legends").duration(500)
            .remove();

        return exit;
    }
}

export class LegendGroups extends MultipleElements {

    constructor(svg, class_ = "bubble-legend-groups") {

        super(svg, class_, d => d.value);

        this.param = {
            padding: 10,
            radius: 7,
            textPadding: 5
        }

        this.elementid = (d) => d.id
    }

    updatemodel(values) {

        this.values = values
            .map((d, i, arr) => {
                if (typeof d != 'object') {
                    return {
                        order: i,
                        value: d,
                        color: randomcolor(i)
                    }
                }
                else {

                    if (d.color === undefined) {
                        d.color = randomcolor(i);
                    }

                    if (d.order === undefined) {
                        d.order = arr.length + i;
                    }

                    return d;
                }
            })
            .sort((a, b) => a.order - b.order)
            .map((d, i) => { d.order = i; return d; })

        return this;
    }

    updateview() {

        const self = this;

        // update svg height to match the total height of elements combined
        // this will be useful when using the svg inside an overflown div
        self.parent.attr("height", self.values.length * (self.param.radius * 2 + self.param.padding))

        super.updateview();

        return self;
    }

    elementOnEnter(enter) {

        const self = this;

        enter = enter.append("g")
            .attr("class", self.class)
            .style("cursor", "pointer")

        enter.append("circle")
            .attr("cx", self.param.radius)
            .attr("cy", self.parent.attr("height") + self.param.radius)
            .transition("legends").duration(500)
            .attr("cy", (d, i) => i * (self.param.radius * 2 + self.param.padding) + self.param.radius)
            .attr("r", self.param.radius)
            .attr("fill", d => d.color)

        enter.append("text")
            .attr("text-anchor", "left")
            .style("dominant-baseline", "middle")
            .attr("x", self.param.radius * 2 + self.param.textPadding)
            .attr("y", self.parent.attr("height") + self.param.radius)
            .transition("legends").duration(500)
            .attr("y", (d, i) => i * (self.param.radius * 2 + self.param.padding) + self.param.radius)
            .attr("fill", d => d.color)
            .text(d => d.value)

        return enter;
    }

    elementOnUpdate(update) {

        const self = this;

        update.select("circle")
            .transition("legends").duration(500)
            .attr("cy", (d, i) => i * (self.param.radius * 2 + self.param.padding) + self.param.radius)
            .attr("fill", d => d.color)

        update.select("text")
            .transition("legends").duration(500)
            .attr("y", (d, i) => i * (self.param.radius * 2 + self.param.padding) + self.param.radius)
            .attr("fill", d => d.color)
            .text(d => d.value)

        return update;
    }

    elementOnExit(exit) {

        const self = this;

        exit.selectAll("circle")
            .transition("legends").duration(500)
            .attr("cy", self.parent.attr("height") + self.param.radius)
            .remove()

        exit.selectAll("text")
            .transition("legends").duration(500)
            .attr("y", self.parent.attr("height") + self.param.radius)
            .remove()

        exit.transition("legends").duration(500)
            .remove();

        return exit;
    }
}

export class Tooltip {

    class; #html; selection;

    constructor(selection, html = "", class_ = "bubble-tooltip") {
        this.selection = selection;
        this.class = class_
        this.#html = html
        return this;
    }

    html(html) {
        this.#html = html;
        return this;
    }

    class(class_) {
        this.class = class_;
        this.tooltip.attr("class", this.class);
        return this;
    }

    show(x, y) {

        this.tooltip = this.selection
            .append("div")
            .attr("class", this.class)
            .style("position", "fixed")
            .style("background-color", "white")
            .style("border", "1px solid black")
            .style("padding", "10px")
            .style("color", "black")
            .style("pointer-events", "none")
            .style("left", `${x}px`)
            .style("top", `${y}px`)
            .html(this.#html);

        return this;
    }

    move(x, y) {
        this.tooltip
            .style("left", `${x}px`)
            .style("top", `${y}px`);
        return this;
    }

    hide() {
        this.tooltip.remove();
        return this;
    }

}

export class Selections {

    constructor(selectionarea,label) {

        this.SELECTIONAREA = selectionarea;

        this.optionsarray
        this.Selection
        this.Options
        this.defaultvalue
        this.onSelect
        this.label = label

    }

    OnSelect(callback) {

        const self = this;

        self.onSelect = callback;

        try {
            self.Selection.on("change", function () {

                const value = d3.select(this).property("value");

                self.onSelect(value);
            });
        }

        catch { }

        return this;

    }

    OptionsData(array) {

        this.optionsarray = array;

        this.defaultvalue = this.optionsarray[0].value;

        return this;
    }

    DefaultValue(value, sort = false) {

        this.defaultvalue = value;

        if (sort) {

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
        catch { }

        return this;
    }

    DrawSelection() {

        const self = this;
        var selectionDiv = self.SELECTIONAREA
            .append("div")
            .attr("class", "row");
        
        selectionDiv.append("label")
            .attr("class","col-sm-2 col-form-label")
            .html(self.label);
        self.Selection = selectionDiv
            .append("select")
            .attr("class", "col-sm-10");

        self.Options = self.Selection.selectAll("option")
            .data(self.optionsarray)
            .enter()
            .append("option")
            .text(d => d.name)
            .property("value", d => d.value)
            .property("selected", d => d.value == self.defaultvalue);

        self.Selection.on("change", function (d) {

            const selectedValue = d3.select(this).property("value");

            self.onSelect(selectedValue);
        });

        return self;
    }
}
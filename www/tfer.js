'use strict';


/*
** Function for formatting a probability value nicely.
*/
function format_probability(val) {

    var v;

    if (val === 0) {
        v = 0;
    } else if (val < 1e-3) {
        v = val.toExponential(2);
    } else if (val < 0.99995) {
        v = val.toFixed(4);
    } else {
        v = '~1';
    }

    return v;

}





/*
** Function for converting special character sequences
** into subscripts and superscripts.
** e.g. t_{0} => t subscript 0,
**      j^{th} => j superscript th
*/
function convert_sub_super_scripts(text) {
    
    return text.replace(/\^\{([a-z0-9]*)\}/ig, '<sup>$1</sup>')
        .replace(/_\{([a-z0-9}]*)\}/ig, '<sub>$1</sub>');

}




// Chart settings
var chart = {
    width: null,
    height: 400,
    margin: [30, 20, 25, 40],
    container: d3.select('#chart'),
    brushIsActive: false
};




/*
** Function for drawing the column chart/histogram of the
** simulated data returned by R.
*/
function column_chart(values) {

    chart.min = d3.min(values);
    chart.max = d3.max(values);
    chart.counts = [];
    chart.probs = [];
    chart.activeBar = -1; // stores index of currently active bar
    chart.brushIsActive = false;
    
    // Get dimensions of container element
    var dim = chart.container.node().getBoundingClientRect();
    chart.width = dim.width;

    // Width and height of actual plot area
    chart.plotAreaHeight = chart.height - chart.margin[0] - chart.margin[2];
    chart.plotAreaWidth = chart.width - chart.margin[1] - chart.margin[3];
    
    var i, N = values.length,
        uniqueVals = d3.range(chart.min, chart.max + 1),
        numUnique = chart.max - chart.min + 1;

    // Calculate counts for each unique Y value
    for (i = chart.min; i <= chart.max; i++) {
        chart.counts.push(values.filter(function(v) {
            return v === uniqueVals[i - chart.min];
        }).length);
    }

    // Use counts to calculate probabilities
    chart.probs = chart.counts.map(function(c) {
        return c / N;
    });

    // Remove SVG already present
    chart.container.select('svg').remove();

    // Create SVG
    var svgEl = chart.container.insert('svg', '.chart-tooltip')
        .attr('width', chart.width)
        .attr('height', chart.height);
    
    chart.svgRoot = svgEl;

    // Apply margins
    chart.svg = svgEl.append('g')
        .attr('pointer-events', 'none')
        .attr('transform', 'translate(' + chart.margin[3]
                + ',' + chart.margin[0] + ')');

    // Create x scale
    chart.xScale = d3.scale.linear()
        .domain([chart.min, chart.max + 1])
        .range([1, chart.plotAreaWidth]);

    // Create y scale, with padding at top
    chart.yScale = d3.scale.linear()
        .domain([0, d3.max(chart.probs) * 1.15])
        .range([chart.plotAreaHeight, 0]);
    
    // Create x axis
    var xAxis = d3.svg.axis()
        .orient('bottom')
        .outerTickSize(0)
        .innerTickSize(0)
        .tickFormat(function(x) {
            return (x === Math.floor(x) ? x : '');
        })
        .scale(chart.xScale);

    // Create y axis
    var yAxis = d3.svg.axis()
        .orient('left')
        .outerTickSize(0)
        .innerTickSize(-chart.plotAreaWidth)
        .scale(chart.yScale);

    var barData = d3.zip(uniqueVals, chart.probs),
        barWidth = chart.plotAreaWidth / numUnique;

    // Draw x axis
    chart.svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + barWidth/2 + ','
                + chart.plotAreaHeight + ')')
        .call(xAxis)
        .selectAll('text')
            .attr('dy', '1.2em');

    // Draw y axis
    chart.svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    // Add in cursor line that follows the mouse pointer
    chart.cursor = chart.svg.append('line')
        .attr({
            class: 'cursor',
            x1: 0,
            x2: 0,
            y1: 0,
            y2: chart.plotAreaHeight
        });

    // Group element to contain all the bars (rects)
    var barGroup = chart.svg.append('g')
        .attr('class', 'bars')
        .attr('transform', 'scale(1,-1)');

    // Draw the bars
    chart.bars = barGroup.selectAll('rect')
        .data(barData)
        .enter()
        .append('rect')
            .attr('x', function(d) {
                return chart.xScale(d[0]);
            })
            .attr('y', -chart.plotAreaHeight)
            .attr('width', barWidth)
            .attr('height', function(d) {
                return chart.plotAreaHeight - chart.yScale(d[1]);
            });
    
    // Create the label that will display the selection range
    // and probability sum of the d3 brush
    chart.selectionLabel = chart.svg.append('text')
        .style('opacity', 0)
        .attr({
            id: 'selection-label',
            'text-anchor': 'end',
            x: chart.plotAreaWidth,
            y: 0,
            dy: '-0.35em'
        })
    
    chart.selectionLabel.append('tspan').text('P( ');
    chart.selectionLabel.append('tspan').attr('class', 'fill-in');
    chart.selectionLabel.append('tspan').text(' <= Y < ');
    chart.selectionLabel.append('tspan').attr('class', 'fill-in');
    chart.selectionLabel.append('tspan').text(' ) = ');
    chart.selectionLabel.append('tspan').attr('class', 'fill-in');
    
    // Cache the tspan elements in the selection label
    chart.selectionElems = chart.selectionLabel.selectAll('tspan.fill-in');

    addBrush();

    // Draw a darker line along the x- and y-axes so they are
    // darker than the gridlines
    chart.svg.append('path')
        .attr('class', 'axis-dark')
        .attr('d', 'M0,0 L0,' + chart.plotAreaHeight + ' L'
                + chart.plotAreaWidth + ',' + chart.plotAreaHeight);

    
    addChartEvents(chart.svg.select('.brush'));

}



/*
** Function for adding the events for interactive tooltips
** to the chart.
*/
function addChartEvents(eventElem) {
    
    // Mousemove handler - when the mouse if moved over the chart
    var mousemove = function() {
        if (!chart.brushIsActive) updateTooltip();
    };

    // Mouseover handler - when the mouse enters the chart area
    var mouseover = function() {
        if (!chart.brushIsActive) showTooltip();
    };

    // Mouseout handler - then the mouse leaves the chart area
    var mouseout = function() {
        if (!chart.brushIsActive) hideTooltip();
    };

    // Add event handlers to the background rect element to make sure
    // we pick all events over the whole plotArea.
    eventElem.on('mousemove', mousemove)
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);
    
}





function hideTooltip() {
    
    chart.cursor.style('stroke-opacity', 0);
    chart.tooltip.style('display', 'none');

    if (chart.activeBar >= 0)
        chart.bars[0][chart.activeBar].style.fill = '';

    chart.activeBar = -1;
    
}





function showTooltip() {
    updateTooltip();
    chart.cursor.style('stroke-opacity', 1);
}




/*
** Function for updating the chart tooltip.
*/
function updateTooltip() {
    
    var pos = d3.mouse(chart.svgRoot.node()),
        x_pos = pos[0] - chart.margin[3],
        bar = Math.min(chart.bars[0].length - 1,
                       Math.max(0, Math.round(chart.xScale.invert(x_pos) - 0.5))),
        mid_x_pos0 = chart.xScale(bar - 0.5),
        mid_x_pos1 = chart.xScale(bar + 0.5);

    if (mid_x_pos1 > chart.plotAreaWidth) {
        // Force x-position within right boundary of plotArea
        x_pos = mid_x_pos0;
    }
    else if (mid_x_pos0 < 0) {
        // Force x-position within left boundary of plotArea
        x_pos = mid_x_pos1;
    }
    else {
        // Adjust x_position to match mid-point of nearest bar
        x_pos = (x_pos - mid_x_pos0 < mid_x_pos1 - x_pos ?
                 mid_x_pos0 :
                 mid_x_pos1);
    }

    // Move tooltip cursor to the current x-position
    chart.cursor.attr('transform', 'translate(' + x_pos + ',0)');
    
    var tt_x_label = chart.tooltip.select('.bar-x'),
        tt_y_label = chart.tooltip.select('.bar-y');

    var tt_left,
        tt_top,
        bar_size,
        tt_size;

    if (bar === chart.activeBar)
        return;

    // If a new bar has become active...

    // Set fill style of old active bar
    if (chart.activeBar >= 0)
        chart.bars[0][chart.activeBar].style.fill = '';

    // Update fill style of new active bar
    chart.bars[0][bar].style.fill = 'rgb(230, 0, 0)';

    // Set new active bar
    chart.activeBar = bar;

    // Get the size of this bar
    bar_size = chart.bars[0][bar].getBoundingClientRect();

    // Update the x- and y-labels in the tooltip
    tt_x_label.text(chart.min + bar);
    tt_y_label.text(format_probability(chart.probs[bar]));

    // Display the tooltip
    chart.tooltip.style('display', 'block');

    // Position and size of the tooltip
    tt_size = chart.tooltip.node().getBoundingClientRect();

    // New Y position for the tooltip
    tt_top = Math.max(10, chart.plotAreaHeight - 70 - bar_size.height);

    // New X position for the tooltip
    tt_left = x_pos + chart.margin[3] + 20;

    // Make sure the tooltip does not go off the right edge of
    // the chart. If necessary, make the tooltip appear to the
    // left of the active bar to prevent this from happening.
    if (tt_left + tt_size.width > chart.plotAreaWidth + chart.margin[3]) {
        tt_left -= (40 + tt_size.width);
    }

    // Update tooltop position
    chart.tooltip.style({
        left: tt_left + 'px',
        top: tt_top + 'px'
    });

}



/*
** Function for adding a d3 brush to the chart to enable
** range selection.
*/
function addBrush() {
 
    // Define d3 brush for our chart
    chart.brush = d3.svg.brush()
        .x(chart.xScale)
        .on('brush', onBrush);

    // Add brush functionality to the chart. Hide initially
    var gBrush = chart.svg.append('g')
        .attr('class', 'brush')
        .call(chart.brush);
    
    // Set brush height to the whole plot area height
    gBrush.selectAll('rect')
        .attr('height', chart.plotAreaHeight);
    
}



/*
** Function to be called when the brush extent changes.
*/
function onBrush() {
    
    if (!d3.event.sourceEvent)
        return; // only transition for user interaction

    var extent = chart.brush.extent(),
        extent2 = [0,0];

    // Make sure extent lies on edges of bars
    extent2[0] = Math.max(chart.min, Math.round(extent[0]));
    extent2[1] = Math.min(chart.max - chart.min + 1, Math.round(extent[1]));

    var nullBrush = extent2[1] === extent2[0];
    
    // Hide selection label if no range is selected
    chart.selectionLabel
        .style('opacity', nullBrush ? 0 : 1);
        
    chart.brushIsActive = !nullBrush;
        
    if (nullBrush) {
        showTooltip();
    } else {
        hideTooltip();
    }

    // Transition extent to adjusted range
    d3.select(this).transition()
        .duration(0)
        .call(chart.brush.extent(extent2))
        .call(chart.brush.event);

    // Get total probability corresponding to selection
    var p = format_probability(d3.sum(chart.probs.slice(extent2[0],
                                                        extent2[1])));

    // Update selection label tspan elements
    chart.selectionElems.text(function(d, i) {
        if (i === 2) return p;
        return extent2[i];
    });

    // Update `selected` data property on each bar
    chart.bars.each(function(d, i) {
        var val = d[0];
        d.selected = (val >= extent2[0] && val < extent2[1]);
    });

    // Add selected class to those bars whose `selected` property
    // is set to true.

    chart.bars.classed('selected', function(d) { return d.selected; }); 

}





/* ------------------- Chart tooltip and chart screen ------------------- */


// Create chart tooltip element
chart.tooltip = d3.select('#chart')
    .append('div')
    .attr('class', 'chart-tooltip')
    .html('Shards found: <span class="bar-x"></span>' +
          '<br>Probability: <span class="bar-y"></span>');


// Create chart screen element
chart.screen = d3.select('#chart')
    .append('div')
    .attr('class', 'chart-screen');

chart.screen.append('div')
    .text('Simulating ...');





/* ------------------- Help tooltip functionality ------------------- */


// Create help tooltip
var helpTooltip = d3.select('body')
    .append('div')
    .attr('id', 'help-tooltip')
    .html('Help text');

// Select all help icons
var help = d3.select('#parameters-form')
    .selectAll('span.help');

// When a help icon is moused over, display a tooltip
// giving more information. When moused out, hide tooltip.

help.on('mouseover', function() {
    
    // Detailed text
    var helpText = convert_sub_super_scripts(this.getAttribute('data-help'));
    
    // Get position/size of help icon
    var position = this.getBoundingClientRect();
    
    // Update help tooltip content
    helpTooltip.html(helpText)
        .style('display', 'block');
    
    // Get new position/size of help tooltip
    var ttDim = helpTooltip.node().getBoundingClientRect();
    
    // Calculate new X and Y positions for the help tooltip
    var x = position.left + document.body.scrollLeft,
        y = position.top + document.body.scrollTop - ttDim.height - 2;
    
    // Update position of tooltip and make it visible
    helpTooltip.style({
        left: x + 'px',
        top: y + 'px',
        opacity: 1
    });
    
}).on('mouseout', function() {
    
    // Hide tooltip
    helpTooltip.style({
        opacity: 0,
        display: 'none'
    });
    
});



// Reformat parameter labels to use superscripts and
// subscripts if present.

help.each(function() {
    
    var parent = d3.select(this.parentNode),
        label = parent.select('label');
    
    label.html(convert_sub_super_scripts(this.getAttribute('data-label')))
        .style('opacity', 1);
    
});




/* ------------------- Managing Data ------------------- */


// Our data will be stored here.
var data = [];

// Functions that listen to changes in the data array
// will be stored here.
var dataListeners = [];


/*
** Use this function to add a callback function that should
** be executed when the data array changes.
*/
function watchData(callback) {
    dataListeners.push(callback);
}


/*
** Function for updating the data array. Used in the R shiny
** code after running a simulation.
*/
function setData(d) {

    // Set data
    data = d;

    // Execute any functions that want to be notified
    // (executed) when the data changes
    dataListeners.forEach(function(callback) {
        callback(d);
    });

}


// Add a function we want to be executed when the data is
// updated. It redraws the chart and remove the chart screen.

watchData(function(d) {

    // Do nothing if no data
    if (!d.length) return;

    // New column chart
    column_chart(d);

    // Remove chart screen
    d3.select('.chart-screen')
        .classed('active', false);

});





// Does the browser support the checkValidity property on form
// elements?

var supportsValidity = (function() {

    var i = document.createElement('input');
    return typeof i.checkValidity === 'function';

})();



var inputsInvalid;


// If the browser supports checkValidity, we use these properties
// to check if the values entered by the user are valid. If not,
// add the input ID to the array of invalid inputs. Disable the
// simulation button until all inputs are valid.

if (supportsValidity) {
    
    // Store IDs of invalid inputs in this array
    inputsInvalid = [];

    // Bind keyup handler to all parameter inputs
    d3.select('#parameters-form').selectAll('input')
        .on('keyup', function() {

            // ID of current input
            var id = this.id;

            if (this.checkValidity()) {
                
                // If it is valid, make sure it is not included
                // in the invalid inputs array.
                inputsInvalid = inputsInvalid.filter(function(i) {
                    return i !== id;
                });

            } else {

                // It's invalid, so make sure it is included in
                // the invalid inputs array.
                if (inputsInvalid.indexOf(id) === -1)
                    inputsInvalid.push(id);

            }

            // Disable the simulation button if there are any invalid
            // inputs present.
            calcButton.attr('disabled', inputsInvalid.length ? '' : null);

        });

}


// Set up click functionality on the Simulation button.
// The callback function adds a 'screen' in front of the
// chart while the simulation is running.

d3.select('#run').on('click', function() {

    d3.select('.chart-screen')
        .classed('active', true);

});


// Preload spinner image that is displayed on the chart
// screen while a simulation is running.
var spinner = new Image();
spinner.src = 'spinner.gif';




/* ------------------- Create model diagram SVG ------------------- */


// Create model diagram using my own little library for
// manual drawing of node/link diagrams.

var diagram = node_link_diagram('#model', {
    addGrid: true,
    cellSize: 28,
    gridWidth: 30,
    gridHeight: 22
});

// Add the 2 boxes (outlines) with their labels
diagram
    .addBox(11, 1, 14, 7)
    .addBox(11, 18, 13, 7)
    .addLabel(17, 1, 'j = 2 ... t_1', 'left')
    .addLabel(17, 26.5, 'j = 2 ... t_1', 'left');

// Top-left group of nodes
diagram
    .addInteractiveNode(1, 5, 'square', 'd', 'Scientist\'s estimate of distance')
    .addInteractiveNode(3, 5, 'circle', 'd_1', 'The true but unknown distance')
    .addInteractiveNode(2, 10, 'circle', 'w_1', 'A random weighting factor that makes the distribution of fragments more realistic')
    .addInteractiveNode(5, 10, 'circle', 'l_1', 'The true but unknown mean number of fragments transferred')
    .addInteractiveNode(5, 5, 'square', 'l', 'Scientist\'s estimate of mean number of fragments transferred')
    .addInteractiveNode(5, 17, 'circle', 'x_0', 'The true but unknown actual number of fragments transferred');

// Top-right group of nodes
diagram
    .addInteractiveNode(2, 22, 'square', 'l_0', 'The lower bound on proportion of fragments lost in the first hour')
    .addInteractiveNode(2, 26, 'square', 'u_0', 'The upper bound on proportion of fragments lost in the first hour')
    .addInteractiveNode(4, 24, 'circle', 'p_0', 'The true but unknown probability that a fragment will be lost in the first hour')
    .addInteractiveNode(7, 24, 'circle', 'b_0', 'The true but unknown number of fragments lost in the first hour');

// Top-middle group of nodes
diagram
    .addInteractiveNode(7, 10, 'square', 'q', 'Scientist\'s estimate of the proportion of high persistence fragments')
    .addInteractiveNode(7, 14, 'circle', 'q_0', 'The true but unknown number of high persistence fragments')
    .addInteractiveNode(7, 20, 'circle', 'x_1', 'The true but unknown number of fragments remaining after the first hour excluding high persistent fragments')
    .addInteractiveNode(7, 3, 'square', 'l*_0', 'The lower bound on proportion of high persistence fragments lost in the first hour')
    .addInteractiveNode(7, 7, 'square', 'u*_0', 'The upper bound on proportion of high persistence fragments lost in the first hour')
    .addInteractiveNode(9, 5, 'circle', 'p*_0', 'The true but unknown probability that a high persistence fragment will be lost in the first hour')
    .addInteractiveNode(9, 9, 'circle', 'b*_0', 'The true number of high persistence fragments lost in the first hour')
    .addInteractiveNode(9, 12, 'circle', 'q_1', 'The true number of high persistence fragments remaining after the first hour');

// Middle 2 nodes for time
diagram
    .addInteractiveNode(12, 16, 'square', 't', 'Scientist\'s estimate of time between crime and apprehension')
    .addInteractiveNode(14, 16, 'circle', 't_1', 'The true but unknown time between crime and apprehension');

// Nodes inside left box
diagram
    .addInteractiveNode(12, 3, 'square', 'l*_j', 'The lower bound on proportion of high persistence fragments lost in the j^{th} hour')
    .addInteractiveNode(12, 7, 'square', 'u*_j', 'The upper bound on proportion of high persistence fragments lost in the j^{th} hour')
    .addInteractiveNode(14, 5, 'circle', 'p*_j', 'The true but unknown probability that a high persistence fragment is lost in the j^{th} hour')
    .addInteractiveNode(12, 12, 'circle', 'q_j', 'The true number of high persistence fragments remaining after the j^{th} hour')
    .addInteractiveNode(16, 12, 'circle', 'q_j+1', 'The true number of high persistence fragments remaining after the (j+1)^{th} hour')
    .addInteractiveNode(14, 9, 'circle', 'b*_j', 'The true number of high persistence fragments lost in the j^{th} hour');

// Nodes inside right box
diagram
    .addInteractiveNode(12, 25, 'square', 'l_j', 'The lower bound on proportion of normal fragments lost in the j^{th} hour')
    .addInteractiveNode(12, 29, 'square', 'u_j', 'The upper bound on proportion of normal fragments lost in the j^{th} hour')
    .addInteractiveNode(14, 27, 'circle', 'p_j', 'The true but unknown probability that a normal fragment is lost in the j^{th} hour')
    .addInteractiveNode(12, 20, 'circle', 'x_j', 'The true number of normal fragments remaining after the j^{th} hour')
    .addInteractiveNode(16, 20, 'circle', 'x_j+1', 'The true number of normal fragments remaining after the (j+1)^{th} hour')
    .addInteractiveNode(14, 23, 'circle', 'b_j', 'The true number of regular fragments lost in the j^{th} hour');

// Bottom-left group of nodes
diagram
    .addInteractiveNode(19, 4, 'square', 'l_R', 'The lower bound on the proportion of fragments not detected in the laboratory')
    .addInteractiveNode(19, 8, 'square', 'u_R', 'The upper bound on the proportion of fragments not detected in the laboratory')
    .addInteractiveNode(21, 6, 'circle', 'R', 'The true but unknown probability that a fragment detected in the laboratory');

// Bottom-center group of nodes
diagram
    .addInteractiveNode(19, 16, 'circle', 'y_1', 'The true total number of fragments remaining on the suspect upon apprehension')
    .addInteractiveNode(22, 14, 'circle', 'b', 'The true unknown number of fragments not detected in the laboratory')
    .addInteractiveNode(22, 20, 'circle', 'Y', 'The final number of fragments observed');


/* ----- Now add in all the links ----- */

diagram
    .addLink([1, 5], [3, 5], true)      // d -> d1
    .addLink([3, 5], [5, 10], true)     // d1 -> l1
    .addLink([1, 5], [5, 10], true)     // d -> l1
    .addLink([2, 10], [5, 10], true)    // w1 -> l1
    .addLink([5, 5], [5, 10], true)     // l -> l1
    .addLink([5, 10], [5, 17], true);   // l1 -> x0

diagram
    .addLink([7, 3], [9, 5], true)      // l0[left] -> p0[left]
    .addLink([7, 7], [9, 5], true)      // u0[left] -> p0[left]
    .addLink([9, 5], [9, 9], true)      // p0[left] -> b0[left]
    .addLink([9, 9], [9, 12], true)     // b0[left] -> q1
    .addLink([9, 9], [7, 14], true)     // b0[left] -> q0
    .addLink([7, 10], [7, 14], true)    // q -> q0
    .addLink([7, 14], [9, 12], true)    // q0 -> q1
    .addLink([9, 12], [12, 12], true);  // q1 -> qj

diagram
    .addLink([2, 22], [4, 24], true)    // l0[right] -> p0[right]
    .addLink([2, 26], [4, 24], true)    // u0[right] -> p0[right]
    .addLink([4, 24], [7, 24], true)    // p0[right] -> b0[right]
    .addLink([7, 24], [7, 20], true)    // b0[right] -> x1
    .addLink([5, 17], [7, 24], true)    // x0 -> b0[right]
    .addLink([5, 17], [7, 20], true)    // x0 -> x1
    .addLink([5, 17], [7, 14], true)    // x0 -> q0
    .addLink([7, 14], [7, 20], true)    // q0 -> x1
    .addLink([7, 20], [12, 20], true);  // x1 -> xj

diagram
    .addLink([12, 16], [14, 16], true)      // t -> t1
    .addLink([14, 16], [14, 13.3], true)    // t1 -> [left box]
    .addLink([14, 16], [14, 18.7], true);   // t1 -> [right box]

diagram
    .addLink([12, 3], [14, 5], true)    // lj[left] -> pj[left]
    .addLink([12, 7], [14, 5], true)    // uj[left] -> pj[left]
    .addLink([14, 5], [14, 9], true)    // pj[left] -> bj[left]
    .addLink([14, 9], [16, 12], true)   // bj[left] -> qj+1
    .addLink([12, 12], [14, 9], true)   // qj -> bj[left]
    .addLink([12, 12], [16, 12], true)  // qj -> qj+1
    .addLink([16, 12], [19, 16], true); // qj+1 -> y1

diagram
    .addLink([12, 20], [14, 23], true)  // xj -> bj[left]
    .addLink([12, 20], [16, 20], true)  // xj -> xj+1
    .addLink([14, 23], [16, 20], true)  // bj[left] -> xj+1
    .addLink([14, 27], [14, 23], true)  // pj[left] -> bj[left]
    .addLink([12, 25], [14, 27], true)  // lj[left] -> pj[left]
    .addLink([12, 29], [14, 27], true)  // uj[left] -> pj[left]
    .addLink([16, 20], [19, 16], true); // xj+1 -> y1

diagram
    .addLink([19, 16], [22, 14], true)  // y1 -> b
    .addLink([19, 16], [22, 20], true)  // y1 -> Y
    .addLink([22, 14], [22, 20], true); // b -> Y

diagram
    .addLink([19, 4], [21, 6], true)    // lR -> R
    .addLink([19, 8], [21, 6], true)    // uR -> R
    .addLink([21, 6], [22, 14], true);  // R -> b

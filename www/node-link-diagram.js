/*
**  This is an early-stage small library by David Banks
**  (http://davidbanks.co.nz) to manually draw things like
**  node-link diagrams. 
*/

var node_link_diagram = (function() {
    
'use strict';
    

function diagram(containerSelector, settings) {
    
    /* ----- Fill out default settings ----- */
    
    if (!(typeof settings.cellSize === 'number' && settings.cellSize > 0))
        settings.cellSize = 25;
    
    if (!(typeof settings.gridWidth === 'number' && settings.gridWidth > 0))
        settings.gridWidth = 20;
    
    if (!(typeof settings.gridHeight === 'number' && settings.gridHeight > 0))
        settings.gridHeight = 20;
    
    settings.addGrid = !!settings.addGrid; // convert to boolean
    
    /* ----- End settings ----- */
 
    var container = d3.select(containerSelector),
        svgElem = container.append('svg'),
        tooltip = container.append('div').attr('class', 'tooltip');
    
    var width = settings.cellSize * settings.gridWidth,
        height = settings.cellSize * settings.gridHeight,
        margin = 2;
    
    var defs = svgElem.append('defs');
    
    svgElem.attr({
        height: height + 2 * margin,
        width: width + 2 * margin
    });
    
    var svg = svgElem.append('g')
        .attr('transform', 'translate(' + margin + ',' + margin + ')');
    
    // Add line marker definition
    defs.append('marker')
        .attr({
            id: 'arrow',
            refX: 8,
            refY: 3,
            markerUnit: 'userSpaceOnUse',
            markerWidth: 8,
            markerHeight: 6,
            orient: 'auto'  
        })
        .append('path')
            .attr('d', 'M 0 0 8 3 0 6 Z');
    
    if (settings.addGrid)
        add_grid(svg, settings);
    
    var canvas = svg.append('g').attr('class', 'canvas');
    
    canvas.on('mouseover', function() {
        
        var parent = d3.event.target.parentNode;
        
        if (parent.className.baseVal === 'interactive-node') {
            
            var row = +parent.getAttribute('data-row'),
                col = +parent.getAttribute('data-col'),
                position = _getCoordinates(row, col),
                text = _getTooltipText(row, col);
            
            // replace superscript code with <sup> tag
            text = text.replace(/\^{([^}]*)}/, '<sup>$1</sup>');
            
            tooltip.html(text);
            
            var tt_dim = tooltip.node().getBoundingClientRect(), 
                tt_width = tt_dim.width,
                tt_height = tt_dim.height,
                x = position.x + margin,
                y = position.y + margin;
            
            
            // If tooltip overflows right side
            if (x + tt_width > width)
                x = width + margin - tt_width;
            
            // Position bottom of tooltip 10px above node
            y -= (10 + tt_height);
            
            // If small overflow at top, decrease gap to fit tooltip in
            if (y < margin && y >= margin - 5)
                y = margin;
            
            // If overflow at top is large, position the tooltip either
            // directly to the left or right of the node
            if (y < margin - 5) {
                
                y = position.y + margin + settings.cellSize - tt_height;
                
                if (x + settings.cellSize + 10 + tt_width < width) {
                    x = position.x + margin + settings.cellSize + 10;
                } else {
                    x = position.x + margin - tt_width - 10;
                }
                
            }
            
            tooltip.style({
                left: x + 'px',
                top: y + 'px'
            }).transition()
                .duration(200)
                .style('opacity', 1);
            
            svg.select('.node.at-' + row + '-' + col)
                .classed('active', true);
            
            
        }
        
    }).on('mouseout', function() {
        
        tooltip.transition()
            .delay(200)
            .duration(200)
            .style('opacity', 0);
        
        svg.select('.node.active')
            .classed('active', false);
        
    });
    
    
    var cellShapeStore = {},
        tooltipStore = {};
    
    
    
    
    /****** Private methods ******/
    
    var _argsToArray = function _argsToArray(args) {
        return Array.prototype.slice.call(args);
    };
    
    var _getCoordinates = function _getCoordinates(row, col) {
        
        return {
            x: (col - 1) * settings.cellSize,
            y: (row - 1) * settings.cellSize
        };
        
    };
    
    var _recordCellShape = function _recordCellShape(row, col, shape) {
        cellShapeStore[row + '_' + col] = shape;
    };
    
    var _getCellShape = function _getCellShape(row, col) {
        return cellShapeStore[row + '_' + col];
    };
    
    var _recordTooltipText = function _recordTooltipText(row, col, text) {
        tooltipStore[row + '_' + col] = text;
    };
    
    var _getTooltipText = function _getTooltipText(row, col) {
        return tooltipStore[row + '_' + col];
    };
    
    
    
    

    
    
    /****** Public methods ******/
    
    var _addSquare = function addSquare(parentElem, row, col) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var coords = _getCoordinates(row, col);
        
        parentElem.append('rect').attr({
            x: coords.x,
            y: coords.y,
            width: settings.cellSize,
            height: settings.cellSize,
            class: 'node square at-' + row + '-' + col
        });
        
        _recordCellShape(row, col, 'square');
        
        return this;
        
    };
    
    var _addCircle = function addCircle(parentElem, row, col) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var coords = _getCoordinates(row, col),
            radius = settings.cellSize/2;
        
        parentElem.append('circle').attr({
            cx: coords.x + radius,
            cy: coords.y + radius,
            r: radius,
            class: 'node circle at-' + row + '-' + col
        });
        
        _recordCellShape(row, col, 'circle');

    };
    
    var _addLabel = function addLabel(parentElem, row, col, text, align) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var coords = _getCoordinates(row, col),
            hasSubscript = text.search('_') > -1,
            hasSuperscript = !hasSubscript && text.search('^') > -1,
            textParts,
            extra;
        
        if (hasSubscript || hasSuperscript) {
            textParts = text.split(hasSubscript ? '_' : '^');
            text = textParts[0];
            extra = textParts[1];
        }
            
        
        var text = parentElem.append('text').attr({
            x: coords.x + settings.cellSize/2,
            y: coords.y + settings.cellSize/2,
            dy: extra ? '0.2em' : '0.35em',
            'text-anchor': align || 'middle',
            class: 'node-label at-' + row + '-' + col
        }).text(text);
        
        if (extra) {
            text.append('tspan')
                .text(extra)
                .attr('dy', '0.3em')
                .attr('class', hasSubscript ? 'subscript' : 'superscript');
        }
        
    };
    
    var _addLink = function addLink(parentElem, from, to, addArrow, type) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var reverse = from[1] > to[1],
            fromCoords = _getCoordinates(from[0], from[1]),
            toCoords = _getCoordinates(to[0], to[1]);
        
        var adjust = settings.cellSize/2,
            x1 = fromCoords.x + adjust,
            y1 = fromCoords.y + adjust,
            x2 = toCoords.x + adjust,
            y2 = toCoords.y + adjust,
            gradient = (x1 === x2 ? NaN : (y2 - y1) / (x2 - x1)),
            angle,
            fromNodeShape = _getCellShape(from[0], from[1]),
            toNodeShape = _getCellShape(to[0], to[1]);
        

        if (reverse)
            adjust *= -1;
        
        if (gradient >= 2 || (isNaN(gradient) && y2 > y1)) {
            y1 += adjust;
            y2 -= adjust;
        }
        else if (gradient >= 1) {
            x1 += adjust;
            y1 += adjust;
            x2 -= adjust;
            y2 -= adjust;
        }
        else if (gradient > -1) {
            x1 += adjust;
            x2 -= adjust;
        }
        else if (gradient > -2) {
            x1 += adjust;
            y1 -= adjust;
            x2 -= adjust;
            y2 += adjust;
        }
        else {
            y1 -= adjust;
            y2 += adjust;
        }
        

        if (isNaN(gradient)) {
            angle = Math.PI/2 + (y2 < y1 ? -1 : 1) * Math.PI/2;
        } else {
            angle = Math.atan(gradient) + (reverse ? -1 : 1) * Math.PI/2;
        }
   
        if (fromNodeShape === 'circle') { 
            x1 = fromCoords.x + (settings.cellSize/2) * (1 + Math.cos(angle - Math.PI/2));
            y1 = fromCoords.y + (settings.cellSize/2) * (1 + Math.sin(angle - Math.PI/2));
        }
        
        if (toNodeShape === 'circle') {
            x2 = toCoords.x + (settings.cellSize/2) * (1 - Math.cos(Math.PI/2 - angle));
            y2 = toCoords.y + (settings.cellSize/2) * (1 + Math.sin(Math.PI/2 - angle));
        }

        
        var line = parentElem.append('line').attr({
            x1: x1,
            x2: x2,
            y1: y1,
            y2: y2,
            class: 'link'
        });
        
        if (addArrow)
            line.attr('marker-end', 'url(#arrow)');
        
    };
    
    var _addBox = function addBox(parentElem, topLeftRow, topLeftCol, width, height) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var coords = _getCoordinates(topLeftRow, topLeftCol),
            w = width * settings.cellSize,
            h = height * settings.cellSize;
        
        canvas.append('rect').attr({
            x: coords.x,
            y: coords.y,
            width: w,
            height: h
        });
        
    };
    
    var _addInteractiveNode = function addInteractiveNode(parentElem, row, col, shape, label, hoverText) {
        
        if (!parentElem)
            parentElem = canvas;
        
        var g = canvas.append('g')
            .attr('class', 'interactive-node')
            .attr('data-row', row)
            .attr('data-col', col);
        
        if (shape === 'square') {
            _addSquare(g, row, col);
        } else {
            _addCircle(g, row, col);
        }
        
        _addLabel(g, row, col, label);
        
        _recordTooltipText(row, col, hoverText);
        
    };
    
    

    
    /****** Public API ******/
    
    return {
        
        addSquare: function() {
            _addSquare.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        },
        
        addCircle: function() {
            _addCircle.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        },
        
        addLabel: function() {
            _addLabel.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        },
        
        addLink: function() {
            _addLink.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        },

        addBox: function() {
            _addBox.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        },
        
        addInteractiveNode: function() {
            _addInteractiveNode.apply(null, [canvas].concat(_argsToArray(arguments)));
            return this;
        }
        
    };
    
    
}





function add_grid(svg, settings) {
    
    var i,
        nv = settings.gridWidth + 1,
        nh = settings.gridHeight + 1,
        width = settings.gridWidth * settings.cellSize,
        height = settings.gridHeight * settings.cellSize;
        
    var grid = svg.append('g').attr('class', 'grid');
    
    for (i = 0; i < nv; i++) {
        
        grid.append('line')
            .attr({
                x1: i * settings.cellSize,
                x2: i * settings.cellSize,
                y1: 0,
                y2: height
            });
               
    }
    
    for (i = 0; i < nh; i++) {
        
        grid.append('line')
            .attr({
                x1: 0,
                x2: width,
                y1: i * settings.cellSize,
                y2: i * settings.cellSize
            });
               
    }
    
}
    

return diagram;


})();

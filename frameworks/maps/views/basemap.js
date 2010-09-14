// ..........................................................
// A basic map, with a grid, axes, and labels
// 
/*globals Sai */

Sai.BaseMapView = Sai.CanvasView.extend({
  
  // ..........................................................
  // Properties
  
  // @param margins: left, top, right, bottom, in pixels
  margins: null,
  
  // @param grid: This is an array of arrays of pairs for the cells
  // @example: [[1,2], [5,6], [8,3]]
  // Cell #1: "1, 2"
  // Cell #2: "5, 6"
  // Cell #3: "8, 3"
  //
  grid: null,
  
  // @param leftAxis: left axis
  leftAxis: null,
  
  // @param rightAxis: right axis
  rightAxis: null,

  // @param bottomAxis: bottom axis
  bottomAxis: null,

  // @param topAxis: top axis
  topAxis: null,

  // @param axisAnchoredLabels: labels anchored at axis points
  axisAnchoredLabels: null,
  
  // @param canvasAnchoredLabels: general labels
  canvasAnchoredLabels: null,
  
  displayProperties: 'grid gridAttrs leftAxis rightAxis bottomAxis topAxis labels'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var margins = this.get('margins'),
        grid = this.get('grid'),
        axisAnchoredLabels = this.get('axisAnchoredLabels') || [],
        canvasAnchoredLabels = this.get('canvasAnchoredLabels') || [],
        f = this.get('frame'), axes;

    if (!firstTime) canvas.clear();  

    // If the grid isn't provided
    if (SC.none(grid)) grid = this._makeDefaultGrid();

    // If the grid is supplied with cols, rows, but no actual cells
    if (SC.none(grid.cells)) grid.cells = this._makeDefaultCells(grid);

    axes = this._makeAxes(f, canvas, margins, grid) || [];

    this._makeCells(f, canvas, grid, axes[0], axes[1], axes[2], axes[3]);

    this._makeAxisAnchoredLabels(f, canvas, grid, axes, axisAnchoredLabels);

    this._makeCanvasAnchoredLabels(f, canvas, canvasAnchoredLabels);
  },
  
  _makeAxes: function(f, canvas, margins, grid){
    var axis, path, tCount, space, offset, tmp, aa, width, height,
        yaLeft = this.get('leftAxis') || {},
        yaRight = this.get('rightAxis') || {}, 
        xaBottom = this.get('bottomAxis') || {},
        xaTop = this.get('topAxis') || {},
        cols = grid.cols,
        rows = grid.rows,
        startX = margins.left,
        endX = f.width - margins.right,
        endY = margins.top,
        startY = f.height - margins.bottom;

    // X axes
    if (xaBottom){
      // Calculate the coordinate system
      xaBottom.minCoord = startX;
      xaBottom.maxCoord = endX;
      aa = this._calculateForAxis(xaBottom, startX, endX, cols);
      xaBottom = aa[0]; tCount = aa[1];
      if (SC.none(xaBottom.hidden) || !xaBottom.hidden) this._makeAxis(canvas, startX, startY, endX, startY, xaBottom, {position: 'x-bottom', len: 5, count: tCount, space: xaBottom.space, offset: xaBottom.offset});
    }
    if (xaTop){
      // Calculate the coordinate system
      xaTop.minCoord = startX;
      xaTop.maxCoord = endX;
      aa = this._calculateForAxis(xaTop, startX, endX, cols);
      xaTop = aa[0]; tCount = aa[1];
      if (SC.none(xaTop.hidden) || !xaTop.hidden) this._makeAxis(canvas, startX, endY, endX, endY, xaTop, {position: 'x-top', len: 5, count: tCount, space: xaTop.space, offset: xaTop.offset});
    }

    // Y axes
    if (yaLeft){
      yaLeft.minCoord = endY;
      yaLeft.maxCoord = startY;
      aa = this._calculateForAxis(yaLeft, endY, startY, rows);
      yaLeft = aa[0]; tCount = aa[1];
      if (SC.none(yaLeft.hidden) || !yaLeft.hidden) this._makeAxis(canvas, startX, startY, startX, endY, yaLeft, {position: 'y-left', len: 5, count: tCount, space: yaLeft.space, offset: yaLeft.offset});
    }
    if (yaRight){
      yaRight.minCoord = endY;
      yaRight.maxCoord = startY;
      aa = this._calculateForAxis(yaRight, endY, startY, rows);
      yaRight = aa[0]; tCount = aa[1];
      if (SC.none(yaRight.hidden) || !yaRight.hidden) this._makeAxis(canvas, endX, startY, endX, endY, yaRight, {position: 'y-right', len: 5, count: tCount, space: yaRight.space, offset: yaRight.offset});
    }
    
    return [xaBottom, xaTop, yaLeft, yaRight];
  }, 

  _makeCells: function(f, canvas, grid, bottomAxis, topAxis, leftAxis, rightAxis){
    var x, xSpace = bottomAxis.space,
        xOffset = (xSpace*bottomAxis.offset), 
        y, ySpace = leftAxis.space,
        yOffset = (ySpace*leftAxis.offset), 
        cellWidth, cellHeight,
        fillColor, strokeColor,
        index = 0;

    if ((bottomAxis || topAxis) && (leftAxis || rightAxis)) {
      var minX = !SC.none(bottomAxis) ? bottomAxis.minCoord : topAxis.minCoord;
      var maxX = !SC.none(bottomAxis) ? bottomAxis.maxCoord : topAxis.maxCoord;
      var minY = !SC.none(leftAxis) ? leftAxis.maxCoord : rightAxis.maxCoord;
      var maxY = !SC.none(leftAxis) ? leftAxis.minCoord : rightAxis.minCoord;

      cellWidth = (maxX - minX) / grid.cols;
      cellHeight = (minY - maxY) / grid.rows;

      if (grid.showCellRects && grid.showCellRects === YES) {
        grid.cells.forEach( function(cell) {
          x = minX + ((cell.col-1) * cellWidth);
        
          // flip y
          y = minY - (cell.row * cellHeight);

          // draw the rectangle for the cell
          canvas.rectangle(x, y, cellWidth, cellHeight, 0, {stroke: cell.color.stroke, fill: cell.color.fill}, 'cell-%@-%@'.fmt(cell.col, cell.row));
        });
      }

      if (grid.showCellRectCornersAsPlusses && grid.showCellRectCornersAsPlusses === YES) {
        grid.cells.forEach( function(cell) {
          x = minX + ((cell.col-1) * cellWidth);
          y = minY - (cell.row * cellHeight);
          // hardcoded at line length 10 for now
          canvas.path('M%@,%@ L%@,%@'.fmt(x-5, y, x+5, y), {stroke: 'black'});
          canvas.path('M%@,%@ L%@,%@'.fmt(x, y-5, x, y+5), {stroke: 'black'});
        });
        // [TODO] - need to handle bottom row (as with ticks, one more than cell count)
      }

      if (grid.showCellNodesAsPlusses && grid.showCellNodesAsPlusses === YES) {
        grid.cells.forEach( function(cell) {
          x = minX + ((cell.col-1) * cellWidth) + (cellWidth / 2);
          y = minY - (cell.row * cellHeight) + (cellHeight / 2);
          // hardcoded at line length 10 for now
          canvas.path('M%@,%@ L%@,%@'.fmt(x-5, y, x+5, y), {stroke: 'black'});
          canvas.path('M%@,%@ L%@,%@'.fmt(x, y-5, x, y+5), {stroke: 'black'});
        });
      }

      if (grid.showCellNodesAsPoints && grid.showCellNodesAsPoints === YES) {
        grid.cells.forEach( function(cell) {
          x = minX + ((cell.col-1) * cellWidth) + (cellWidth / 2);
          y = minY - (cell.row * cellHeight) + (cellHeight / 2);
          // hardcoded at radius 10 for now
          canvas.circle(x, y, 10, {stroke: cell.color.stroke, fill: cell.color.fill}, 'cell-%@-%@'.fmt(cell.col, cell.row));
        });
      }

      if (grid.showCellValues && grid.showCellValues === YES) {
        grid.cells.forEach( function(cell) {
          x = minX + ((cell.col-1) * cellWidth);
          y = minY - (cell.row * cellHeight);
          // hardcoded values for now
          canvas.text(x, y, 30, 15, cell.value, {anchor: 'center', textAnchor: 'center', fill: 'yellow', stroke: 'yellow', fontSize: '8'});
        });
      }
    }
  },

  _makeCanvasAnchoredLabels: function(f, canvas, labels){
    var x, y;

    labels.forEach( function(label) {
      switch (label.anchor) {
      case 'bottom-left':
        x = 0;
        y = canvas.height;
        break;
      case 'top-left':
        x = 0;
        y = 0;
        break;
      case 'bottom-right':
        x = canvas.width;
        y = canvas.height;
        break;
      case 'top-right':
        x = canvas.width;
        y = 0;
        break;
      case 'left-middle':
        x = 0;
        y = canvas.height / 2;
        break;
      case 'right-middle':
        x = canvas.width;
        y = canvas.height / 2;
        break;
      case 'top-middle':
        x = canvas.width / 2;
        y = 0;
        break;
      case 'bottom-middle':
        x = canvas.width / 2;
        y = canvas.height;
        break;
      default:
        x = 0;
        y = 0;
        break;
      }

      x = +x + label.xOffset;
      y = +y + label.yOffset;

      canvas.text(x, y, label.width, label.height, label.label, label.labelAttrs);
    });
  },

  _xyFromAxes: function(axes, anchor){
    var x, y, xAxis, yAxis, bottomAxis = axes[0], topAxis = axes[1], leftAxis = axes[2], rightAxis = axes[3];

    if ((bottomAxis || topAxis) && (leftAxis || rightAxis)) {
      xAxis = !SC.none(bottomAxis) ? bottomAxis : topAxis;
      yAxis = !SC.none(leftAxis) ? leftAxis: rightAxis;

      switch (anchor) {
      case 'bottom-left':
        x = xAxis.minCoord;
        y = yAxis.maxCoord;
        break;
      case 'top-left':
        x = xAxis.minCoord;
        y = yAxis.minCoord;
        break;
      case 'bottom-right':
        x = xAxis.maxCoord;
        y = yAxis.maxCoord;
        break;
      case 'top-right':
        x = xAxis.maxCoord;
        y = yAxis.minCoord;
        break;
      case 'left-middle':
        x = xAxis.minCoord;
        y = yAxis.maxCoord + (yAxis.minCoord - yAxis.maxCoord) / 2;
        break;
      case 'right-middle':
        x = xAxis.maxCoord;
        y = yAxis.maxCoord + (yAxis.minCoord - yAxis.maxCoord) / 2;
        break;
      case 'top-middle':
        x = xAxis.minCoord + (xAxis.maxCoord - xAxis.minCoord) / 2;
        y = yAxis.minCoord;
        break;
      case 'bottom-middle':
        x = xAxis.minCoord + (xAxis.maxCoord - xAxis.minCoord) / 2;
        y = yAxis.maxCoord;
        break;
      default:
        break;
      }
    }
    return [x, y];
  },

  _makeAxisAnchoredLabels: function(f, canvas, grid, axes, labels){
    var x, y;

    labels.forEach( function(label) {
      xy = this._xyFromAxes(axes, label.anchor);

      x = xy[0];
      y = xy[1];

      x = +x + label.xOffset;
      y = +y + label.yOffset;

      canvas.text(x, y, label.width, label.height, label.label, label.labelAttrs);
    });
  },

  _calculateForAxis: function(axis, start, end, cellCount){
    var tCount, hasStepIncrement, hasStepCount;

    // If axis is provided, min and max are properties, in real
    // world coordinates.  Otherwise, the default axes will be 
    // true scale (1.0) in pixels, because end and start coming 
    // are already in pixel coordinates.
    var minRealWorldCoordinate = !SC.none(axis) ? axis.min : end;
    var maxRealWorldCoordinate = !SC.none(axis) ? axis.max : start;

    axis = axis || {};
    hasStepIncrement = !SC.none(axis.step);
    hasStepCount = !SC.none(axis.steps);
     
    var reachPixels = end - start;
    var reachRealWorld = maxRealWorldCoordinate - minRealWorldCoordinate;

    axis.coordScale = reachPixels / reachRealWorld;
         
    if (!hasStepIncrement && !hasStepCount){ // use provided cellCount
      tCount = cellCount;
      axis.step = ~~(reachPixels/tCount);
    } else if(hasStepCount){ // use a total count of X
      tCount = axis.steps;
      axis.step = ~~(reachPixels/tCount);
    } else { // Use step increments of X
      tCount = ~~(reachPixels / axis.step);
    }
    
    axis.space = reachPixels/tCount;
    tCount += 1; // add the last tick to the line
    axis.offset = 0;
    
    // Return modified Axis and tick count
    return [axis, tCount];
    },

  _makeAxis: function(canvas, sx, sy, ex, ey, axisAttrs, ticks){
    var path, i, len, position, tLen, tickPts = {}, currTick, tickLabels = [],
        space, tp, tOff, tickPositionFunc, rounder = this.rounder, step;
    
    axisAttrs = axisAttrs || {};
    step = axisAttrs.step || 1;
    // Draw the line to the end
    path = 'M%@1,%@2L%@3,%@4M%@1,%@2'.fmt(rounder(sx), rounder(sy), rounder(ex), rounder(ey));
    if (ticks){
      position = ticks.position;
      tLen = ticks.len;
      space = ticks.space;
      
      // Find the right tick intremental function based off of the axis (X or Y)
      if (position === 'x-bottom') {
        tickPositionFunc = function(x,y,sp){ return [x, (y+tLen), (x+sp), y]; };
      }
      else if (position === 'x-top') {
        tickPositionFunc = function(x,y,sp){ return [x, (y-tLen), (x+sp), y]; };
      }
      else if (position === 'y-left') {
        tickPositionFunc = function(x,y,sp){ return [(x-tLen), y, x, (y-sp)]; };
      }
      else {  // y-right
        tickPositionFunc = function(x,y,sp){ return [(x+tLen), y, x, (y-sp)]; };
      }
      
      // Some times you want to ofset the start of the ticks to center
      tOff = ticks.offset || 0;
      if (tOff > 0 && tOff < 1){
        tp = tickPositionFunc(sx,sy,space*tOff);
        sx = tp[2];
        sy = tp[3];
        path += 'M%@,%@'.fmt(rounder(sx), rounder(sy));
      }
      
      // Draw all the ticks
      for (i = 0, len = ticks.count; i < len; i++){
        tp = tickPositionFunc(sx,sy,space);
        sx = tp[2];
        sy = tp[3];
        currTick = {x: rounder(tp[0]), y: rounder(tp[1])};
        path += 'L%@,%@M%@,%@'.fmt(currTick.x, currTick.y, rounder(tp[2]), rounder(tp[3]));
        tickPts[i] = {t: currTick, idx: i*step};
        tickLabels.push(''+i*step);
      }
    }
    //console.log('Axis Path: '+path);
    
    // Do Labels
    if (!SC.none(axisAttrs.labels)) this._makeAxisLabels(canvas, tickPts, axisAttrs, ticks, tickLabels);
    
    canvas.path(path, {stroke: axisAttrs.color || 'black', strokeWidth: axisAttrs.weight || 1}, '%@-axis'.fmt(position));
  },
  
  _makeAxisLabels: function(canvas, tickPts, axisAttrs, ticks, tLabels) {
    var position, labels, l, lAttrs, tick, aa, t, labelPositionFunc, col,
        lWidth, lHeight, lOff;
    
    aa = axisAttrs || {};
    position = ticks ? ticks.position || 'x-bottom' : 'x-bottom';
    labels = aa.labels || [];
    lAttrs = aa.labelAttrs || {};
    lWidth = lAttrs.width || ticks.space*0.9 || 50;
    lHeight = lAttrs.height || 15;
    // FIXME: [EG] HATE THIS...need to find out how to calulate the middle point of a text
    lOff = lAttrs.offset || 0;
    col = aa.labelColor || aa.color || 'black';
    
    // Create the label positioning function
    if (position === 'x-bottom'){
      labelPositionFunc = function(t, label){ 
        var x, y;
        x = +t.x;
        y = +t.y + lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (position === 'x-top') {
      labelPositionFunc = function(t, label){ 
        var x, y;
        x = +t.x;
        y = +t.y - lHeight - (lHeight/2) - lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (position === 'y-left') {
      labelPositionFunc = function(t, label){ 
        var x, y;
        x = +t.x - lWidth;
        y = +t.y - lHeight - (lHeight/3);
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (position === 'y-right') {
      labelPositionFunc = function(t, label){ 
        var x, y;
        x = +t.x + lOff;
        y = +t.y - lHeight - (lHeight/3);
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    
    if (SC.typeOf(labels) === SC.T_HASH){ 
      this._generateIncrementalLabels(tickPts, labels, labelPositionFunc, YES);
    }
    else if (SC.typeOf(labels) === SC.T_ARRAY){
      this._generateIncrementalLabels(tickPts, labels, labelPositionFunc, NO);
    }
    else if (SC.typeOf(labels) === SC.T_BOOL){
      this._generateIncrementalLabels(tickPts, tLabels, labelPositionFunc, NO);
    }
  },
  
  _generateIncrementalLabels: function(pts, labels, func, useIndex){
    var tick, t, l, idx;
    for (t in pts){
      tick = pts[t].t;
      idx = pts[t].idx;
      l = useIndex ? labels[idx] : labels[t];
      if (!SC.none(tick) && l) func(tick, l);
    }
  },
  
  rounder: function(coord){
    if (coord > (~~coord+0.00051)) return coord.toFixed(3);
    return coord.toFixed(0);
  },

  _makeDefaultGrid: function(){
    // Default grid has 5 columns and 5 rows
    //
    // Nothing is shown, but nodeAnchoredLabels will still work.
    //
    return { cols: 5, rows: 5, 
             showCellRects: NO, 
             showCellValues: NO, 
             showCellNodesAsPlusses: NO, 
             showCellNodesAsPoints: NO, 
             showCellRectCornersAsPlusses: NO,
             cells: [{ color: { fill: 'white',  stroke: 'black'}, value: 0, col: 1, row: 5 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 2, row: 5 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 3, row: 5 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 4, row: 5 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 5, row: 5 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 1, row: 4 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 2, row: 4 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 3, row: 4 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 4, row: 4 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 5, row: 4 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 1, row: 3 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 2, row: 3 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 3, row: 3 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 4, row: 3 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 5, row: 3 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 1, row: 2 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 2, row: 2 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 3, row: 2 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 4, row: 2 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 5, row: 2 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 1, row: 1 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 2, row: 1 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 3, row: 1 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 4, row: 1 },
                     { color: { fill: 'white',  stroke: 'black'}, value: 0, col: 5, row: 1 }]};
  },
  
  _makeDefaultCells: function(grid){
    // Default grid has 5 columns and 5 rows
    //
    // Nothing is shown, but nodeAnchoredLabels will still work.
    //
    var cells = [];
    for (var i=0; i<grid.cols; i++){
      for (var j=0; j<grid.rows; j++){
        cells.push({ color: { fill: 'white',  stroke: 'black'}, value: 0, col: i, row: j });
      }
    }
    return cells;
  }
  
});




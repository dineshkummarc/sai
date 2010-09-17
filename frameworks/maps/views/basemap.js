// ..........................................................
// A basic map, with a grid, axes, and labels
// 
/*globals Sai */

Sai.BaseMapView = Sai.CanvasView.extend({
  
  // ..........................................................
  // Properties
  
  // @param margins: left, top, right, bottom, in pixels
  margins: null,
  
  // @param aoi: xMin, xMax, yMin, yMax
  aoi: null,

  aoiScreenBox: null,

  // @param grid: cols, rows, xMin, XMax, yMin, yMax...
  grid: null,
  
  // @param axes: axes
  axes: null,

  axesScreenBox: null,

  // @param axisAnchoredLabels: labels anchored at axis points
  axisAnchoredLabels: null,
  
  // @param canvasAnchoredLabels: general labels
  canvasAnchoredLabels: null,
  
  // @param mapLayers: a list of map layers containing map elements,
  //                   in real world coordinate space
  mapLayers: null,

  displayProperties: 'grid gridAttrs leftAxis rightAxis bottomAxis topAxis labels'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var margins = this.get('margins'),
        aoi = this.get('aoi') || [],
        aoiScreenBox = this.get('aoiScreenBox') || [],
        axes = this.get('axes') || [],
        axesScreenBox = this.get('axesScreenBox') || [],
        grid = this.get('grid'),
        axisAnchoredLabels = this.get('axisAnchoredLabels') || [],
        canvasAnchoredLabels = this.get('canvasAnchoredLabels') || [],
        mapLayers = this.get('mapLayers') || [],
        f = this.get('frame');

    aoiScreenBox = { xMin: margins.left,
                     xMax: f.width - margins.right,
                     yMin: margins.top,
                     yMax: f.height - margins.bottom };

    if (!firstTime) canvas.clear();  

    // If the grid isn't provided
    if (SC.none(grid)) grid = this._makeDefaultGrid();

    // If the grid is supplied with cols, rows, but no actual cells
    if (SC.none(grid.cells)) grid.cells = this._makeDefaultGridCellData(grid);

    screenData = this._makeAxes(this, f, canvas, margins, aoi, aoiScreenBox, axes, grid) || [];

    axes = screenData[0];
    aoiScreenBox = screenData[1];
    axesScreenBox = screenData[2];

    this._makeGridCells(f, canvas, grid, axesScreenBox);

    this._makeAxisAnchoredLabels(this, f, canvas, grid, axesScreenBox, axisAnchoredLabels);

    this._makeCanvasAnchoredLabels(f, canvas, canvasAnchoredLabels);

    this._makeMapLayers(this, f, canvas, aoiScreenBox, axesScreenBox, axes, mapLayers);
  },
  
  _makeAxes: function(self, f, canvas, margins, aoi, aoiScreenBox, axes, grid) {
    var axis, path, stepCount, offset, tmp, aa, width, height,
        coordScale, step, tickAttrs,
        hasStepIncrement, hasStepCount,
        cols = grid.cols,
        rows = grid.rows,
        axesScreenBox = { xMin: 0,
                          xMax: 0,
                          yMin: 0,
                          yMax: 0 },
        reachPixels, reachRealWorld,
        bottomAxis, topAxis, leftAxis, rightAxis;
    
    // Find the axes that were provided.
    axes.forEach( function(axis) {
      switch (axis.name) {
      case 'bottom-axis':
        bottomAxis = axis;
        break;
      case 'top-axis':
        topAxis = axis;
        break;
      case 'left-axis':
        leftAxis = axis;
        break;
      case 'right-axis':
        rightAxis = axis;
        break;
      default:
        break;
      }
    });
      
    // Create the axes that were not provided, marking them hidden.
    // If counterpart exists (e.g., top to bottom), copy attributes.
    if (SC.none(bottomAxis)) {
      if (!SC.none(topAxis)) {
        coordScale = topAxis.coordScale;
        step = topAxis.step;
        stepCount = topAxis.stepCount;
        offset = topAxis.offset;
        tickAttrs = topAxis.tickAttrs;
      }
      else {
        offset = 0;
        tickAttrs = {len: 5, offset: offset};
      }
      axes.push({ name: 'bottom-axis', hidden: YES, tickLength: 5, tickAngle: 180, color: 'black', min: 0, max: 0,
                  labelAttrs: {fontSize: '9'}, labelOffset: 0, labels: [], tickAttrs: tickAttrs});
    }
    if (SC.none(topAxis)) {
      if (!SC.none(bottomAxis)) {
        coordScale = bottomAxis.coordScale;
        step = bottomAxis.step;
        stepCount = bottomAxis.stepCount;
        offset = bottomAxis.offset;
        tickAttrs = bottomAxis.tickAttrs;
      }
      else {
        offset = 0;
        tickAttrs = {len: 5, offset: offset};
      }
      axes.push({ name: 'top-axis', hidden: YES, tickLength: 5, tickAngle: 0, color: 'black', min: 0, max: 0,
                  labelAttrs: {fontSize: '9'}, labelOffset: 0, labels: [], tickAttrs: tickAttrs});
    }
    if (SC.none(leftAxis)) {
      if (!SC.none(rightAxis)) {
        coordScale = rightAxis.coordScale;
        step = rightAxis.step;
        stepCount = rightAxis.stepCount;
        offset = rightAxis.offset;
        tickAttrs = rightAxis.tickAttrs;
      }
      else {
        coordScale = 1.0;
        offset = 0;
        tickAttrs = {len: 5, offset: offset};
      }
      axes.push({ name: 'left-axis', hidden: YES, tickLength: 5, tickAngle: 270, color: 'black', min: 0, max: 0,
                  labelAttrs: {fontSize: '9'}, labelOffset: 0, labels: [], tickAttrs: tickAttrs});
    }
    if (SC.none(rightAxis)) {
      if (!SC.none(leftAxis)) {
        coordScale = leftAxis.coordScale;
        step = leftAxis.step;
        stepCount = leftAxis.stepCount;
        offset = leftAxis.offset;
        tickAttrs = leftAxis.tickAttrs;
      }
      else {
        coordScale = 1.0;
        offset = 0;
        tickAttrs = {len: 5, offset: offset};
      }
      axes.push({ name: 'right-axis', hidden: YES, tickLength: 5, tickAngle: 90, color: 'black', min: 0, max: 0,
                  labelAttrs: {fontSize: '9'}, labelOffset: 0, labels: [], tickAttrs: tickAttrs});
    }

    axes.forEach( function(axis) {
      switch (axis.name) {
      case 'bottom-axis':
      case 'top-axis':
        reachPixels = aoiScreenBox.xMax - aoiScreenBox.xMin;
        reachRealWorld = aoi.xMax - aoi.xMin;
        axis.coordScale = reachPixels / reachRealWorld;

        axis.min = (aoi.xMin === grid.xMin) ? aoiScreenBox.xMin : aoiScreenBox.xMin + (((grid.xMin - aoi.xMin) / reachRealWorld) * reachPixels);
        axis.max = (aoi.xMax === grid.xMax) ? aoiScreenBox.xMax : aoiScreenBox.xMax - (((aoi.xMax - grid.xMax) /reachRealWorld) * reachPixels);

        hasStepIncrement = !SC.none(axis.step);
        hasStepCount = !SC.none(axis.stepCount);
     
        if (!hasStepIncrement && !hasStepCount) { // use grid dimension
          stepCount = cols;
          axis.step = ~~((axis.max - axis.min)/cols);
        } else if (hasStepCount) { 
          stepCount = axis.stepCount;
          axis.step = ~~((axis.max - axis.min)/axis.stepCount);
        } else { 
          stepCount = ~~((axis.max - axis.min)/axis.step);
        }

        axis.offset = 0;

        if (SC.none(axis.tickAttrs)) {
          axis.tickAttrs = {len: 5, stepCount: stepCount+1, step: axis.step, offset: axis.offset};
        }
        else {
          axis.tickAttrs.len       = axis.tickAttrs.len       || 5;
          axis.tickAttrs.stepCount = axis.tickAttrs.stepCount || stepCount+1;
          axis.tickAttrs.step      = axis.tickAttrs.step      || step;
          axis.tickAttrs.offset    = axis.tickAttrs.offset    || 0;
        }
        axesScreenBox.xMin = axis.min;
        axesScreenBox.xMax = axis.max;

        if (axis.name === 'bottom-axis') { 
          bottomAxis = axis;
        }
        else {
          topAxis = axis;
        }
        break;
      case 'left-axis':
      case 'right-axis':
        reachPixels = aoiScreenBox.yMax - aoiScreenBox.yMin;
        reachRealWorld = aoi.yMax - aoi.yMin;
        axis.coordScale = reachPixels / reachRealWorld;

        axis.min = (aoi.yMin === grid.yMin) ? aoiScreenBox.yMax : aoiScreenBox.yMax - (((grid.yMin - aoi.yMin) / reachRealWorld) * reachPixels);
        axis.max = (aoi.yMax === grid.yMax) ? aoiScreenBox.yMin : aoiScreenBox.yMin + (((aoi.yMax - grid.yMax) / reachRealWorld) * reachPixels);

        hasStepIncrement = !SC.none(axis.step);
        hasStepCount = !SC.none(axis.stepCount);
     
        if (!hasStepIncrement && !hasStepCount) { // use grid dimension
          stepCount = rows;
          axis.step = ~~((axis.min - axis.max)/rows);
        } else if (hasStepCount) { 
          stepCount = axis.stepCount;
          axis.step = ~~((axis.min - axis.max)/axis.stepCount);
        } else { 
          stepCount = ~~((axis.min - axis.max)/axis.step);
        }

        axis.offset = 0;

        if (SC.none(axis.tickAttrs)) {
          axis.tickAttrs = {len: 5, stepCount: stepCount+1, step: axis.step, offset: axis.offset};
        }
        else {
          axis.tickAttrs.len       = axis.tickAttrs.len       || 5;
          axis.tickAttrs.stepCount = axis.tickAttrs.stepCount || stepCount+1;
          axis.tickAttrs.step      = axis.tickAttrs.step      || step;
          axis.tickAttrs.offset    = axis.tickAttrs.offset    || 0;
        }

        axesScreenBox.yMin = axis.min;
        axesScreenBox.yMax = axis.max;

        if (axis.name === 'left-axis') { 
          leftAxis = axis;
        }
        else {
          rightAxis = axis;
        }
        break;
      default:
        break;
      }
    });

    axes.forEach( function(axis) {
      if (SC.none(axis.hidden) || !axis.hidden) self._makeAxis(canvas, axesScreenBox, axis);
    });
    
    return [axes, aoiScreenBox, axesScreenBox];
  }, 

  _makeGridCells: function(f, canvas, grid, axesScreenBox) {
    var x, y, 
        cellWidth, cellHeight,
        fillColor, strokeColor,
        index = 0;

    var xMin = axesScreenBox.xMin;
    var xMax = axesScreenBox.xMax;
    var yMinUp = axesScreenBox.yMin;
    var yMaxUp = axesScreenBox.yMax;

    cellWidth = (xMax - xMin) / grid.cols;
    cellHeight = (yMinUp - yMaxUp) / grid.rows;

    if (!SC.none(grid.showCellRects) && grid.showCellRects === YES) {
      grid.cells.forEach( function(cell) {
        x = xMin + ((cell.col-1) * cellWidth);
        
        // flip y
        y = yMinUp - (cell.row * cellHeight);

        // draw the rectangle for the cell
        canvas.rectangle(x, y, cellWidth, cellHeight, 0, {stroke: cell.color.stroke, fill: cell.color.fill}, 'cell-%@-%@'.fmt(cell.col, cell.row));
      });
    }

    if (!SC.none(grid.showCellRectCornersAsPlusses) && grid.showCellRectCornersAsPlusses === YES) {
      grid.cells.forEach( function(cell) {
        x = xMin + ((cell.col-1) * cellWidth);
        y = yMinUp - (cell.row * cellHeight);
        // hardcoded at line length 10 for now
        canvas.path('M%@,%@ L%@,%@'.fmt(x-5, y, x+5, y), {stroke: 'black'});
        canvas.path('M%@,%@ L%@,%@'.fmt(x, y-5, x, y+5), {stroke: 'black'});
      });
      // [TODO] - need to handle bottom row (as with ticks, one more than cell count)
    }

    if (!SC.none(grid.showCellNodesAsPlusses) && grid.showCellNodesAsPlusses === YES) {
      grid.cells.forEach( function(cell) {
        x = xMin + ((cell.col-1) * cellWidth) + (cellWidth / 2);
        y = yMinUp - (cell.row * cellHeight) + (cellHeight / 2);
        // hardcoded at line length 10 for now
        canvas.path('M%@,%@ L%@,%@'.fmt(x-5, y, x+5, y), {stroke: 'black'});
        canvas.path('M%@,%@ L%@,%@'.fmt(x, y-5, x, y+5), {stroke: 'black'});
      });
    }

    if (!SC.none(grid.showCellNodesAsPoints) && grid.showCellNodesAsPoints === YES) {
      grid.cells.forEach( function(cell) {
        x = xMin + ((cell.col-1) * cellWidth) + (cellWidth / 2);
        y = yMinUp - (cell.row * cellHeight) + (cellHeight / 2);
        // hardcoded at radius 10 for now
        canvas.circle(x, y, 10, {stroke: cell.color.stroke, fill: cell.color.fill}, 'cell-%@-%@'.fmt(cell.col, cell.row));
      });
    }

    if (!SC.none(grid.showCellValues) && grid.showCellValues === YES) {
      grid.cells.forEach( function(cell) {
        x = xMin + ((cell.col-1) * cellWidth);
        y = yMinUp - (cell.row * cellHeight);
        // hardcoded values for now
        canvas.text(x, y, 30, 15, cell.value, {anchor: 'center', textAnchor: 'center', fill: 'yellow', stroke: 'yellow', fontSize: '8'});
      });
    }
  },

  _makeCanvasAnchoredLabels: function(f, canvas, labels) {
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

  _anchorFromAxes: function(self, axesScreenBox, anchor) {
    var x, y;

    var xMin = axesScreenBox.xMin;
    var xMax = axesScreenBox.xMax;
    var yMinUp = axesScreenBox.yMax;
    var yMaxUp = axesScreenBox.yMin;

    switch (anchor) {
    case 'bottom-left':
      x = xMin;
      y = yMaxUp;
      break;
    case 'top-left':
      x = xMin;
      y = yMinUp;
      break;
    case 'bottom-right':
      x = xMax;
      y = yMaxUp;
      break;
    case 'top-right':
      x = xMax;
      y = yMinUp;
      break;
    case 'left-middle':
      x = xMin;
      y = yMaxUp + (yMinUp - yMaxUp) / 2;
      break;
    case 'right-middle':
      x = xMax;
      y = yMaxUp + (yMinUp - yMaxUp) / 2;
      break;
    case 'top-middle':
      x = xMin + (xMax - xMin) / 2;
      y = yMinUp;
      break;
    case 'bottom-middle':
      x = xMin + (xMax - xMin) / 2;
      y = yMaxUp;
      break;
    default:
      break;
    }

    return [x, y];
  },

  _makeAxisAnchoredLabels: function(self, f, canvas, grid, axesScreenBox, labels) {
    var x, y;

    labels.forEach( function(label) {
      xy = self._anchorFromAxes(self, axesScreenBox, label.anchor);

      x = xy[0];
      y = xy[1];

      x = +x + label.xOffset;
      y = +y + label.yOffset;

      canvas.text(x, y, label.width, label.height, label.label, label.labelAttrs);
    });
  },

  _makeAxis: function(canvas, axesScreenBox, axis) {
    var path, i, len, tLen, tickPts = {}, currTick, tickLabels = [],
        sx, sy, ex, ey,
        step, tp, tOff, tickPositionFunc, rounder = this.rounder;
    

    switch (axis.name) {
    case 'bottom-axis':
      sx = axesScreenBox.xMin; 
      sy = axesScreenBox.yMin;
      ex = axesScreenBox.xMax;
      ey = axesScreenBox.yMin;
      tickPositionFunc = function(x,y,sp) { return [x, (y+tLen), (x+sp), y]; };
      break;
    case 'top-axis':
      sx = axesScreenBox.xMin; 
      sy = axesScreenBox.yMax;
      ex = axesScreenBox.xMax;
      ey = axesScreenBox.yMax;
      tickPositionFunc = function(x,y,sp) { return [x, (y-tLen), (x+sp), y]; };
      break;
    case 'left-axis':
      sx = axesScreenBox.xMin; 
      sy = axesScreenBox.yMin;
      ex = axesScreenBox.xMin;
      ey = axesScreenBox.yMax;
      tickPositionFunc = function(x,y,sp) { return [(x-tLen), y, x, (y-sp)]; };
      break;
    case 'right-axis':
      sx = axesScreenBox.xMax; 
      sy = axesScreenBox.yMin;
      ex = axesScreenBox.xMax;
      ey = axesScreenBox.yMax;
      tickPositionFunc = function(x,y,sp) { return [(x+tLen), y, x, (y-sp)]; };
      break;
    default:
      break;
    }

    step = axis.step || 1;
    // Draw the line to the end
    path = 'M%@1,%@2L%@3,%@4M%@1,%@2'.fmt(rounder(sx), rounder(sy), rounder(ex), rounder(ey));
    if (axis.tickAttrs) {
      tLen = axis.tickAttrs.len;
      step = axis.tickAttrs.step;
      
      // Some times you want to ofset the start of the ticks to center
      tOff = axis.tickAttrs.offset || 0;
      if (tOff > 0 && tOff < 1) {
        tp = tickPositionFunc(sx,sy,step*tOff);
        sx = tp[2];
        sy = tp[3];
        path += 'M%@,%@'.fmt(rounder(sx), rounder(sy));
      }
      
      // Draw all the ticks
      for (i = 0, len = axis.tickAttrs.stepCount; i < len; i++) {
        tp = tickPositionFunc(sx,sy,step);
        sx = tp[2];
        sy = tp[3];
        currTick = {x: rounder(tp[0]), y: rounder(tp[1])};
        path += 'L%@,%@M%@,%@'.fmt(currTick.x, currTick.y, rounder(tp[2]), rounder(tp[3]));
        tickPts[i] = {t: currTick, idx: i*step};
        tickLabels.push(''+i*step);
      }
    }
    
    // Do Labels
    if (!SC.none(axis.labels)) this._makeAxisLabels(canvas, tickPts, axis);
    
    canvas.path(path, {stroke: axis.color || 'black', strokeWidth: axis.weight || 1}, axis.name);
  },
  
  _makeAxisLabels: function(canvas, tickPts, axis) {
    var labels, l, lAttrs, tick, aa, t, labelPositionFunc, col,
        lWidth, lHeight, lOff;
    
    aa = axis.axisAttrs || {};
    labels = aa.labels || [];
    lAttrs = aa.labelAttrs || {};
    lWidth = lAttrs.width || aa.step*0.9 || 50;
    lHeight = lAttrs.height || 15;
    // FIXME: [EG] HATE THIS...need to find out how to calulate the middle point of a text
    lOff = lAttrs.offset || 0;
    col = aa.labelColor || aa.color || 'black';
    
    // Create the label positioning function
    if (axis.name === 'bottom-axis') {
      labelPositionFunc = function(t, label) { 
        var x, y;
        x = +t.x;
        y = +t.y + lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (axis.name === 'top-axis') {
      labelPositionFunc = function(t, label) { 
        var x, y;
        x = +t.x;
        y = +t.y - lHeight - (lHeight/2) - lOff;
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'center', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (axis.name === 'left-axis') {
      labelPositionFunc = function(t, label) { 
        var x, y;
        x = +t.x - lWidth;
        y = +t.y - lHeight - (lHeight/3);
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    else if (axis.name === 'right-axis') {
      labelPositionFunc = function(t, label) { 
        var x, y;
        x = +t.x + lOff;
        y = +t.y - lHeight - (lHeight/3);
        canvas.text(x, y, lWidth, lHeight, label, {fill: col, stroke: col, textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
        // canvas.rectangle(x, y, lWidth, lHeight, 0, {fill: aa.labelColor || aa.color || 'black', textAnchor: 'right', fontSize: lAttrs.fontSize}, 'label-%@'.fmt(label));
      };
    }
    
    if (SC.typeOf(labels) === SC.T_HASH) { 
      this._generateIncrementalLabels(tickPts, labels, labelPositionFunc, YES);
    }
    else if (SC.typeOf(labels) === SC.T_ARRAY) {
      this._generateIncrementalLabels(tickPts, labels, labelPositionFunc, NO);
    }
    else if (SC.typeOf(labels) === SC.T_BOOL) {
      this._generateIncrementalLabels(tickPts, tLabels, labelPositionFunc, NO);
    }
  },
  
  _generateIncrementalLabels: function(pts, labels, func, useIndex) {
    var tick, t, l, idx;
    for (t in pts) {
      tick = pts[t].t;
      idx = pts[t].idx;
      l = useIndex ? labels[idx] : labels[t];
      if (!SC.none(tick) && l) func(tick, l);
    }
  },
  
  rounder: function(coord) {
    if (coord > (~~coord+0.00051)) return coord.toFixed(3);
    return coord.toFixed(0);
  },

  _makeDefaultGrid: function() {
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
  
  _makeDefaultGridCellData: function(grid) {
    // Default grid has 5 columns and 5 rows
    //
    // Nothing is shown, but nodeAnchoredLabels will still work.
    //
    // Grid col and row indices start at 1, not 0.
    //
    var cells = [];
    for (var i=1; i<grid.cols+1; i++) {
      for (var j=1; j<grid.rows+1; j++) {
        cells.push({ color: { fill: 'white',  stroke: 'black'}, value: 0, col: i, row: j });
      }
    }
    return cells;
  },

  _makeMapLayers: function(self, f, canvas, aoiScreenBox, axesScreenBox, axes, mapLayers){
    var x, y, xAxis, yAxis, bottomAxis, topAxis, leftAxis, rightAxis;

    // Set axes by name.
    axes.forEach( function(axis) {
      switch (axis.name) {
      case 'bottom-axis':
        bottomAxis = axis;
        break;
      case 'top-axis':
        topAxis = axis;
        break;
      case 'left-axis':
        leftAxis = axis;
        break;
      case 'right-axis':
        rightAxis = axis;
        break;
      default:
        break;
      }
    });

    // coordScale will be taken from these.
    xAxis = bottomAxis;
    yAxis = leftAxis;
  
    mapLayers.forEach( function(mapLayer) {
      if (mapLayer.isOn === YES){
        mapLayer.elements.forEach( function(element) {
          x = aoiScreenBox.xMin + self.scale(xAxis, element.x);
          // flip the y
          y = aoiScreenBox.yMax - self.scale(yAxis, element.y);
  
          switch (element.type){
          case 'circle':
            canvas.circle(x, y, self.scale(xAxis, element.radius), element.attrs, element.id);
            break;
          case 'rectangle':
            canvas.rectangle(x, y, self.scale(xAxis, element.width), self.scale(yAxis, element.height), element.attrs, element.id);
            break;
          case 'path':
            //canvas.path(self.scalePath(xAxis, yAxis, element.path), element.attrs, element.id);
            break;
          case 'text':
             canvas.text(x, y, self.scale(xAxis, element.width), self.scale(yAxis, element.height), element.label, element.attrs, element.id);
            break;
          // case 'north-arrow':
          // case 'scale-bar':
          // case 'legend':
          // etc.
          default:
            break;
          }
        });
      }
    });
  },

  scale: function(axis, target) {
    return axis.coordScale * target;
  }

    //
    // Some metric scales for future ref:
    //
    // 1 cm on a map is equivalent to:
    // 
    // 1,000 m on the ground at a 1:100,000-scale;
    //   500 m on the ground at a 1:50,000-scale;
    //   200 m on the ground at a 1:20,000-scale;
    //   100 m on the ground at a 1:10,000-scale;
    //    50 m on the ground at a 1:5,000-scale
    //    10 m on the ground at a 1:1,000-scale
    //     1 m on the ground at a 1:100-scale
    //


  
});




// ..........................................................
// A foundation map that has axes
// 
/*globals Sai */

Sai.BaseMapView = Sai.CanvasView.extend({

  makeAxis: function(canvas, sx, sy, ex, ey, axisAttrs, ticks){
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
    if (!SC.none(axisAttrs.labels)) this.makeAxisLabels(canvas, tickPts, axisAttrs, ticks, tickLabels);
    
    canvas.path(path, {stroke: axisAttrs.color || 'black', strokeWidth: axisAttrs.weight || 1}, '%@-axis'.fmt(position));
  },
  
  makeAxisLabels: function(canvas, tickPts, axisAttrs, ticks, tLabels) {
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
  
  makeGrid: function(){
    // TODO: [EG] make the grid
  },
  
  rounder: function(coord){
    if (coord > (~~coord+0.00051)) return coord.toFixed(3);
    return coord.toFixed(0);
  }
  
});


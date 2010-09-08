// ..........................................................
// A basic map of cells
// 
/*globals Sai */
sc_require('views/basemap');

Sai.CellMapView = Sai.BaseMapView.extend({
  
  // ..........................................................
  // Properties
  
  // @param data: This is an array of arrays of pairs for the cells
  // @example: [[1,2], [5,6], [8,3]]
  // Cell #1: "1, 2"
  // Cell #2: "5, 6"
  // Cell #3: "8, 3"
  //
  // where each coordinate represents a number/letter_string pair. Numbers
  // are integer numbers for the x-axis. Letter strings on such maps are usually
  // placed on the y-axix. Letter strings are represented by
  // an integer index into the 26-letter alphabet, or multiples thereof.
  // So, we have: 
  //
  //   A  ...   Z    AA  ...  ZA   AB ...  ZB
  //   1  ...  26    27  ...  52   53 ...  78 etc.
  //
  // If my memory serves, a map cell is referred to by a letter_string/number
  // pair (y/x), which is switched from normal x/y order. For example,
  // cells would be referred to as A13, J24, CB42, where A, J, and CB are y
  // coordinates..
  //
  data: null,
  
  // @param: dataAttrs - Hash of styling parameters
  // @example: {fill: "#000", stroke: "#00", opacity: 0.4}
  dataAttrs: null,
  
  // @param grid: show a grid for all the points
  grid: null,
  
  leftAxis: null,
  rightAxis: null,
  bottomAxis: null,
  topAxis: null,
  
  displayProperties: 'data dataAttrs grid leftAxis rightAxis bottomAxis topAxis'.w(),
  
  renderCanvas: function(canvas, firstTime) {
    var grid = this.get('grid'),
        d = this.get('data') || [],
        dAttrs = this.get('dataAttrs') || {colors: 'black'},
        f = this.get('frame'), axes;

    if (d.length === 0) return;

    if (!firstTime) canvas.clear();  

    axes = this._makeAxes(f, canvas, d, dAttrs) || [];

    this._plotCells(f, canvas, d, dAttrs, axes[0], axes[1], axes[2], axes[3]);
  },
  
  _makeAxes: function(f, canvas, d, dAttrs){
    var axis, path, tCount, space, offset, tmp, aa, width, height,
        yaLeft = this.get('leftAxis') || {}, yScale,
        yaRight = this.get('rightAxis') || {}, 
        xaBottom = this.get('bottomAxis') || {},
        xaTop = this.get('topAxis') || {},
        xMargin = xaBottom.margin || 0.1,
        yMargin = yaLeft.margin || 0.1,
        startX = f.width*yMargin,
        endX = f.width*0.95,
        // Y coordinate stuff
        startY = f.height*(1.0 - xMargin),
        endY = f.height*0.05, dLen = d.length || 0;

    // X axes
    if (xaBottom){
      // Calculate the coordinate system
      xaBottom.coordMin = startX;
      xaBottom.coordMax = endX;
      width = (endX - startX);
      aa = this._calculateForAxis(xaBottom, startX, endX, width);
      xaBottom = aa[0]; tCount = aa[1];
      if (SC.none(xaBottom.hidden) || !xaBottom.hidden) this.makeAxis(canvas, startX, startY, endX, startY, xaBottom, {direction: 'x-bottom', len: 5, count: tCount, space: xaBottom.space, offset: xaBottom.offset});
    }
    if (xaTop){
      // Calculate the coordinate system
      xaTop.coordMin = startX;
      xaTop.coordMax = endX;
      width = (endX - startX);
      aa = this._calculateForAxis(xaTop, startX, endX, width);
      xaTop = aa[0]; tCount = aa[1];
      if (SC.none(xaTop.hidden) || !xaTop.hidden) this.makeAxis(canvas, startX, endY, endX, endY, xaTop, {direction: 'x-top', len: 5, count: tCount, space: xaTop.space, offset: xaTop.offset});
    }

    // Y axes
    if (yaLeft){
      yaLeft.coordMin = endY;
      yaLeft.coordMax = startY;
      height = (endY - startY);
      aa = this._calculateForAxis(yaLeft, endY, startY, height);
      yaLeft = aa[0]; tCount = aa[1];
      if (SC.none(yaLeft.hidden) || !yaLeft.hidden) this.makeAxis(canvas, startX, startY, startX, endY, yaLeft, {direction: 'y-left', len: 5, count: tCount, space: yaLeft.space, offset: yaLeft.offset});
    }
    if (yaRight){
      yaRight.coordMin = endY;
      yaRight.coordMax = startY;
      height = (endY - startY);
      aa = this._calculateForAxis(yaRight, endY, startY, height);
      yaRight = aa[0]; tCount = aa[1];
      if (SC.none(yaRight.hidden) || !yaRight.hidden) this.makeAxis(canvas, endX, startY, endX, endY, yaRight, {direction: 'y-right', len: 5, count: tCount, space: yaRight.space, offset: yaRight.offset});
    }
    
    return [xaBottom, xaTop, yaLeft, yaRight];
  }, 

  _plotCells: function(f, canvas, d, dAttrs, bottomAxis, topAxis, leftAxis, rightAxis){
    var x, xSpace = bottomAxis.space,
        xOffset = (xSpace*bottomAxis.offset), 
        y, ySpace = leftAxis.space,
        yOffset = (ySpace*leftAxis.offset), 
        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        twoLetterLimit = 26*26,
        letterString = 'ZZZ',
        cellWidth = (bottomAxis.coordMax - bottomAxis.coordMin) / bottomAxis.cellCount;
        cellHeight = (leftAxis.coordMax - leftAxis.coordMin) / leftAxis.cellCount;
        colors = dAttrs.color || dAttrs.colors || 'blue';
    d.forEach( function(point, i) {
      x = bottomAxis.coordMin + (point[0] * cellWidth) - (0.5 * cellWidth);
      y = leftAxis.coordMin + (point[1] * cellHeight) - (0.5 * cellHeight);

      // construct the letter string
      if (y < 26) {
        letterString = alphabet.charAt(y);
      }
      else if (y < twoLetterLimit) {
        var multiple = y / 26;
        var secondLetterIndex = alphabet.indexOf(multiple);
        var secondLetter = alphabet.charAt(secondLetterIndex);
        letterString = alphabet.charAt(y % 26) + secondLetter;
      }

      // draw the rectangle for the cell
      console.log(x, y, cellWidth, cellHeight);
      canvas.rectangle(x, y, cellWidth, cellHeight, 0, {stroke: colors[i], fill: colors[i]}, 'cell-%@-%@'.fmt(letterString, y));
    });
  },

  _getLetterString: function(index) {
    // We only handle one- or two-letter letter_strings.
    //
    if (index < 26) {
      return this.alphabet.charAt(index);
    }
    else if (index < this.twoLetterLimit) {
      var multiple = index / 26;
      var secondLetterIndex = alphabet.indexOf(multiple);
      var secondLetter = this._getLetterString(secondLetterIndex);
      return this.alphabet.charAt(index % 26) + secondLetter;
    }
    else {
      return 'ZZZ';
    }
  },

  _calculateForAxis: function(axis, start, end, maxWorldCoordinates){
    var tCount, hasStepIncrement, hasStepCount;
    axis = axis || {};
    hasStepIncrement = !SC.none(axis.step);
    hasStepCount = !SC.none(axis.steps);
     
    axis.coordScale = (end - start) / maxWorldCoordinates;
         
    if(!hasStepIncrement && !hasStepCount){ // make and educated guess with 25 tick marks
      tCount = 25;
      axis.step = ~~(maxWorldCoordinates/tCount);
    } else if(hasStepCount){ // use a total count of X
      tCount = axis.steps;
      axis.step = ~~(maxWorldCoordinates/tCount);
    } else { // Use step increments of X
      tCount = ~~(maxWorldCoordinates / axis.step);
    }
    
    axis.space = (end - start)/tCount;
    axis.cellCount = tCount;
    tCount += 1; // add the last tick to the line
    axis.offset = 0;
    
    // Return modified Axis and tick count
    return [axis, tCount];
    }
});


// ..........................................................
// A basic Line chart
// 
/*globals Sai */
sc_require('views/basemap');

Sai.AlphabetNumberMapView = Sai.BaseMapView.extend({
  
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
  // If my memory serves, a map cell is referred to as a letter_string/number
  // pair (y/x), which is switched from normal x/y order. For example,
  // cells would be referred to as A13, J24, CB42.
  //
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',

  // We only handle one- or two-letter letter_strings. (26 combinations of 26)
  twoLetterLimit: 26 * 26,

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
        f = this.get('frame'), axis;

    if(d.length === 0) return;

    if (!firstTime) canvas.clear();  

    axes = this._makeAxes(f, canvas, d) || [];

    this._plotCells(f, canvas, d, dAttrs, axes[0], axes[1], axes[2], axes[3]);
  },
  
  _makeAxes: function(f, canvas, d){
    var axis, path, tCount, space, offset, tmp, aa,
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
      if (SC.none(xaBottom.hidden) || !xaBottom.hidden) this.makeAxis(canvas, startX, startY, endX, startY, xaBottom, {direction: 'x-bottom', len: 5, count: tCount, space: xaBottom.space, offset: xaBottom.offset});
    }
    if (xaTop){
      // Calculate the coordinate system
      xaTop.coordMin = startX;
      xaTop.coordMax = endX;
      if (SC.none(xaTop.hidden) || !xaTop.hidden) this.makeAxis(canvas, startX, startY, endX, startY, xaTop, {direction: 'x-top', len: 5, count: tCount, space: xaTop.space, offset: xaTop.offset});
    }

    // Y axes
    if (yaLeft){
      yaLeft.coordMin = startY;
      yaLeft.coordMax = endY;
      if (SC.none(yaLeft.hidden) || !yaLeft.hidden) this.makeAxis(canvas, startX, startY, startX, endY, yaLeft, {direction: 'y-left', len: 5, count: tCount, space: yaLeft.space, offset: yaLeft.offset});
    }
    if (yaRight){
      yaRight.coordMin = startY;
      yaRight.coordMax = endY;
      if (SC.none(yaRight.hidden) || !yaRight.hidden) this.makeAxis(canvas, startX, startY, startX, endY, yaRight, {direction: 'y-right', len: 5, count: tCount, space: yaRight.space, offset: yaRight.offset});
    }
    
    return [xaBottom, xaTop, yaLeft, yaRight];
  }, 

  _plotCells: function(f, canvas, d, dAttrs, leftAxis, rightAxis, bottomAxis, topAxis){
    var x, xSpace = bottomAxis.space,
        xOffset = (xSpace*bottomAxis.offset), 
        y, ySpace = leftAxis.space,
        yOffset = (ySpace*leftAxis.offset), 
        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        twoLetterLimit = 26*26,
        letterString = 'ZZZ',
        colors = dAttrs.color || dAttrs.colors || 'blue';
    d.forEach( function(point, i) {
      x = bottomAxis.coordMin + (point[1] * xSpace) - (0.5 * xSpace);
      y = leftAxis.coordMin + (point[0] * ySpace) - (0.5 * ySpace);
      if (x < 26) {
        letterString = alphabet.charAt(x);
      }
      else if (x < twoLetterLimit) {
        var multiple = x / 26;
        var secondLetterIndex = alphabet.indexOf(multiple);
        var secondLetter = alphabet.charAt(secondLetterIndex);
        letterString = alphabet.charAt(index % 26) + secondLetter;
      }
      canvas.rectangle(x, y, xSpace, ySpace, 0, {stroke: colors[i], fill: colors[i]}, 'cell-%@-%@'.fmt(letterString, y));
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
  }
});


// ..........................................................
// Sai - Helper Functions creating the vector library
// 
/*globals Sai */
Sai.mixin({
  toHex: function (color) {
    var range, val, body, trim, colpic, colorVal; 
    if (Sai._vml) {
        // http://dean.edwards.name/weblog/2009/10/convert-any-colour-value-to-hex-in-msie/
        body = this._getBody();
        trim = /^\s+|\s+$/g;
        
        color = (color + '').replace(trim, '');
        range = body.createTextRange();
        try {
          body.style.color = color;
          val = range.queryCommandValue("ForeColor");
          val = ((val & 255) << 16) | (val & 65280) | ((val & 16711680) >>> 16);
          colorVal = "#" + ("000000" + val.toString(16)).slice(-6);
        } catch(e) {
          colorVal = "none";
        }
    } else {
      colpic = this._hiddenColorPicker || document.createElement("i");
      if (SC.none(this._hiddenColorPicker)){
        colpic.title = "Sai Color Picker";
        colpic.style.display = "none";
        document.body.appendChild(colpic);
        this._hiddenColorPicker = colpic;
      }
      colpic.style.color = color;
      colorVal = document.defaultView.getComputedStyle(colpic, '').getPropertyValue("color");
    }
    return colorVal;
  },
  
  // ..........................................................
  // Simple function for finding the correct popup color picture
  // by browser type...
  // 
  _getBody: function(){
    var docum, body = this._body; 
    if (body) return this._body;
    
    try {
      docum = new window.ActiveXObject("htmlfile");
      docum.write("<body>");
      docum.close();
      body = docum.body;
    } catch(e) {
      body = window.createPopup().document.body;
    }
    this._body = body;
    return body;
  },
  
  // ..........................................................
  // Color Convertors
  // 
  // The conversion algorithms for these color spaces are 
  // originally from the book Fundamentals of Interactive 
  // Computer Graphics by Foley and van Dam (c 1982, Addison-Wesley). 
  // Chapter 17 describes color spaces and shows their relationships 
  // via easy-to-follow diagrams.
  hsb2rgb: function(hue, saturation, brightness){
    hue = hue || {};
    var propHue = !SC.none(hue.h) && !SC.none(hue.s) && !SC.none(hue.b),
        red, blue, green,
        temp1, temp2, temp3,
        r, g, b,
        colorConvFunc, toHexConv,
        //i, f, p, q, t, 
        rgb, rg = /^(?=[\da-f]$)/;
    if (SC.kindOf(hue) === SC.T_OBJECT && propHue) {
        brightness = hue.b*1;
        saturation = hue.s*1;
        hue = hue.h*1;
    }
    // convert to 0-1 range if hue/satuaration/brightness in 0-255 range
    if (hue > 1)  hue /= 359;
    if (saturation > 1) saturation /= 100;
    if (brightness > 1) brightness /= 100;
    
    // Start the convertion process
    colorConvFunc = function(bs, colorHue){ 
      var color, temp = 2.0*brightness - bs;
      
      if ((6.0*colorHue) < 1) { color = temp+(bs-temp)*6.0*colorHue; }
      else if ((2.0*colorHue) < 1) { color = bs; }
      else if ((3.0*colorHue) < 2) { color = temp+(bs-temp)*((2.0/3.0)-colorHue)*6.0; }
      else { color = temp; }
       
      return ~~(255*color);
    };
    if (saturation === 0) { 
      red = green = blue = brightness*255;
    } 
    else if (brightness < 0.5){
      temp2 = brightness*(1.0+saturation);
      red = colorConvFunc(temp2, (hue+1.0/3.0));
      green = colorConvFunc(temp2, hue);
      blue = colorConvFunc(temp2, (hue-1.0/3.0));
    }
    else if (brightness > 0.5){
      temp2 = brightness+saturation - brightness*saturation;
      red = colorConvFunc(temp2, (hue+1.0/3.0));
      green = colorConvFunc(temp2, hue);
      blue = colorConvFunc(temp2, (hue-1.0/3.0));
    }
    else {
      red = green = blue = 0;
    }
    
    // Convert to hex
    rgb = {r: red, g: green, b: blue, toString: function(){ return this.hex;} };
    
    toHexConv = function(color){
      var colSt = (~~color).toString(16);
      colSt = colSt.replace(rg, "0");
      return colSt;
    };
    
    // cute floor for pos nums
    r = toHexConv(red);
    g = toHexConv(green);
    b = toHexConv(blue);
    rgb.hex = "#" + r + g + b;
    
    return rgb;
    
    // OLD CODE
    // // shortout if zero brightness
    // if (brightness === 0) { return {r: 0, g: 0, b: 0, hex: "#000"}; }
    // 
    // // convert to 0-1 range if hue/satuaration/brightness in 0-255 range
    // if (hue > 1 || saturation > 1 || brightness > 1) {
    //     hue /= 255;
    //     saturation /= 255;
    //     brightness /= 255;
    // }
    // 
    // // TODO: [EG] need comments
    // i = ~~(hue * 6);
    // f = (hue * 6) - i;
    // p = brightness * (1 - saturation);
    // q = brightness * (1 - (saturation * f));
    // t = brightness * (1 - (saturation * (1 - f)));
    // 
    // red = [brightness, q, p, p, t, brightness, brightness][i];
    // green = [t, brightness, brightness, q, p, p, t][i];
    // blue = [p, p, t, brightness, brightness, q, p][i];
    // red *= 255;
    // green *= 255;
    // blue *= 255;
    // rgb = {r: red, g: green, b: blue, toString: function(){ return this.hex;} };
    // 
    // // cute floor for pos nums
    // r = (~~red).toString(16);
    // g = (~~green).toString(16);
    // b = (~~blue).toString(16);
    // 
    // r = r.replace(rg, "0");
    // g = g.replace(rg, "0");
    // b = b.replace(rg, "0");
    // rgb.hex = "#" + r + g + b;
    // return rgb;
  }
});
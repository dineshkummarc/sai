import java.awt.Color;
import java.util.Formatter;
import java.util.Locale;

class HSB {

   // http://www.oooforum.org/forum/viewtopic.phtml?t=29456
   public static String ToHexColor(String rgbColor) {    
      int length = rgbColor.length(); 
      if(length < 9) { 
         int fillCnt = 9-length; 
         StringBuilder fillStr = new StringBuilder(rgbColor); 
         for(int i=0; i<fillCnt; i++) 
            fillStr = fillStr.insert(0, "0"); 
         rgbColor = fillStr.toString(); 
      } 
      String rColor   = rgbColor.substring(0, 3); 
      String gColor   = rgbColor.substring(3, 6); 
      String bColor   = rgbColor.substring(6); 
      Integer irColor = new Integer(rColor); 
      Integer igColor = new Integer(gColor); 
      Integer ibColor = new Integer(bColor); 
      rColor          = Integer.toHexString(irColor.intValue()); 
      gColor          = Integer.toHexString(igColor.intValue()); 
      bColor          = Integer.toHexString(ibColor.intValue()); 
      rgbColor        = "#" 
         +((rColor.equals("0"))?"00":rColor) 
         +((gColor.equals("0"))?"00":gColor) 
         +((bColor.equals("0"))?"00":bColor); 
    
      return rgbColor; 
  } 

  public static void printHSB(float hue, float saturation, float brightness) {    
    int rgb = Color.HSBtoRGB(hue, saturation, brightness);
    int red = (rgb >> 16) & 0xFF;
    int green = (rgb >> 8) & 0xFF;
    int blue = rgb & 0xFF;

    System.out.println("HSB: " +  hue + ", " +  saturation + ", " + brightness);

    System.out.println("RGB: " +  red + ", " +  green + ", " + blue);

    StringBuilder sb = new StringBuilder();
    Formatter formatter = new Formatter(sb, Locale.US);
    formatter.format("%1$03d%2$03d%3$03d", red, green, blue);
    System.out.println(ToHexColor(sb.toString()));
    System.out.println(" ");
  }

  public static void main(String[] args) {

    // modified from:
    //
    // http://www.java2s.com/Tutorial/Java/0261__2D-Graphics/ConvertHSBtoRGBvalue.htm
    //

    //String hexStr = Integer.toHexString( rgb );
    //System.out.println("Hexstring: " + hexStr);

    //int intValue = Integer.parseInt( "ff0000",16);
    //Color aColor = new Color( intValue );
    //System.out.println(Integer.toHexString(aColor.getRGB()));
    //System.out.println(aColor.toString());
    //System.out.println(aColor);
    //Color hsbColor = Color.getHSBColor(360, 100, 100);
    //System.out.println(hsbColor);
    //String white = "255255255";
    //System.out.println(ToHexColor(white));

    //StringBuilder sb = new StringBuilder();
    //Formatter formatter = new Formatter(sb, Locale.US);
    //formatter.format("%1$3d%2$3d%3$3d", hsbColor.getRed(), hsbColor.getGreen(), hsbColor.getBlue());
    //formatter.format("%1$03d%2$03d%3$03d", red, green, blue);
    //System.out.println(sb);
    //System.out.println(ToHexColor(sb.toString()));

    System.out.println("  0.0f, 0.0f,  0.333f");
    printHSB(  0.0f, 0.0f,  0.333f);
    System.out.println("360.0f, 1.0f,  1.0f");
    printHSB(1.0f, 1.0f,  1.0f);
    System.out.println("120.0f, 0.79f, 0.52f");
    printHSB(0.333f, 0.79f, 0.52f);
    System.out.println(" 60.0f, 0.50f, 0.50f");
    printHSB(0.167f, 0.50f, 0.50f);
    System.out.println("180.0f, 0.65f, 0.25f");
    printHSB(0.500f, 0.65f, 0.25f);
    System.out.println("240.0f, 0.75f, 0.75f");
    printHSB(0.667f, 0.75f, 0.75f);
    System.out.println("180.0f, 1.0f,  1.0f");
    printHSB(0.500f, 1.0f,  1.0f);
    System.out.println("0.0f, 1.0f,  0.75f");
    printHSB(0.0f, 1.0f,  0.75f);
  }
}

// results:
//   0.0f, 0.0f,  0.333f
// HSB: 0.0, 0.0, 0.333
// RGB: 85, 85, 85
// #555555
//  
// 360.0f, 1.0f,  1.0f
// HSB: 1.0, 1.0, 1.0
// RGB: 255, 0, 0
// #ff0000
//  
// 120.0f, 0.79f, 0.52f
// HSB: 0.333, 0.79, 0.52
// RGB: 28, 133, 28
// #1c851c
//  
//  60.0f, 0.50f, 0.50f
// HSB: 0.167, 0.5, 0.5
// RGB: 127, 128, 64
// #7f8040
//  
// 180.0f, 0.65f, 0.25f
// HSB: 0.5, 0.65, 0.25
// RGB: 22, 64, 64
// #164040
//  
// 240.0f, 0.75f, 0.75f
// HSB: 0.667, 0.75, 0.75
// RGB: 48, 48, 191
// #3030bf
//  
// 180.0f, 1.0f,  1.0f
// HSB: 0.5, 1.0, 1.0
// RGB: 0, 255, 255
// #00ffff
// 

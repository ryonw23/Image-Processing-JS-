var capturing = false; // Keep track of photo or live view
var capturedFrame; // Stores the captured photo

var video; // Store live video feed
var vidWidth = 160, vidHeight = 120, buffer = 50; // Initialise bounds for each window

var redSlider, greenSlider, blueSlider, cmykSlider, hsvSlider, blurSlider, pixelateSlider; // Initialise sliders

// Initialise face detection
var detector, face, faceImg;
var classifier = objectdetect.frontalface;

// Initialise filters to apply
var grayscaleFace = false, blurFace = false, invertFace = false, pixelateFace = false;


var matrix, greyPixelate = true; // Initialise requirements for pixelate filter

// Initialise requirements for game filter
var gaming = false, bird;
var walls = [];
var gameOver = false;
var score;
var highScore = 0;

// Preload assets (images) for game filter
function preload() 
{
  bird = loadImage('assets/bird.png');
}

function setup() 
{
  // Set canvas to tall narrow strip
  createCanvas(700, 1200);
  pixelDensity(1);

  // Set video capturing
  video = createCapture(VIDEO,{flipped:true});
  video.size(vidWidth,vidHeight);
  video.hide();

  // Create capture button to capture photo
  var captureButton = createButton('Capture Photo');
  captureButton.position(vidWidth * 2 + buffer * 3 + 8, buffer + 8);
  captureButton.size(vidWidth / 2, vidHeight / 2);

  // Function upon pressing capture button
  captureButton.mousePressed(function() {
    capturing = true; // Set to capture mode
    capturedFrame = video.get(); // Retrieve captured photo
  });

  // Create unlock button to resume live video)
  var unlockButton = createButton('Reset to Live View');
  unlockButton.position(vidWidth * 2 + buffer * 5 + 8,buffer + 8);
  unlockButton.size(vidWidth / 2, vidHeight / 2);

  // Function upon pressing unlock button
  unlockButton.mousePressed(function() {
    capturing = false; // Switch to normal video mode
  });
  
  // Create threshold sliders for red channel, green channel, blue channel, cmyk filter, hsv filter
  redSlider = createSlider(0,255,255/2);
  redSlider.position(buffer, vidHeight*3 + buffer*4);
  redSlider.size(vidWidth);

  greenSlider = createSlider(0,255,255/2);
  greenSlider.position(vidWidth + buffer*2, vidHeight*3 + buffer*4);
  greenSlider.size(vidWidth);

  blueSlider = createSlider(0,255,255/2);
  blueSlider.position(vidWidth*2 + buffer*3, vidHeight*3 + buffer*4);
  blueSlider.size(vidWidth);

  cmykSlider = createSlider(0,255,255/2);
  cmykSlider.position(vidWidth + buffer*2, vidHeight*5 + buffer*7);
  cmykSlider.size(vidWidth);

  hsvSlider = createSlider(0,255,255/2);
  hsvSlider.position(vidWidth*2 + buffer*3, vidHeight*5 + buffer*7);
  hsvSlider.size(vidWidth);

  // Create sliders for face detection filters to control degree of blurring/pixelation
  blurSlider = createSlider(3,7,5,2);
  blurSlider.position(1000000, 1000000);
  blurSlider.size(vidWidth);

  pixelateSlider = createSlider(1,10,5);
  pixelateSlider.position(1000000, 1000000);
  pixelateSlider.size(vidWidth);

  // Set face detection objects and assign detected face to variable
  var scaleFactor = 1.2;
  detector = new objectdetect.detector(vidWidth, vidHeight, scaleFactor, classifier);
  faceImg = createImage(vidWidth, vidHeight);

  spawnWalls(); // Create wall objects for game filter
}

function draw() 
{
  // Set background to light purple colour
  background(220, 220, 245);

  // Draw outline of the canvas
  strokeWeight(1);
  push();
  noFill();
  rect(0,0,width,height);
  pop();

  // Instructions for capturing photo/unlocking photo by key pressing
  text("Press '0' to capture photo", vidWidth * 2 + buffer * 3, vidHeight / 2 + buffer * 1.5);
  text("Press '0' to reset to live view", vidWidth * 2 + buffer * 3, vidHeight / 2 + buffer * 2);

  // Labels for all image windows
  push();
  textAlign(CENTER);
  text("Webcam Image", buffer + vidWidth/2, buffer * 0.75);
  text("Greyscale + 20% brightness", buffer * 2 + vidWidth * 1.5, buffer * 0.75);

  text("Red Channel", buffer + vidWidth/2, vidHeight + buffer * 1.75);
  text("Green Channel", buffer * 2 + vidWidth * 1.5, vidHeight + buffer * 1.75);
  text("Blue Channel", buffer * 3 + vidWidth * 2.5, vidHeight + buffer * 1.75);

  text("Red Channel Threshold", buffer + vidWidth/2, vidHeight * 2 + buffer * 2.75);
  text("Green Channel Threshold", buffer * 2 + vidWidth * 1.5, vidHeight * 2 + buffer * 2.75);
  text("Blue Channel Threshold", buffer * 3 + vidWidth * 2.5, vidHeight * 2 + buffer * 2.75);

  text("Red Channel Threshold Slider", buffer + vidWidth/2, vidHeight * 3 + buffer * 3.5);
  text("Green Channel Threshold Slider", buffer * 2 + vidWidth * 1.5, vidHeight * 3 + buffer * 3.5);
  text("Blue Channel Threshold Slider", buffer * 3 + vidWidth * 2.5, vidHeight * 3 + buffer * 3.5);

  text("Webcam Image (repeat)", buffer + vidWidth/2, vidHeight * 3 + buffer * 4.75);
  text("RGB to CMYK", buffer * 2 + vidWidth * 1.5, vidHeight * 3 + buffer * 4.75);
  text("RGB to HSV", buffer * 3 + vidWidth * 2.5, vidHeight * 3 + buffer * 4.75);

  text("Face Detection", buffer + vidWidth/2, vidHeight * 4 + buffer * 5.75);
  text("RGB to CMYK Threshold", buffer * 2 + vidWidth * 1.5, vidHeight * 4 + buffer * 5.75);
  text("RGB to HSV Threshold", buffer * 3 + vidWidth * 2.5, vidHeight * 4 + buffer * 5.75);

  text("RGB to CMYK Threshold Slider", buffer * 2 + vidWidth * 1.5, vidHeight * 7 + buffer * 1.75);
  text("RGB to HSV Threshold Slider", buffer * 3 + vidWidth * 2.5, vidHeight * 7 + buffer * 1.75);
  pop();

  // Overall program instruction/keybinds
  push();
  textSize(30);
  text("FACE IMAGE INSTRUCTIONS", (vidWidth * 1.5 + buffer * 1)/2, vidHeight*6 + buffer*6.3);  
  textSize(20);
  text("Press '1' for greyscale filter", buffer, vidHeight*6 + buffer*7);
  text("Press '2' for blur filter", buffer, vidHeight*6 + buffer*7.5);
  text("Press '3' for invert colour filter", buffer, vidHeight*6 + buffer*8);
  text("Press '4' for pixelate filter", buffer, vidHeight*6 + buffer*8.5);
  text("Press '5' for no filter", buffer, vidHeight*6 + buffer*9);

  // Game instructions
  text("Press 'g' for game filter: Bird Flaps", width/2, vidHeight*6 + buffer*7);
  text("Avoid the green walls to get 1 point", width/2, vidHeight*6 + buffer*7.5);
  text("If you hit a green wall, the game ends", width/2, vidHeight*6 + buffer*8);
  text("Your highest score is tracked", width/2, vidHeight*6 + buffer*8.5);
  text("Good luck!", width/2, vidHeight*6 + buffer*9);
  pop();

  // Initialise variable to store current image state (capturing/video)
  var input;

  // Check if capturing or not
  if (capturing) 
  {
    input = capturedFrame; // Assign captured photo to input for filters
  } 
  else 
  {
    input = video; // Assign live video to input for filters
  }

  // First layer of image windows (webcam image and greyscale filter)
  image(input, buffer, buffer, vidWidth, vidHeight);
  image(greyscaleFilter(input), vidWidth + buffer*2, buffer, vidWidth, vidHeight);

  // Create an array to store the 3 colour channels (avoid repetition)
  var colourArray = [colourChannel(input, "red"), colourChannel(input, "green"), colourChannel(input, "blue")];

  // Second layer of image windows (3 colour channels)
  image(colourArray[0], buffer, vidHeight + buffer*2, vidWidth, vidHeight);
  image(colourArray[1], vidWidth + buffer*2, vidHeight + buffer*2, vidWidth, vidHeight);
  image(colourArray[2], vidWidth*2 + buffer*3, vidHeight + buffer*2, vidWidth, vidHeight);

  // Third layer of image windows (threshold for 3 colour channels)
  image(thresholdFilter(colourArray[0],"red"), buffer, vidHeight*2 + buffer*3, vidWidth, vidHeight);
  image(thresholdFilter(colourArray[1],"green"), vidWidth + buffer*2, vidHeight*2 + buffer*3, vidWidth, vidHeight);
  image(thresholdFilter(colourArray[2],"blue"), vidWidth*2 + buffer*3, vidHeight*2 + buffer*3, vidWidth, vidHeight);

  // Sliders to control 3 colour channel thresholds
  text(redSlider.value(), buffer, vidHeight*3 + buffer*4);
  text(greenSlider.value(), vidWidth + buffer*2, vidHeight*3 + buffer*4);
  text(blueSlider.value(), vidWidth*2 + buffer*3, vidHeight*3 + buffer*4);

  // Fourth layer of image windows (webcam image and 2 colour space conversions)
  image(input, buffer, vidHeight*3 + buffer*5, vidWidth, vidHeight);
  image(RGBtoCMYK(input), vidWidth + buffer*2, vidHeight*3 + buffer*5, vidWidth, vidHeight);
  image(RGBtoHSV(input), vidWidth*2 + buffer*3, vidHeight*3 + buffer*5, vidWidth, vidHeight);

  // Fifth layer of image windows (threshold for 2 colour space conversions)
  image(thresholdFilter(RGBtoCMYK(input),"cmyk"), vidWidth + buffer*2, vidHeight*4 + buffer*6, vidWidth, vidHeight);
  image(thresholdFilter(RGBtoHSV(input),"hsv"), vidWidth*2 + buffer*3, vidHeight*4 + buffer*6, vidWidth, vidHeight);

  // Sliders to control 2 colour space conversions thresholds
  text(cmykSlider.value(), vidWidth + buffer*2, vidHeight*5 + buffer*7);
  text(hsvSlider.value(), vidWidth*2 + buffer*3, vidHeight*5 + buffer*7);

  // Face detection, part of the fifth layer of image windows
  faceDetect();
}

function greyscaleFilter(img) 
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Obtain rgb values from 1D array of pixels
      var r = img.pixels[index + 0];
      var g = img.pixels[index + 1];
      var b = img.pixels[index + 2];

      // Initialise brightness increase by 20%
      var brightMultiplier = 1.2;

      // Luma calculation for greyscale (Rec. 601)
      var gray = (r * 0.299 + g * 0.587 + b * 0.114) * brightMultiplier;

      // Limit gray constant between 0 and 255
      gray = constrain(gray,0,255);

      // Assign pixels in output image to respective grey values
      imgOut.pixels[index + 0] = gray;
      imgOut.pixels[index + 1] = gray;
      imgOut.pixels[index + 2] = gray;
      imgOut.pixels[index + 3] = 255;
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function colourChannel(img,channel) 
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Red colour channel
      if(channel == "red")
      {
        // Obtain only the red value of a pixel
        var r = img.pixels[index + 0];

        // Only output the red value, set green and blue to 0
        imgOut.pixels[index + 0] = r;
        imgOut.pixels[index + 1] = 0;
        imgOut.pixels[index + 2] = 0;
      }
      // Green colour channel
      if(channel == "green")
      {
        // Obtain only the green value of a pixel
        var g = img.pixels[index + 1];

        // Only output the green value, set value of red and blue to 0
        imgOut.pixels[index + 0] = 0;
        imgOut.pixels[index + 1] = g;
        imgOut.pixels[index + 2] = 0;
      }
      // Blue colour channel
      if(channel == "blue")
      {
        // Obtain only the blue value of a pixel
        var b = img.pixels[index + 2];

        // Only output the blue value, set the value of red and green to 0
        imgOut.pixels[index + 0] = 0;
        imgOut.pixels[index + 1] = 0;
        imgOut.pixels[index + 2] = b;
      }
      
      // Set the alpha value to 255 for all channels
      imgOut.pixels[index + 3] = 255;
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function thresholdFilter(img,mode) 
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Initialise variables for output image
  var colour;

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Obtain rgba values from 1D array of pixels
      var r = img.pixels[index + 0];
      var g = img.pixels[index + 1];
      var b = img.pixels[index + 2];
      var a = img.pixels[index + 3];

      // Threshold for red colour channel
      if(mode == "red")
      {
        // Check if the red value is more than the threshold value on slider
        if (r > redSlider.value()) 
        {
          // Pixel output only full red value, green and blue set to 0
          imgOut.pixels[index + 0] = 255;
          imgOut.pixels[index + 1] = 0; 
          imgOut.pixels[index + 2] = 0;   
        }
        // If red value is less than threshold value
        else 
        {
          // Pixel output black colour
          colour = 0;
          imgOut.pixels[index + 0] = colour;
          imgOut.pixels[index + 1] = colour; 
          imgOut.pixels[index + 2] = colour;   
        }
      }

      // Threshold for green colour channel
      if(mode == "green")
      {
        // Check if the green value is more than the threshold value on slider
        if (g > greenSlider.value()) 
        {
          // Pixel output only full green value, red and blue set to 0
          imgOut.pixels[index + 0] = 0;
          imgOut.pixels[index + 1] = 255; 
          imgOut.pixels[index + 2] = 0;   
        } 
        // If green value is less than threshold value
        else 
        {
          // Pixel output black colour
          colour = 0;
          imgOut.pixels[index + 0] = colour;
          imgOut.pixels[index + 1] = colour; 
          imgOut.pixels[index + 2] = colour;   
        }
      }

      // Threshold for blue colour channel
      if(mode == "blue")
      {
        // Check if the blue value is more than the threshold value on slider
        if (b > blueSlider.value()) 
        {
          // Pixel output only full blue value, red and green set to 0
          imgOut.pixels[index + 0] = 0;
          imgOut.pixels[index + 1] = 0; 
          imgOut.pixels[index + 2] = 255;   
        } 
        // If green value is less than threshold value
        else 
        {
          // Pixel output black colour
          colour = 0;
          imgOut.pixels[index + 0] = colour;
          imgOut.pixels[index + 1] = colour; 
          imgOut.pixels[index + 2] = colour;   
        }
      }

      // Threshold for CMYK colour conversion
      if(mode == "cmyk")
      {
        // Calculate average of all colour values
        var avgColour = (r+g+b+a)/4;

        // Check if the average colour value is more than the threshold value on slider
        if (avgColour > cmykSlider.value()) 
        {
          colour = 255 // Output white colour
        }
        // If average colour value is less than threshold value
        else 
        {
          colour = 0 // Output black colour
        }
        
        // Assign black or white to output pixel
        imgOut.pixels[index + 0] = colour;
        imgOut.pixels[index + 1] = colour; 
        imgOut.pixels[index + 2] = colour;   
      }

      // Threshold for HSV colour conversion
      if(mode == "hsv")
      {
        // Calculate average of all colour values
        var avgColour = (r+g+b+a)/4;

        // Check if the average colour value is more than the threshold value on slider
        if (avgColour > hsvSlider.value()) 
        {
          colour = 255 // Output white colour
        }
        else 
        {
          colour = 0 // Output black colour
        }

        // Assign black or white to output pixel
        imgOut.pixels[index + 0] = colour;
        imgOut.pixels[index + 1] = colour; 
        imgOut.pixels[index + 2] = colour;   
      }

      // Assign maximum opacity for output pixel
      imgOut.pixels[index + 3] = 255; 
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function RGBtoCMYK(img)
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Obtain rgb values from 1D array of pixels
      var r = img.pixels[index + 0];
      var g = img.pixels[index + 1];
      var b = img.pixels[index + 2];

      // Convert RGB to CMYK (Calculation based on Colour Space Conversions by Adrian Ford and Alan Roberts )
      var cyan = 1 - (r / 255);
      var magenta = 1 - (g / 255);
      var yellow = 1 - (b / 255);

      var black = min(cyan,magenta,yellow);
      cyan = (cyan-black)/(1-black);
      magenta= (magenta-black)/(1-black);
      yellow = (yellow-black)/(1-black);

      // Assign new CMYK pixel values to rgba
      imgOut.pixels[index + 0] = cyan * 255;   
      imgOut.pixels[index + 1] = magenta * 255;   
      imgOut.pixels[index + 2] = yellow * 255;   
      imgOut.pixels[index + 3] = black * 255;
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function RGBtoHSV(img)
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Obtain rgb values from 1D array of pixels
      // Normalise the values to range from 0 to 1
      var r = img.pixels[index + 0] / 255; 
      var g = img.pixels[index + 1] / 255; 
      var b = img.pixels[index + 2] / 255; 


      var mx = max(r, g, b); // Max value (V of HSV)
      var mn = min(r, g, b); // Min value (To calculate saturation)

      // Convert RGB to HSV (Calculation based on Colour Space Conversions by Adrian Ford and Alan Roberts )
      var hue = 0;
      var saturation = 0;
      var value = mx; // Value is the max RGB value

      // Calculate saturation
      if (mx != 0) 
      {
        saturation = (mx - mn) / mx;
      }

      var rPrime = (mx-r)/(mx-mn);
      var gPrime = (mx-g)/(mx-mn);
      var bPrime = (mx-b)/(mx-mn);

      if (mx == mn) {hue = 0}
      else if (r == mx && g == mn) {hue = 5 + bPrime}
      else if (r == mx && g != mn) {hue = 1 - gPrime}
      else if (g == mx && b == mn) {hue = rPrime + 1}
      else if (g == mx && b != mn) {hue = 3 - bPrime}
      else if (r == mx) {hue = 3 + gPrime}
      else {hue = 5 - rPrime}

      // Adjust hue to be in the range [0, 360]
      hue = hue * 60;
      if (hue < 0) 
      { 
        hue += 360;
      }

      imgOut.pixels[index + 0] = hue * 255/360; // Hue (Mapped from 0 - 360 to 0 - 255)
      imgOut.pixels[index + 1] = saturation * 255; // Saturation
      imgOut.pixels[index + 2] = value * 255; // Value
      imgOut.pixels[index + 3] = 255; // Alpha
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function blurFilter(img)
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Initialise matrix for convolution based on slider value
  if(blurSlider.value() == 3) // 3x3 matrix
  {
    matrix = [
      [(1/16),(2/16),(1/16)],
      [(2/16),(4/16),(2/16)],
      [(1/16),(2/16),(1/16)],
    ];
  }
  else if(blurSlider.value() == 5) // 5x5 matrix
  {
    matrix = [
      [(1/256), (4/256), (6/256), (4/256),(1/256)],
      [(4/256),(16/256),(24/256),(16/256),(4/256)],
      [(6/256),(24/256),(36/256),(24/256),(6/256)],
      [(4/256),(16/256),(24/256),(16/256),(4/256)],
      [(1/256), (4/256), (6/256), (4/256),(1/256)]
    ];
  }
  else if(blurSlider.value() == 7) // 7x7 matrix
  {
    matrix = [
      [ (1/3644),  (6/3644), (15/3644), (20/3644), (15/3644),  (6/3644),(1/3644)],
      [ (6/3644), (36/3644), (84/3644),(106/3644), (84/3644), (36/3644),(6/3644)],
      [(15/3644), (84/3644),(204/3644),(255/3644),(204/3644), (84/3644),(15/3644)],
      [(20/3644),(106/3644),(255/3644),(316/3644),(255/3644),(106/3644),(20/3644)],
      [(15/3644), (84/3644),(204/3644),(255/3644),(204/3644), (84/3644),(15/3644)],
      [ (6/3644), (36/3644), (84/3644),(106/3644), (84/3644), (36/3644),(6/3644)],
      [ (1/3644),  (6/3644), (15/3644), (20/3644), (15/3644),  (6/3644),(1/3644)]
    ];
  }

  // Iterate through all pixels (x by y pixels)
  for (var x = 0; x < img.width; x++) 
  {
    for (var y = 0; y < img.height; y++) 
    {
      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (y * img.width + x) * 4;

      // Apply convolution based on current image
      var conv = convolution(x, y, matrix, matrix.length, img);

      // Assign new pixel values after convolution
      imgOut.pixels[index + 0] = conv[0];
      imgOut.pixels[index + 1] = conv[1];
      imgOut.pixels[index + 2] = conv[2];
      imgOut.pixels[index + 3] = 255;
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function convolution(x, y, matrix, matrixSize, img) 
{
  // Initialise total values of rgb - set to 0 to start
  var totalRed = 0;
  var totalGreen = 0;
  var totalBlue = 0;

  // Calculate offset for positioning
  var offset = Math.floor(matrixSize / 2);

  // Loop through the matrix to apply convolution
  for (var i = 0; i < matrixSize; i++) 
  {
    for (var j = 0; j < matrixSize; j++) 
    {
      // Calculate the current pixel's x and y relative to image
      var xLoc = x + i - offset;
      var yLoc = y + j - offset;

      // Calculate the index (position) of a pixel in a 1D array of pixels
      // Converts 2D coordinates into 1D index
      var index = (yLoc * img.width + xLoc) * 4;

      // Constrain index within bounds of the pixel array
      index = constrain(index, 0, img.pixels.length - 1);

      // Multiply pixel colour values by the corresponding matrix value 
      totalRed += img.pixels[index + 0] * matrix[i][j];
      totalGreen += img.pixels[index + 1] * matrix[i][j];
      totalBlue += img.pixels[index + 2] * matrix[i][j];
    }
  }
  // Return the calculated total rgb values
  return [totalRed, totalGreen, totalBlue];
}

function pixelateFilter(img, blockSize) 
{
  // Initialise image for after filters applied
  var imgOut = createImage(video.width, video.height);
  imgOut.loadPixels();
  img.loadPixels();

  // Check mode of pixelation (colour or grey)
  if(greyPixelate)
  {
    // Assign input image to greyscale image
    var imgIn = greyscaleFilter(img);
  }
  else
  {
    // Assign input image to normal image (colour)
    var imgIn = img;
  }

  // Iterate through the image in blocks based on slider value
  for (var x = 0; x < imgIn.width; x += blockSize) 
  {
    for (var y = 0; y < imgIn.height; y += blockSize) 
    {
      // Initialise total values of rgb and intensity based on blocks
      var totalRed = 0;
      var totalGreen = 0;
      var totalBlue = 0;
      var totalIntensity = 0;

      // Initialise count (how many pixels to calculate average)
      var count = 0;

      // Iterate through each individual block
      for (var i = 0; i < blockSize; i++)
      {
        for (var j = 0; j < blockSize; j++)
        {
          // Obtain x and y coordinates of pixels in the block relative to whole image
          var blockX = x+i;
          var blockY = y+j;

          // Check that the coordinate is within the bounds of the whole image
          if(blockX < imgIn.width && blockY < imgIn.height)
          {
            // Obtain colour at coordinate using p5.js image.get() function
            let c = imgIn.get(blockX,blockY);

            // Check mode of pixelation (colour or grey)
            if(greyPixelate)
            {
              totalIntensity += c[0]; // If mode is grey, colour based on intensity 
            }
            else
            {
              // If mode is colour, colour based on colour of block
              totalRed += c[0];
              totalGreen += c[1];
              totalBlue += c[2];
            }
            
            // Increase count of pixel by 1
            count++;
          }
        }
      }

      // Calculate average based on total values
      var avgIntensity = totalIntensity / count;
      var avgRed = totalRed / count;
      var avgGreen = totalGreen / count;
      var avgBlue = totalBlue / count;

      // Iterate through each individual block
      for (var i = 0; i < blockSize; i++)
      {
        for (var j = 0; j < blockSize; j++)
        {
          // Obtain x and y coordinates of pixels in the block relative to whole image
          var blockX = x+i;
          var blockY = y+j;

          // Check that the coordinate is within the bounds of the whole image
          if(blockX < imgIn.width && blockY < imgIn.height)
          {
            // Check mode of pixelation (colour or grey)
            if(greyPixelate)
            {
              imgOut.set(blockX,blockY,avgIntensity); // If mode is grey, colour based on average intensity of block
            }
            else
            {
              imgOut.set(blockX,blockY,[avgRed,avgGreen,avgBlue,255]); // If mode is colour, colour based on average colour of block
            }
          }
        }
      }
    }
  }

  // Update output image after assigning pixels
  imgOut.updatePixels();

  // Return output image for p5.js image() function
  return imgOut;
}

function faceDetect() 
{
  push();
  // Original webcam image
  image(faceImg, buffer, vidHeight * 4 + buffer * 6, vidWidth, vidHeight);

  // Initialise variable to store current image state (capturing/video)
  var input;

  // Check if capturing or not
  if (capturing) 
  {
    input = capturedFrame; // Assign captured photo to input for filters
  } 
  else 
  {
    input = video; // Assign live video to input for filters
  }
  
  // Copy input to faceImg
  faceImg.copy(input, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

  // Run face detection 
  faces = detector.detect(faceImg.canvas);

  // Initialise face image for after filters applied
  var newFace = createImage(vidWidth, vidHeight);

  // Iterate through all detected faces
  for (var i = 0; i < faces.length; i++) 
  {
    // Assign current face in iteration
    var face = faces[i];

    // Check confidence score of face detection
    if (face[4] > 4) 
    {
      // Initialise blur and pixelate sliders off screen
      blurSlider.position(1000000, 1000000);
      pixelateSlider.position(1000000, 1000000);

      if(grayscaleFace) // Check if greyscale filter is selected
      {
        // Copy a region of the original face image and apply greyscale filter
        newFace.copy(greyscaleFilter(faceImg), face[0],face[1],face[2],face[3],face[0],face[1],face[2],face[3]);

        // Impose the region onto the original face
        image(newFace, buffer, vidHeight * 4 + buffer * 6, vidWidth, vidHeight);

        // Label the image window
        text("Greyscale Filter", buffer*1.75, vidHeight*5 + buffer*6.3);
      }
      else if(blurFace) // Check if blur filter is selected
      {
        // Copy a region of the original face image and apply blur filter
        newFace.copy(blurFilter(faceImg), face[0],face[1],face[2],face[3],face[0],face[1],face[2],face[3]);

        // Impose the region onto the original face
        image(newFace, buffer, vidHeight * 4 + buffer * 6, vidWidth, vidHeight);

        // Label the image window
        text("Blur Filter", buffer*2, vidHeight*5 + buffer*6.3);

        // Bring the blur slider into position with instructions
        blurSlider.position(buffer, vidHeight*5 + buffer*7);
        text(blurSlider.value(), buffer*2.4, vidHeight*5 + buffer*7.6);
        text("Adjust the degree of blur", buffer * 1.25, vidHeight*5 + buffer*6.75);
      }
      else if(invertFace) // Check if invert filter is selected
      {
        // Copy a region of the original face image and apply colour conversion filter
        newFace.copy(RGBtoHSV(faceImg), face[0],face[1],face[2],face[3],face[0],face[1],face[2],face[3]);

        // Impose the region onto the original face
        image(newFace, buffer, vidHeight * 4 + buffer * 6, vidWidth, vidHeight);

        // Label the image window
        text("Invert Filter", buffer*1.9, vidHeight*5 + buffer*6.3);
      }
      else if(pixelateFace) // Check if pixelate filter is selected
      {
        // Copy a region of the original face image and apply pixelate filter
        newFace.copy(pixelateFilter(faceImg,pixelateSlider.value()), face[0],face[1],face[2],face[3],face[0],face[1],face[2],face[3]);

        // Impose the region onto the original face
        image(newFace, buffer, vidHeight * 4 + buffer * 6, vidWidth, vidHeight);

        // Label the image window
        text("Pixelate Filter", buffer*1.8, vidHeight*5 + buffer*6.3);

        // Bring the pixelate slider into position with instructions
        text("Adjust the degree of pixelation", buffer * 1, vidHeight*5 + buffer*6.75);
        pixelateSlider.position(buffer, vidHeight*5 + buffer*7);
        text(pixelateSlider.value(), buffer*2.4, vidHeight*5 + buffer*7.6);
        text("Press 'p' to toggle colour", buffer * 1.2, vidHeight*5 + buffer*7.9);
      }
      else if(gaming) // Check if game filter is selected
      {
        // Initialise middle of face as noseX and noseY
        var noseX = buffer + face[0] + face[2]/2;
        var noseY = vidHeight * 4 + buffer * 6 + face[1] + face[3]/2;

        if (!gameOver) // Check if game is active
        {
          image(bird,noseX - 25,noseY - 25, 50, 50); // Place image of face on initialised noseX and noseY
          updateWalls(); // Make walls move and be deleted if offscreen
          checkCollision(noseX,noseY); // Check if walls collide with nose 
        } 
        else 
        {
          if(score > highScore) // Check if current score is more than the highest score
          {
            // Replace the old high score with new high score
            // Divide score by 5 to normalise score 
            highScore = score;
          }
          
          // Draw text when game ends and instructions to restart
          var scoreText = "Score: " + score;
          var highScoreText = "High Score: " + highScore;
          fill(0);
          textAlign(CENTER, CENTER);
          text("Game Over! Press 'R' to Restart", buffer * 2.5, vidHeight*5 + buffer*6.5);
          text(scoreText, buffer * 2.5, vidHeight*5 + buffer*7);
          text(highScoreText, buffer * 2.5, vidHeight*5 + buffer*7.5);
        }
      }
      else // When no filter is selected
      {
        // Draw a rectangle around the face
        strokeWeight(1);
        stroke(255);
        noFill();
        rect(face[0] + buffer, face[1] + vidHeight * 4 + buffer * 6, face[2], face[3]);
        fill(0);

        // Label the image window
        text("No Filter", buffer*2, vidHeight*5 + buffer*6.3);
      }
    }
  }
  pop();
}

function keyPressed()
{
  // Log key pressed for debugging
  console.log("Key pressed is: " + key);

  if(key == "1") // Check if key pressed is 1
  {
    // Only set greyscale filter to true, the rest false
    grayscaleFace = true;
    blurFace = false;
    invertFace = false;
    pixelateFace = false;
    gaming = false;

    console.log("Current Face Filter: Greyscale Filter"); // Log current filter for debugging
  }
  if(key == "2") // Check if key pressed is 2
  {
    // Only set blur filter to true, the rest false
    grayscaleFace = false;
    blurFace = true;
    invertFace = false;
    pixelateFace = false;
    gaming = false;

    console.log("Current Face Filter: Blur Filter"); // Log current filter for debugging
  }
  if(key == "3") // Check if key pressed is 3
  {
    // Only set invert filter to true, the rest false
    grayscaleFace = false;
    blurFace = false;
    invertFace = true;
    pixelateFace = false;
    gaming = false;

    console.log("Current Face Filter: Invert Filter (HSV)"); // Log current filter for debugging
  }
  if(key == "4") // Check if key pressed is 4
  {
    // Only set pixelate filter to true, the rest false
    grayscaleFace = false;
    blurFace = false;
    invertFace = false;
    pixelateFace = true;
    gaming = false;

    console.log("Current Face Filter: Pixelate Filter"); // Log current filter for debugging
  }
  if(key == "5") // Check if key pressed is 5
  {
    // Set all filters to false
    grayscaleFace = false;
    blurFace = false;
    invertFace = false;
    pixelateFace = false;
    gaming = false;

    console.log("Current Face Filter: No filter selected"); // Log no filter for debugging
  }
  if(key == "p") // Check if key pressed is p
  {
    greyPixelate = !greyPixelate; // Toggle between colour and grey for pixelate
    if(greyPixelate)
    {
      console.log("Current Face Filter: Pixelate filter - Grey"); // Log current pixelate filter mode for debugging
    }
    else if (!greyPixelate)
    {
      console.log("Current Face Filter: Pixelate filter - Colour"); // Log current pixelate filter mode for debugging
    }
  }
  if(key == "0" && !gaming) // Check if key pressed is 0
  {
    capturing = !capturing; // Toggle between capturing and live view
    capturedFrame = video.get(); // Obtain current frame when image captured
    if (capturing)
    {
      console.log("Photo Currently Captured"); // Log current capturing mode for debugging
    }
    else if(!capturing)
    {
      console.log("Currently Displaying Live View"); // Log current capturing mode for debugging
    }
  }
  if(key == "g") // Check if key pressed is g
  {
    // Only set gaming filter to true, the rest false
    grayscaleFace = false;
    blurFace = false;
    invertFace = false;
    pixelateFace = false;
    gaming = true;
    capturing = false;

    console.log("Current Face Filter: Game Mode"); // Log current filter for debugging
    console.log("Currently Displaying Live View"); // Log current capturing mode
  }
  if (key == 'r' && gameOver) // Check if key pressed is r when game is over
  {
    console.log("Current Face Filter: Game Mode - Restarted"); // Log state of game filter for debugging
    gameOver = false; // Reset game state
    spawnWalls(); // Create walls for game 
  }
}

function mousePressed()
{
  if (capturing)
  {
    console.log("Photo Currently Captured"); // Log current capturing mode for debugging
  }
  else if (!capturing)
  {
    console.log("Currently Displaying Live View"); // Log current capturing mode for debugging 
  }
}

// Class for game filter
class Wall 
{
  constructor() // Initialise bounds, gap and logic for game filter
  {
    this.x = buffer + vidWidth;
    this.y = vidHeight * 4 + buffer * 6 + 1;
    this.topY = random(vidHeight * 0.5);
    this.gapHeight = random(vidHeight * 0.4, vidHeight * 0.5); // Gap size
    this.width = 20;
    this.speed = random(4,5);
  }

  move() // Move walls to the left
  {
    this.x -= this.speed;
  }

  show() // Draw walls
  {
    push();
    fill(80,80,200);
    // Top wall
    rect(this.x, this.y, this.width, this.topY);
    // Bottom wall
    rect(this.x, this.y + this.topY + this.gapHeight, this.width, vidHeight - (this.topY + this.gapHeight) - 1);
    pop();
  }

  offScreen() // Check if wall is beyond the image bounds
  {
    return this.x < buffer;
  }

  hits(px, py) // Check if player collide with wall
  {
    return (px > this.x && px < this.x + this.width && 
            (py - 10 < this.y + this.topY|| py + 10 > this.y + this.topY + this.gapHeight));
  }
}

function spawnWalls() 
{
  // Initialise original game state, reset score and walls array
  score = 0;
  walls = [];
  for (let i = 0; i < 1; i++) 
  {
    walls.push(new Wall());
  }
}

function updateWalls() 
{
  // Iterate through all walls to move and draw
  for (let i = walls.length - 1; i >= 0; i--) 
  {
    walls[i].move();
    walls[i].show();

    if (walls[i].offScreen()) 
    {
      walls.splice(i, 1); // Remove wall when it goes off screen
      walls.push(new Wall()); // Add new wall when one goes off screen
      score++; // Increment score
    }
  }
}

function checkCollision(noseX,noseY) 
{
  // Iterate through all walls to check collision
  for (var i = 0; i < walls.length; i++) 
  {
    if (walls[i].hits(noseX, noseY)) 
    {
      gameOver = true;
    }
  }
}
// noprotect
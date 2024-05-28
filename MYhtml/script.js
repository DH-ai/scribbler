function preprocessImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Resize the image to match the model's expected input shape
    const resizedImage = tf.image.resizeBilinear(
      tf.browser.fromPixels(imageData, 1).expandDims(0),
      [28, 28]
    );
    
    // Normalize the pixel values to be in the range [0, 1]
    const normalizedImage = resizedImage.toFloat().div(255.0);
  
    return normalizedImage;
  }
  
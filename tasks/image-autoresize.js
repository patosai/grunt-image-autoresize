// uses gm, promise

var gm = require('gm').subClass({imageMagick: true});
var path = require('path');

var Promise = require('promise');

function parseImage(imagePath, maxdimension, outputPath) {
  return new Promise(function(resolve, reject) {
    var image = gm(imagePath);
    image.size(function(err, size) {
      if (err) {
        reject(err);
        return;
      }

      if (size.width > size.height) {
        image.resize(maxdimension)
      } else {
        image.resize(null, maxdimension)
      }
      image.write(outputPath, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    })
  })
}

module.exports = function(grunt) {
  grunt.registerMultiTask('image_autoresize', 'Auto-resize images larger than a certain size', function() {
    var done = this.async();

    var maxdimension = this.data.maxdimension || 800;
    var fileObjectArray = this.data.files;

    var fileObjectPromises = fileObjectArray.map(function(fileObject) {
      var fileList = grunt.file.expand(fileObject, fileObject.src);
      var filePromises = fileList.map(function(file) {
        var filePath = path.join(fileObject.cwd, file);
        var outputPath = path.join(fileObject.dest || fileObject.cwd, file);
        return parseImage(filePath, maxdimension, outputPath);
      });
      return Promise.all(filePromises)
    })

    Promise.all(fileObjectPromises)
      .then(function() {
        done()
      })
      .catch(function(err) {
        done(err)
      })
  });
}

// uses gm, promise

var gm = require('gm').subClass({imageMagick: true});
var path = require('path');

var Promise = require('promise');

var BATCH_SIZE = 4;
var DEFAULT_MAX_DIMENSION_PX = 800;

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

    var maxdimension = this.data.maxdimension || DEFAULT_MAX_DIMENSION_PX;
    var fileObjectArray = this.data.files;

    var completePromise = Promise.resolve();

    fileObjectArray.forEach(function(fileObject) {
      grunt.log.debug('Starting new files target')

      var fileList = grunt.file.expand(fileObject, fileObject.src);

      for (var ii = 0; ii < fileList.length; ii += BATCH_SIZE) {
        completePromise = (function(batch) {
          return completePromise.then(function() {
            grunt.log.debug('Parsing files: ' + batch.join(', '))
            var filePromises = batch.map(function(filename) {
              var filePath = path.join(fileObject.cwd, filename);
              var outputPath = path.join(fileObject.dest || fileObject.cwd, filename);
              return parseImage(filePath, maxdimension, outputPath);
            });

            return Promise.all(filePromises);
          });
        })(fileList.slice(ii, ii + BATCH_SIZE));
      }
    });

    completePromise.then(function() {
      done();
    }).catch(function(err) {
      done(err);
    });
  });
}

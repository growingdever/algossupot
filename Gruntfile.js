"use strict";

module.exports = function (grunt) {

  var config = {};

  // Judge Task
  config.compilation = {
    options: {
      cpp: { src: 'judge/fixtures/fibo.cpp', dst: 'tmp.out' },
      python: { src: 'judge/fixtures/fibo.py', dst: 'tmp.out' },
      ruby: { src: 'judge/fixtures/fibo.rb', dst: 'tmp.out' }
    }
  };

  config.capturingProcess = {};
  Object.keys(config.compilation.options).forEach(function (key) {
    config.capturingProcess[key] = {};
  });
  config.saveCapturingResult = {
    options: { path: 'judge/pyjudge/sandboxing/config.py' }
  };

  config.capture = {};
  config.capture.options = config.compilation.options;
  config.capture.options.input = 'judge/fixtures/in.txt';
  config.capture.options.script = 'judge/pyjudge/capture.py';

  grunt.loadTasks('tasks');
  grunt.initConfig(config);

  grunt.registerMultiTask('capturingProcess', function () {
    var lang = this.target;
    grunt.task.run(['compilation:' + lang, 'capture:' + lang]);
  });
  grunt.registerTask('saveCapturingResult', function () {
    var options = this.options(),
      result = JSON.stringify(grunt.config.get('capture.result'));
    if (result) {
      result = 'SC_CONFIG = ' + result + '\n';
      grunt.file.write(options.path, result);
    } else {
      grunt.log.ok('Skipped write capturing result.');
    }
  });

  grunt.registerTask('init', ['capturingProcess']);
  grunt.registerTask('default', ['capturingProcess', 'saveCapturingResult']);
};

/*jslint node: true, eqeq: true, vars: true */
/*global winston, async, config, models*/
'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var PyProc = require('../../judge').PyProc;

var _Submission, ClassMethods = {}, InstanceMethods = {};

ClassMethods.push = function (submissionMember, userId, problemId, callback) {
  var User = models.User;
  var Problem = models.Problem;
  var sequelize = models.sequelize;
  var findUserById = function (cb) {
    User.find(userId).
      success(function (user) {
        if (user) {
          return cb(null, user);
        }
        cb(new Error('Not found User'));
      }).
      error(function (err) {
        cb(err);
      });
  };
  var findProblemById = function (cb) {
    Problem.find(problemId).
      success(function (problem) {
        if (problem) {
          return cb(null, problem);
        }
        cb(new Error('Not found problem'));
      }).
      error(function (err) {
        cb(err);
      });
  };
  var createSubmission = function (err, results) {
    sequelize.transaction(function (t) {
      var submission = _Submission.build({
        language: submissionMember.language,
        codeLength: String(submissionMember.sourceCode).length
      });

      var saveSubmission = function (cb) {
        submission.save({ transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var userAddSubmission = function (cb) {
        results.user.addSubmission(submission, { transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var problemAddSubmission = function (cb) {
        results.problem.addSubmission(submission, { transaction: t }).
          success(function () {
            cb(null);
          }).
          error(function (err) {
            cb(err);
          });
      };
      var saveSourceCode = function (cb) {
        var dos2unix = function (cb) {
          cb(null, submissionMember.sourceCode.replace(/(\0xd)/g, ''));
        };
        var makeDirectory = function (cb) {
          var dirname = path.dirname(submission.getSourceCodePath());
          fs.stat(dirname, function (err, stats) {
            if (err) {
              return mkdirp(dirname, function (err) {
                if (err) {
                  return cb(err);
                }
                cb(null);
              });
            }
            if (!stats.isDirectory()) {
              return cb(new Error('makeDirectory failed'));
            }

            cb(null);
          });
        };
        async.waterfall([
          makeDirectory,
          dos2unix,
          async.apply(fs.writeFile, submission.getSourceCodePath())
        ], function (err) {
          if (err) {
            return cb(err);
          }
          cb(null);
        });
      };
      var transactionCommit = function (cb) {
        t.commit().success(cb);
      };
      var transactionRollback = function (cb) {
        t.rollback().success(cb);
      };

      if (err) {
        return callback(err);
      }

      async.waterfall([
        saveSubmission,
        userAddSubmission,
        problemAddSubmission,
        saveSourceCode,
        transactionCommit
      ], function (err) {
        if (err) {
          transactionRollback(function () {
            return callback(err);
          });
        }
        submission.judge();
        callback(null);
      });
    });
  };

  async.series({
    user: findUserById,
    problem: findProblemById
  }, createSubmission);
};

InstanceMethods.getSourceCodePath = function () {
  var self = this;
  var userSubmissionFolder = path.join(config.dir.submission, self.UserId.toString());
  var sourceCodeExt = config.lang.ext[self.language];

  return path.join(userSubmissionFolder, self.id.toString() + '.' + sourceCodeExt);
};

InstanceMethods.getErrorPath = function () {
  var self = this;
  var userSubmissionFolder = path.join(config.dir.submission, self.UserId.toString());

  return path.join(userSubmissionFolder, self.id.toString() + '.err');
};

InstanceMethods.loadSourceCode = function (callback) {
  var self = this;

  fs.readFile(self.getSourceCodePath(), function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
};

InstanceMethods.loadErrorMessage = function (callback) {
  var self = this;

  fs.readFile(self.getErrorPath(), function (err, data) {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
};

InstanceMethods.updateState = function (state, callback) {
  var self = this, iState = 0;

  if (typeof state === 'string') {
    iState = config.state.indexOf(state);
  } else if (typeof state === 'number') {
    iState = state;
  }

  if (iState === -1) {
    return callback(new Error('submission invalid state'));
  }

  self.state = iState;
  self.updateAttributes({
    state: iState
  }).
    success(callback).
    error(callback);
};

InstanceMethods.judge = function () {
  var self = this;
  var pyproc = function (problem) {
    var pypy = new PyProc({
      'problem-dir': (self.problem || problem).getPath(),
      'source-path': self.getSourceCodePath(),
      'language': self.language
    }, function (state, cb) {
      console.log(state);
      self.updateState(state, function () {
        if (state === 'Compile Error') {
          var dstPath = self.getErrorPath();
          var srcPath = path.join(pypy.opt['working-dir'], './compile.err');
          fs.writeFileSync(dstPath, fs.readFileSync(srcPath));
        }

        cb();
      });
    }, function (code) {
      console.log('code: ' + code);
    });
  };

  if (!self.problem) {
    self.getProblem().
      success(function (problem) {
        pyproc(problem);
      }).
      error(function (err) {
        self.updateState('Internal Error');
      });
  }
};

module.exports = function (sequelize, DataTypes) {
  var Submission = sequelize.define('Submission', {
    language: {
      type: DataTypes.STRING,
      notNull: true,
      isIn: [config.lang.list]
    },
    codeLength: {
      type: DataTypes.INTEGER,
      notNull: true,
      min: 0
    },
    state: {
      type: DataTypes.INTEGER,
      notNull: true,
      defaultValue: config.state.indexOf('Pending')
    },
    executionTime: {
      type: DataTypes.INTEGER,
      min: 0
    }
  }, {
    associate: function (models) {
      Submission
        .belongsTo(models.User)
        .belongsTo(models.Problem);
    },
    classMethods: ClassMethods,
    instanceMethods: InstanceMethods
  });

  _Submission = Submission;

  return Submission;
};

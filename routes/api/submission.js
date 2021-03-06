/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var User = models.User;
var Problem = models.Problem;
var Submission = models.Submission;

var findById = function (id, callback) {
  Submission.find(id)
    .success(function (submission) {
      callback(null, submission);
    })
    .error(function (err) {
      callback(err);
    });
};

var updateSubmission = function (data, submission, callback) {
  submission.updateAttributes(data)
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

var destroySubmission = function (submission, callback) {
  if (!submission) {
    return callback(new Error(''));
  }

  submission.destroy()
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

exports.list = function (req, res) {
  Submission.all()
    .success(function (submissions) {
      res.json(submissions);
    })
    .error(function (err) {
      res.json(500, err.toString());
    });
};

exports.new = function (req, res) {
  return undefined;
};

exports.show = function (req, res) {
  var id = req.params.id;

  findById(id, function (err, submission) {
    if (err) {
      return res.json(500, err.toString());
    }

    async.series({
      sourceCode: function (cb) { submission.loadSourceCode(cb); },
      errorMessage: function (cb) { submission.loadErrorMessage(cb); }
    }, function (err, results) {
      if (results.sourceCode) {
        submission.values.sourceCode = String(results.sourceCode, 'utf8');
      }
      if (results.errorMessage) {
        submission.values.errorMessage = String(results.errorMessage, 'utf8');
      }

      res.json(submission);
    });

  });
};

exports.create = function (req, res) {
  var findProblem = function (cb) {
    if (req.body && req.body.problemId) {
      return cb(null, req.body.problemId);
    }
    return cb(new Error('Bad Request'));
  };
  var findUser = function (cb) {
    if (req.session && req.session.auth && req.session.auth.UserId) {
      return cb(null, req.session.auth.UserId);
    }
    return cb(new Error('Not found user'));
  };
  var submitSourceCode = function (results, cb) {
    if (req.body && req.body.submission.language && req.body.submission.sourceCode) {
      Submission.push({
        language: req.body.submission.language,
        sourceCode: req.body.submission.sourceCode
      }, results.userId, results.problemId, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null);
      });
    } else {
      cb(new Error('Bad Request'));
    }
  };

  async.series({
    userId: findUser,
    problemId: findProblem
  }, function (err, results) {
    if (err) {
      return res.json(500, err);
    }

    submitSourceCode(results, function (err) {
      if (err) {
        return res.json(500, err.toString());
      }
      res.send(200);
    });
  });
};

exports.update = function (req, res) {
  var id = req.params.id;
  var data = {};

  async.waterfall([
    async.apply(findById, id),
    async.apply(updateSubmission, data)
  ], function (err) {
    if (err) {
      return res.json(500, err);
    }

    res.json({});
  });
};

exports.destroy = function (req, res) {
  var id = req.params.id;

  async.waterfall([
    async.apply(findById, id),
    destroySubmission
  ], function (err) {
    if (err) {
      return res.json(500, err);
    }

    return res.json({});
  });
};

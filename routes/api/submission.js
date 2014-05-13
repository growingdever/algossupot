/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

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
      res.json(500, { error: err.toString() });
    });
};

exports.new = function (req, res) {
  return undefined;
};

exports.show = function (req, res) {
  var id = req.params.id;

  findById(id, function (err, submission) {
    if (err) {
      return res.json(500, { error: err.toString() });
    }

    res.json(submission);
  });
};

exports.create = function (req, res) {
  return undefined;
};

exports.update = function (req, res) {
  var id = req.params.id;
  var data = {};

  async.waterfall([
    async.apply(findById, id),
    async.apply(updateSubmission, data)
  ], function (err) {
    if (err) {
      return res.json({ error: err.toString() });
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
      return res.json(500, { error: err.toString() });
    }

    return res.json({});
  });
};
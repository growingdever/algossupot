/*jslint node: true, eqeq: true, vars: true */
/*global async, models, winston*/
'use strict';

var User = models.User;

var findById = function (id, callback) {
  User.find(id)
    .success(function (user) {
      callback(null, user);
    })
    .error(function (err) {
      callback(err);
    });
};

var updateUser = function (data, user, callback) {
  user.updateAttributes(data)
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

var destroyUser = function (user, callback) {
  if (!user) {
    return callback(new Error(''));
  }

  user.destroy()
    .success(function () {
      callback(null);
    })
    .error(function (err) {
      callback(err);
    });
};

exports.list = function (req, res) {
  User.all()
    .success(function (users) {
      res.json(users);
    })
    .error(function (err) {
      res.send(500, { error: err.toString() });
    });
};

exports.new = function (req, res) {
  return undefined;
};

exports.show = function (req, res) {
  var id = req.params.id;

  findById(id, function (err, user) {
    if (err) {
      return res.json(500, { error: err.toString() });
    }

    res.json(200, user);
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
    async.apply(updateUser, data)
  ], function (err) {
    if (err) {
      return res.send(500, { error: err.toString() });
    }

    res.json({});
  });
};

exports.destroy = function (req, res) {
  var id = req.params.id;

  async.waterfall([
    async.apply(findById, id),
    destroyUser
  ], function (err) {
    if (err) {
      return res.json(500, { error: err.toString() });
    }

    return res.json({});
  });
};
const express = require("express");
const User = require("./models/User");

const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const authorizedUser = await User.findOne({ token: token });
  if (authorizedUser) {
    req.user = authorizedUser;
    return next();
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;

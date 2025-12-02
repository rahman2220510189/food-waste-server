const express = require("express");

module.exports = (userController) => {
  const router = express.Router();

  router.post("/login", (req, res) => userController.createOrUpdateUser(req, res));

  router.get("/:uid", (req, res) => userController.getUserProfile(req, res));

  return router;
};
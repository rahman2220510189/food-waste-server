const express = require("express");

module.exports = (dashboardController) => {
  const router = express.Router();

  router.get("/:uid/stats", (req, res) => dashboardController.getDashboardStats(req, res));

  router.get("/:uid/history", (req, res) => dashboardController.getDetailedHistory(req, res));

  return router;
};
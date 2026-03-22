const express = require("express");

module.exports = (adminController) => {
  const router = express.Router();

  // Stats
  router.get("/stats", (req, res) => adminController.getStats(req, res));

  // Users
  router.get("/users", (req, res) => adminController.getUsers(req, res));
  router.put("/users/:id/make-admin",   (req, res) => adminController.makeAdmin(req, res));
  router.put("/users/:id/remove-admin", (req, res) => adminController.removeAdmin(req, res));
  router.delete("/users/:id", (req, res) => adminController.deleteUser(req, res));

  // Foods
  router.get("/foods", (req, res) => adminController.getFoods(req, res));
  router.delete("/foods/:id", (req, res) => adminController.deleteFood(req, res));

  // Payments / Orders
  router.get("/payments", (req, res) => adminController.getPayments(req, res));

  return router;
};
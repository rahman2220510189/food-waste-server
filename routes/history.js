const express = require('express');
const router = express.Router();

module.exports = (historyController) => {
  router.get('/', (req, res) => historyController.getUserHistory(req, res));

  router.get('/accepted', (req, res) => historyController.getAcceptedRequests(req, res));

  router.get('/cancelled', (req, res) => historyController.getCancelledRequests(req, res));

  return router;
};
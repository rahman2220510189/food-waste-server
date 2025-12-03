const express = require('express');

module.exports = (paymentController) => {
  const router = express.Router();

  router.post('/create-payment-intent', (req, res) => 
    paymentController.createPaymentIntent(req, res)
  );

  router.post('/confirm-payment', (req, res) => 
    paymentController.confirmPayment(req, res)
  );

  return router;
};
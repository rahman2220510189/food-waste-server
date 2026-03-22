const express = require('express');

module.exports = (paymentController) => {
  const router = express.Router();

  router.post('/create-payment-intent', (req, res) => //api to create payment intent
    paymentController.createPaymentIntent(req, res) //object with client secret
  );

  router.post('/confirm-payment', (req, res) => 
    paymentController.confirmPayment(req, res)
  );

  return router;
};
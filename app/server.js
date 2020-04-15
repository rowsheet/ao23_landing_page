var express = require('express');
var app = express();
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/*------------------------------------------------------------------------------
Config.
-----------------------------------------------------------------------------*/
app.set('port', (process.env.PORT || 5100));

/*------------------------------------------------------------------------------
Public Files.
-----------------------------------------------------------------------------*/
app.use('/public', express.static(__dirname + '/public'));

/*------------------------------------------------------------------------------
Stripe Webhook Signature Verification
-----------------------------------------------------------------------------*/
app.use(
	express.json({
	  // We need the raw body to verify webhook signatures.
	  // Let's compute it only when hitting the Stripe webhook endpoint.
	  verify: function(req, res, buf) {
		if (req.originalUrl.startsWith("/webhook")) {
		  req.rawBody = buf.toString();
		}
	  }
	})
  );
/*------------------------------------------------------------------------------
App Views.
-----------------------------------------------------------------------------*/
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/*------------------------------------------------------------------------------
Page Routes.
-----------------------------------------------------------------------------*/
app.get('/', function(request, response) {
	response.render('pages/index')
});
app.get('/payments', function(request, response) {
	response.render('pages/payments')
});
app.post('/', function(request, response) {
    call_api(request, response);
});
app.get('*', function(request, response) {
	response.status(404).render('pages/page_404')
});

/*------------------------------------------------------------------------------
Stripe
-----------------------------------------------------------------------------*/
const calculateOrderAmount = isDonating => {
	// Replace this constant with a calculation of the order's amount
	// Calculate the order total on the server to prevent
	// people from directly manipulating the amount on the client
	return isDonating ? 1400 : 1354;
  };
  
  app.post("/create-payment-intent", async (req, res) => {
	const { currency } = req.body;
  
	// Required if we want to transfer part of the payment as a donation
	// A transfer group is a unique ID that lets you associate transfers with the original payment
	const transferGroup = `group_${Math.floor(Math.random() * 10)}`;
  
	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
	  amount: calculateOrderAmount(false),
	  currency: currency,
	  transfer_group: transferGroup
	});
  
	// Send publishable key and PaymentIntent details to client
	res.send({
	  publicKey: env.parsed.STRIPE_PUBLISHABLE_KEY,
	  paymentIntent: paymentIntent
	});
  });
  
  app.post("/update-payment-intent", async (req, res) => {
	const { isDonating, id } = req.body;
	const paymentIntent = await stripe.paymentIntents.retrieve(id);
  
	let metadata;
  
	if (isDonating) {
	  // Add metadata to track the amount being donated
	  metadata = Object.assign(paymentIntent.metadata || {}, {
		donationAmount: 46,
		organizationAccountId: process.env.ORGANIZATION_ACCOUNT_ID
	  });
	} else {
	  metadata = Object.assign(paymentIntent.metadata || {}, {
		donationAmount: null,
		organizationAccountId: null
	  });
	}
  
	// Update the PaymentIntent with the new amount and metedata
	const updatedPaymentIntent = await stripe.paymentIntents.update(id, {
	  amount: calculateOrderAmount(isDonating),
	  metadata: metadata
	});
  
	res.send({ amount: updatedPaymentIntent.amount });
  });
  
  // Webhook handler for asynchronous events.
  app.post("/webhook", async (req, res) => {
	// Check if webhook signing is configured.
	if (env.parsed.STRIPE_WEBHOOK_SECRET) {
	  // Retrieve the event by verifying the signature using the raw body and secret.
	  let event;
	  let signature = req.headers["stripe-signature"];
	  try {
		event = stripe.webhooks.constructEvent(
		  req.rawBody,
		  signature,
		  env.parsed.STRIPE_WEBHOOK_SECRET
		);
	  } catch (err) {
		console.log(`⚠️  Webhook signature verification failed.`);
		return res.sendStatus(400);
	  }
	  data = event.data;
	  eventType = event.type;
	} else {
	  // Webhook signing is recommended, but if the secret is not configured in `config.js`,
	  // we can retrieve the event data directly from the request body.
	  data = req.body.data;
	  eventType = req.body.type;
	}
  
	if (eventType === "payment_intent.succeeded") {
	  if (data.object.metadata.donationAmount) {
		// Customer made a donation
		// Use Stripe Connect to transfer funds to organization's Stripe account
		const transfer = await stripe.transfers.create({
		  amount: data.object.metadata.donationAmount,
		  currency: "usd",
		  destination: data.object.metadata.organizationAccountId,
		  transfer_group: data.object.transfer_group
		});
  
		console.log(
		  `😀 Customer donated ${transfer.amount} to ${transfer.destination} send them a thank you email at ${data.object.receipt_email}!`
		);
	  } else {
		console.log("😶 Payment received -- customer did not donate.");
	  }
	} else if (eventType === "payment_intent.payment_failed") {
	  console.log("❌ Payment failed.");
	}
	res.sendStatus(200);
  });

/*------------------------------------------------------------------------------
Start Server.
-----------------------------------------------------------------------------*/
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});





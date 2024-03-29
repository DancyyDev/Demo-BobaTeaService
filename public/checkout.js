// const {stripePublishableKey} = require("../config/apiKeys");


  // module.exports = require('./keys_prod')

      // This is your test publishable API key.
// const Stripe = require('../stripe');
// const stripe = Stripe({stripePublishableKey});
const stripe = Stripe(stripePublishableKey);

const totalPrice = document.querySelector('#totalPrice').innerText

const total = parseFloat(totalPrice) * 100;

let elements;

initialize();
checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

// Fetches a payment intent and captures the client secret
async function initialize() {
  const response = await fetch("/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( {total} ),
  });
  const { clientSecret } = await response.json();

  const appearance = {
    theme: 'stripe',
  };
  elements = stripe.elements({ appearance, clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {

  e.preventDefault();
  setLoading(true);
  givePoints();
  changeStatus();

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: "http://bobotea.onrender.com/purchaseComplete",
    },
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

// Fetches the payment intent status after payment submission
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Your payment was not successful, please try again.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

//////////////
// Updating rewards system
/////////////

const points = document.querySelector('#rewardPoints').innerText
const rewardPoints = parseInt(points)

function givePoints() {
  console.log('Give me points!!!')
  fetch('updateRewards', {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        'rewardPoints': rewardPoints
    })
  })
  .then(response => {
      if (response.ok) 
      return response.json()
  })
  .then(data => {
    console.log(data)
    // window.location.reload(true)
  })
}

// ///////////////////
// Updateing status
// //////////////////

function changeStatus() {
  fetch('changeStatus', {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        'status': 'In Progress'
    })
  })
  .then(response => {
      if (response.ok) 
      return response.json()
  })
  .then(data => {
    console.log(data)
    // window.location.reload(true)
  })
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}
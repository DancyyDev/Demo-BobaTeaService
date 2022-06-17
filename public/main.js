// const completeOrder = document.querySelector('#orderComplete')
const deleteItem = document.querySelectorAll('.fa-square-xmark')
const payBtn = document.querySelector('#submit')
const itemPrice = document.querySelector('#itemPrice')

// require("dotenv").config({path:'./config/.env'})

      // const Stripe = require('stripe');
const stripe = Stripe('pk_test_51L9yuoJnjUu1jL0icE5yoCHGXNu2VXYw0JhGiiG28ZgNGTYqnrHYEQ4joDFnM59Pw15b1w49HEAoBuPWa8sC3xkx00LWgSjLDX');


Array.from(deleteItem).forEach(function(element) {
    element.addEventListener('click', function(e){
     let orderId = e.target.parentNode.parentNode.id
     console.log(orderId)

      fetch('/deleteOrderItem', {
        method: 'delete',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            '_id': orderId
        })
      })
      .then(data => {
        console.log(data)
        window.location.reload()
      })
    });
  });


  // payBtn.addEventListener('click', function(e){
  //   e.preventDefault();
  //   console.log('hello')
  //   fetch('/checkout', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       price: itemPrice
  //     }),
  //     })
  //     .then((response) => response.json())
  //     .then((session) => {
  //       stripe.redirectToCheckout({sessionId: session.id})
  //     })
  //   .catch((error) => {
  //      console.error('Error:',error)
  //   })
  // })
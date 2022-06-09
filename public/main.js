const completeOrder = document.querySelector('#orderComplete')
const deleteItem = document.querySelectorAll('.fa-square-xmark')


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
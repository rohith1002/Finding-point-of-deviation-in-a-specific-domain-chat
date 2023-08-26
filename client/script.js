/**
 * Use io (loaded earlier) to connect with the socket instance running in your server. 
 * IMPORTANT! By default, socket.io() connects to the host that 
 * served the page, so we dont have to pass the server url
 */
var socket = io();
var thresholdSet = parseFloat(localStorage.getItem("noteLocalThreshold"));
var counter = 0
var warnings = 3;
//prompt to ask user's name 
const name = prompt('Welcome! Please enter your name:')

// emit event to server with the user's name
socket.emit('new-connection', {username: name})

// get elements of our html page
const chatContainer = document.getElementById('chat-container')
const messageInput = document.getElementById('messageInput')
const messageForm = document.getElementById('messageForm')

// Re-setting cosine value each time user submits the message (broadcast message)
// function setGlobalCosine(){
//   globalCosine = parseFloat(localStorage.getItem("noteLocalCosine"));
// }


messageForm.addEventListener('submit', (e) => {
  // avoid submit the form and refresh the page
  e.preventDefault()
setTimeout(function() {
  // Update the HTML
  // setHTMLCosine();
  
  // check if there is a message in the input
  if(messageInput.value !== ''){
    let newMessage = messageInput.value

    //sends message and our id to socket server
    socket.emit('new-message', {user: socket.id, message: newMessage})
    
    // Getting the userID and particular message into a dictionary
    valuableData = {user: socket.id, message: newMessage}
    // valuableData["user"]
    // valuableData["message"]
    // Does not work as called before setting but works good in console.
    // Solution we ignore first message either way
    // console.log("Session stored cosine: ",parseFloat(sessionStorage.getItem("noteCosine")))
    
    cosine = parseFloat(localStorage.getItem("noteLocalCosine"))
    console.log("New Message Locally stored cosine: ",parseFloat(localStorage.getItem("noteLocalCosine")))

    // Alerting the user 3 times for spam and then closing the tab if not behaving. Haha
    // if(cosine < thresholdSet){
    //   counter = counter + 1;
    //   alert("Don't spam!!");
    //   // alert("Don't spam!! Warnings left: ",(warnings-counter));
    //   // Do this
    //   // if(warnings == 0){
    //   //   //Reload the page
    //   //   location.reload()
    //   // }
    // }
    addMessage({message: newMessage, cosineScoreCurr: cosine}, 'my' )
    //resets input
    messageInput.value = ''
  }else{
    messageInput.classList.add('error')
  }
}, 700) //0.7 seconds
})



socket.on('welcome', function (data) {
  console.log(data);
  console.log("Welcome extracted: ",data.user)
  // To use to make CORS
  currUser = data.user;
  // Add user using existing methods
  addMessage(currUser, 'user')
  // sessionStorage.setItem("currUser", currUser);
  addMessage(data, 'server')
});

socket.on('broadcast-message', (data) => {
  console.log('broadcast message event')
  // Outputs {message: "", user: ""}
  // console.log("Broadcast msg: ",data)
  // cosine = parseFloat(sessionStorage.getItem("noteCosine"))
  
  // Getting the local cosine
  console.log("Broadcast Local Cosine: ", localStorage.getItem("noteLocalCosine"))
  localcosine = parseFloat(localStorage.getItem("noteLocalCosine"))
  // Call function to set global cosine
  addMessage({message: data.message, user: data.user, cosineScoreCurr: localcosine}, 'others')
})

// removes error class from input
messageInput.addEventListener('keyup', (e) => {
  messageInput.classList.remove('error')
})

// receives two params, the message and if it was sent by you
// so we can style them differently
function addMessage(data, type = false){
  const messageElement = document.createElement('div')
  messageElement.classList.add('message')
  
  if(type === 'my'){
    console.log("cosine", data.cosineScoreCurr, thresholdSet)
    if(data.cosineScoreCurr < thresholdSet){
      alert("Please send relevant messages!")
      messageElement.classList.add('my-spam')
      messageElement.innerText = `${data.message}`
    }
    else{
      messageElement.classList.add('my-message')
      // messageElement.innerText = `${data.message}` + ' CosineScore: ' + `${data.cosineScoreCurr}`
      messageElement.innerText = `${data.message}`
    }

  }else if(type === 'others'){
    if(data.cosineScoreCurr < thresholdSet){
      messageElement.classList.add('others-spam')
      messageElement.innerText = `${data.user}: ${data.message}`
    }
    else{
      messageElement.classList.add('others-message')
      messageElement.innerText = `${data.user}: ${data.message}`
    }
    // messageElement.classList.add('others-message')
    // messageElement.innerText = `${data.user}: ${data.message}`
  }else if(type == 'user'){
    messageElement.classList.add('user-name')
    messageElement.innerText = `${currUser}`
  }else{
    messageElement.innerText = `${data.message}`

  }
  // adds the new div to the message container div
  chatContainer.append(messageElement)
}

// -----------------------
socket.on('potentialSpammer', function(data) {
  console.log(data)
});


/* ------------------------- HERE IS THE CLIENT SIDE ------------------------ */
/* ------------------------- HERE IS THE CLIENT SIDE ------------------------ */
/* ------------------------- HERE IS THE CLIENT SIDE ------------------------ */

const socket = io()

// Cours 159 - event acknowledgement
// server (emit) -> client (receive) --acknowledgement--> server
// client (emit) -> server (receive) --acknowledgement--> client
// -

/* -------------------------------- Elements -------------------------------- */
//#region
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
//#endregion
/* -------------------------------------------------------------------------- */

/* -------------------------------- Templates ------------------------------- */
//#region
const $messages = document.querySelector('#messages')
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template',
).innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------- Options / Get username and room from query line ------------ */
//#region
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})
//#endregion
/* -------------------------------------------------------------------------- */

/* --------------------------- Autoscroll feature --------------------------- */
//#region
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------------------ 1st Template for messages ----------------------- */
//#region
socket.on('message', (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('H:mm A'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------------------ 2nd Template for location ----------------------- */
//#region
socket.on('locationMessage', (message) => {
  //console.log(url)
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('H:mm A'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------------------- Room data (users list) ------------------------- */
//#region
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })
  document.querySelector('#sidebar').innerHTML = html
})
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------------------------- SendMessage ------------------------------ */
//#region
$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')
  // disable
  const message = e.target.elements.message.value
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    // enable
    if (error) {
      return console.log(error)
    }
    console.log('Message delivered!')
  })
})
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------------------------- Geolocation ------------------------------ */
//#region
$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Navigator is too old, geolocation not supported')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute('disabled')
        console.log('Location shared!') //callback de socket.on sendLocation
      },
    )
  })
})
//#endregion
/* -------------------------------------------------------------------------- */

/* ------------- Joining with username and room + error catching ------------ */
//#region
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
//#endregion
/* -------------------------------------------------------------------------- */

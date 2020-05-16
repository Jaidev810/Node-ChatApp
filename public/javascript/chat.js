const socket = io();
//elements
const $form = document.querySelector('form');
const $btnform = document.querySelector('#btn');
const $input = document.querySelector('input');
const $btnlocation = document.querySelector('#location');
const $messages = document.querySelector('#messages');

//Templates
const $messagetemplate = document.querySelector('#message-template').innerHTML;
const $locationtemplate = document.querySelector("#location-template").innerHTML;
const $siderbartemplate = document.querySelector('#sidebar_template').innerHTML;

//options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true});

$form.addEventListener('submit', (e) => {
    e.preventDefault();
    //disable button
    $btnform.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('message', message, (error) => {
        //enable button
        $btnform.removeAttribute('disabled');
        $input.value = '';
        $input.focus();
        if(error){
           return  console.log(error);
        }
        console.log('Message has been delivered');
    });
})


const autoscroll = () => {
    //new message Element
    const $newmessage = $messages.lastElementChild;

    //new Element Height
    const newMessageStyles = getComputedStyle($newmessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin;
    
    //Visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrolloffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrolloffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('sending', (text) => {
    console.log(text);
    const html = Mustache.render($messagetemplate, {
        User: text.username,
        message: text.text,
        createdAt:moment(text.createdAt).format(' h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})


$btnlocation.addEventListener('click', () => {
    //disable button
    $btnlocation.setAttribute('disabled', 'disabled');
    if(!navigator.geolocation){
        return alert('Geolocation not supported');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendlocation", {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, () => {
            //enable button
            $btnlocation.removeAttribute('disabled');
            console.log('Location Shared');
        });
    })
});



socket.on('roomdata', ({room, users}) => {
    const html = Mustache.render($siderbartemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})


socket.on('locationsending', (location) => {
    console.log(location);
    const details = Mustache.render($locationtemplate, {
        User: location.username,
        location: location.location,
        createdAt: moment(location.createdAt).format(' h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', details);
    autoscroll();
});


socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error);
        location.href = '/';
    }
});
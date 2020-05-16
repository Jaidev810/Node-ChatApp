const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const Filter = require('bad-words');
const { generatemessage } = require('./utils/message');
const { generatelocation } = require('./utils/message');
const {addUser, removeUser, getUser, getUserInRoom} = require('./utils/users');

const app = express();

const server = http.createServer(app);
const io = socketio(server);

const Port = process.env.Port || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


io.on('connection', (socket) => {
    
    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({
            id: socket.id,
            username,
            room
        });

        if(error){
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('sending', generatemessage(user.username, 'Welcome!'));
        socket.broadcast.to(user.room).emit('sending', generatemessage(`${user.username} Has Joined`));

        io.to(user.room).emit('roomdata', {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback();
    })

    socket.on('message', (text, callback) => {

        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(text)){
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('sending', generatemessage(user.username, text));
        callback();
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('sending', generatemessage(`${user.username} has left`));
            io.to(user.room).emit('roomdata', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
        
    });
    socket.on('sendlocation', (coords, callback) => { 
        const user = getUser(socket.id);
        io.to(user.room).emit('locationsending', generatelocation(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longtitude}`));
        callback();
    })
});



app.get('/', (req, res) =>{
    res.render('index');
});

app.get('/chats', (req, res) =>  {
    res.render("chats");
})


server.listen(Port, () => {console.log(`Server up and running on port ${Port}`)});
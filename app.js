
// Importa i moduli richiesti
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');

// Crea il server HTTP
const server = http.createServer(function(req, res) {
    // Leggi il file index.html
    fs.readFile('./index.html', 'utf-8', function(errore, contenuto) {
        if (errore) {
            // In caso di errore, restituisci un errore 500 (Internal Server Error)
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end('Errore interno del server');
        } else {
            // In caso di successo, restituisci il contenuto del file
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(contenuto);
        }
    });
});

// Crea un'istanza di Socket.io collegata al server
const io = socketIo(server);

// Gestisci la connessione di un client
io.on('connection', function(socket) {
    console.log('Un client è connesso!');
    socket.on('newbie', function(username) {
        socket.username = username;
    });
       
    socket.on('messaggio dal client', function(msg) {
            // Ricevi il messaggio dal client e fai qualcosa con esso
        console.log('Messaggio ricevuto dal client:', msg);
        io.emit('server message', msg+" Grazie "+socket.username );
    });
    socket.on('broadcast', function(msg) {
        // Ricevi il messaggio dal client e fai qualcosa con esso
    console.log('Messaggio ricevuto dal client:', msg);
    socket.broadcast.emit('server message', socket.username +'>' + msg);
    });
    
    socket.on('disconnect', function() {
            console.log('Un client si è disconnesso.');
        });
    });

// Avvia il server
server.listen(3030, () => {
    console.log('Server avviato. Accedi all\'URL http://localhost:3030/');
});
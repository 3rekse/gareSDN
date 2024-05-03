/*applicazione Node.js che utilizza il framework Express
 e la libreria Socket.io per creare un'applicazione di chat 
 in tempo reale.*/
// Importa i moduli necessari
const express = require('express'),
    http = require('http'),
    socketIo = require('socket.io'),
    // Array per memorizzare le variabili dei socket
  //  const socketVariables = [];

    ent = require('ent'), // Blocca i caratteri HTML (equivalente di htmlentities in PHP)
    fs = require('fs');

// Crea un'app Express e un server HTTP
const app = express(),
    server = http.createServer(app),
    io = socketIo(server);
let limit=1, userSimbol =127789;
fs.access('config.json', fs.constants.F_OK, function(err) {
    if (err) {
        fs.writeFile('config.json', JSON.stringify({userSimbol : userSimbol }) , function(err) {
            if (err) {
                console.error('Errore durante la scrittura del file:', err);
            } else {
                console.log('Dati scritti correttamente nel file "' + filePath + '"');
            }
        });
    } else {
        // Il file esiste, quindi procedi con la lettura
        fs.readFile('config.json', 'utf-8', function(readErr, data) {
            if (readErr) {
                console.error('Errore durante la lettura del file:', readErr);
            } else {
                try {
                    let jsonArray = JSON.parse(data);
                    console.log("Imported "+jsonArray.userSimbol);
                    userSimbol=jsonArray.userSimbol;
                } catch (jsonErr) {
                    console.error('Errore durante il parsing JSON:', jsonErr);
                }
            }
        });
    }
});

let xnum=Math.ceil(Math.random()*Math.pow(10,limit)+Math.pow(10,limit-1));
// Carica la pagina index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/indexChat.html');
});

// Gestione delle connessioni dei socket
io.sockets.on('connection', function (socket) {
    // Quando il nome utente viene ricevuto, viene memorizzato come variabile di sessione e notificato agli altri partecipanti
    socket.on('new_client', function(username) {
        username = ent.encode(username);
        socket.username = String.fromCodePoint(userSimbol++)
        socket.real= username;
        socket.punti = 0;
        socket.prove = 0;
        socket.livello = 0; 
        socket.broadcast.emit('new_client', username);
        socket.emit('new_number', 'Converti '+xnum+'<sub>10</sub> In binario ');
    });

    // Quando un messaggio viene ricevuto, il nome utente del client viene recuperato e inviato agli altri partecipanti
    socket.on('message', function (message) {
        message = ent.encode(message);
        if (parseInt(message,2) == xnum ) {
            socket.livello = Math.max(socket.livello,limit); 
            socket.punti+=limit;
            xnum=Math.ceil(Math.random()*Math.pow(10,++limit)+Math.pow(10,limit-1));
            socket.broadcast.emit('new_number', 'Converti '+xnum+'<sub>10</sub> In binario ');
            socket.emit('new_number', 'Converti '+xnum+'<sub>10</sub> In binario ');
            
        }else { message = '&#128169;'.repeat(++socket.prove);        
        }
        socket.broadcast.emit('message', {username: socket.username, punti: '&#127942;'.repeat(socket.punti) , message: message});
    }); 

    socket.on('disconnect', function() {
        let punteggio= socket.punti-socket.prove;
        console.log(punteggio)
        //message += '&#128169;'.repeat(socket.prove);
        socket.broadcast.emit('message', {username: socket.username, punti: '&#127942;'.repeat(socket.punti), 
                              message: 'Si ritira \u25BA '+socket.livello+' con punti:'
                              +punteggio+'&#128169;'.repeat(socket.prove)});
        let  datiDaSalvare = JSON.stringify({ id : socket.username.codePointAt(0),
             username: socket.username , real: socket.real,  
             punti: punteggio,prove: socket.prove });
            
        fs.appendFile('dati.json', datiDaSalvare, function(err) {
            if (err) { console.error('Errore durante il salvataggio del file:', err);
            } else {console.log('Dati salvati correttamente nel file "dati.json"'); }
        });
       
        fs.writeFile('config.json', JSON.stringify({userSimbol : userSimbol, limit : limit }) , function(err) {
            if (err) {
                console.error('Errore durante la scrittura del file:', err);
            } else {
                console.log('Dati scritti correttamente nel file "' + filePath + '"');
            }
        });
    });
});


// Avvia il server sulla porta 8080
server.listen(8080, () => {
    console.log('Server avviato. Accedi all\'URL http://localhost:8080/');
});


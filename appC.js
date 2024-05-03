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

let xnum=[Math.ceil(Math.random()*2)];
// Carica la pagina index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/indexChat.html');
});

// Mappa per tenere traccia dei client connessi
const connectedClients = new Map();

// Gestione delle connessioni dei socket
io.sockets.on('connection', function (socket) {
   // Gestisci l'evento 'join' quando un client si unisce alla chat
    // Quando il nome utente viene ricevuto, viene memorizzato come variabile di sessione e notificato agli altri partecipanti
    socket.on('new_client', function(newname) {     
        username = ent.encode(newname.username);
        classe=ent.encode(newname.classe);
        console.log(`${username} si è unito alla chat`);
        connectedClients.set(socket.Id, socket); // Memorizza il socket associato all'username
        socket.username = String.fromCodePoint(userSimbol++)
        socket.real= username;
        socket.punti = 0;
        socket.prove = 0;
        socket.classe = classe;
        socket.livello = 0; 
        socket.broadcast.emit('new_client', {username:socket.username,classe:socket.classe});
        socket.emit('new_number',{ liv:socket.livello, msg :'Converti '+xnum[socket.livello]+'<sub>10</sub> In binario '});
    });

    // Quando un messaggio viene ricevuto, il nome utente del client viene recuperato e inviato agli altri partecipanti
    socket.on('message', function (message) {
        console.log("message");
        message = ent.encode(message.msg);
        if (parseInt(message,2) == xnum[socket.livello] ) {
          //  socket.livello++; 
            socket.punti++;
            xnum[socket.livello]=Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello+1));
            socket.broadcast.emit('new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnum[socket.livello]+'<sub>10</sub> In binario '});
            socket.livello++;
            if (xnum.length==socket.livello)
             { xnum.push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));}
             socket.broadcast.emit('message', {liv: socket.livello-1 ,username: socket.username, punti: '&#127942;'.repeat(socket.punti) , message: "WINNER"});
            socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'Bravo converti '+xnum[socket.livello]+'<sub>10</sub> In binario '});
        }else { message = '&#128169;'.repeat(++socket.prove); }
        socket.broadcast.emit('message', {liv: socket.livello ,username: socket.username, punti: '&#127942;'.repeat(socket.punti) , message: message});
    }); 

    socket.on('disconnect', function() {
        console.log("ABBANDONO");
        
        let punteggio= socket.punti-socket.prove;
        console.log(punteggio)
        //message += '&#128169;'.repeat(socket.prove);
        socket.broadcast.emit('message', {username: socket.username, punti: '&#127942;'.repeat(socket.punti), 
                              message: 'Si ritira \u25BA '+socket.livello+' con punti:'+punteggio+'&#128169;'.repeat(socket.prove)});
        let  newUser = { 
             //id : socket.username.codePointAt(0),
             username: socket.username , 
             real: socket.real,  
             punti: punteggio,
             prove: socket.prove };
             fs.readFile('users.json', 'utf8', (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                        
             // Converte il contenuto del file in un array di oggetti
             const users =(data? JSON.parse(data): []);
                  

            // Aggiungi il nuovo utente all'array
                users.push(newUser);
               // Ordina l'array in base ai punti (dal più alto al più basso)
                users.sort((a, b) => b.punti - a.punti);
              
                // Ora l'array è ordinato in base ai punti
                console.log(users);
              
                // Salva nuovamente l'array in un file JSON
                fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log('Dati utente aggiunti e salvati correttamente.');
                  }
                });
                          // Rimuovi il client dalla mappa dei client connessi
 
                for (const [username, clientSocket] of connectedClients.entries()) {
                    if (clientSocket === socket) {
                         connectedClients.delete(username);
                        console.log(`${username} si è disconnesso dalla chat`);
                        break;
                    }
                }
              });   

       
        fs.writeFile('config.json', JSON.stringify({userSimbol : userSimbol, limit : 99 }) , function(err) {
            if (err) {
                console.error('Errore durante la scrittura del file:', err);
            } else {
                console.log('Dati scritti correttamente nel file "');
            }
        });
    });
});


// Avvia il server sulla porta 8080
server.listen(8080, () => {
    console.log('Server avviato. Accedi all\'URL http://localhost:8080/');
});

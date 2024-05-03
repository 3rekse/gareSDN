/*applicazione Node.js che utilizza il framework Express
e la libreria Socket.io per creare un'applicazione di chat 
in tempo reale. */
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
let gare=0; userSimbol =127789;
let saltaLiv=[2,3,4];
fs.access('config.json', fs.constants.F_OK, function(err) {
    if (err) {
        fs.writeFile('config.json', JSON.stringify({userSimbol : userSimbol , gara : gare }) , function(err) {
            if (err) {
                console.error('Errore durante la scrittura del file:', err);
            } else {
                console.log('Dati scritti correttamente nel file config.json ');
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
                    gare=jsonArray.gara;
                } catch (jsonErr) {
                    console.error('Errore durante il parsing JSON:', jsonErr);
                }
            }
        });
    }
});

const gara = new Map();
const xnumgara= new Map(); 
const iscritti= new Map(); 
// Carica la pagina 
app.get('/top', function (req, res) {
        res.sendFile(__dirname + '/gara'+gare+'.json');
});
// Carica la pagina index.html
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/indexChat.html');
});

const socketMulticast = (socketMappa,titolo,msqemit) => {
    // Corpo della funzione
    console.log("#Avvisi " +socketMappa.size);
    for (const [socketId] of socketMappa) {   
        console.log(`avvisiamo ${socketId} connesso.`);
        io.to(socketId).emit(titolo, msqemit);
    }
};
/* const classifica = (utente) => {
    // Corpo della funzione
    console.log(socketMappa.size);
    for (const [socketId] of socketMappa) {
        
        console.log(`avvisiamo ${socketId} connesso.`);
        io.to(socketId).emit(titolo, msqemit);
    }
}; */
// Gestione delle connessioni dei socket
io.sockets.on('connection', function (socket) {
    console.log(`Client con ID ${socket.id} connesso.`);
    // Gestisci l'evento 'join' quando un client si unisce alla chat
    // Quando il nome utente viene ricevuto, viene memorizzato come variabile di sessione e notificato agli altri partecipanti
    socket.on('new_client', function(newname) {     
        username = ent.encode(newname.username);
        classe=ent.encode(newname.classe); 
        let myid = socket.id;
        console.log(`Client cID ${myid} `);
        console.log(`${username} si è unito alla chat `);
        if (!gara.has(classe)) {
            // Mappa per tenere traccia dei client connessi
            console.log(`Nuova Classe ${classe}  `);
            gara.set(classe,[new Map()]);
            //gara.set(classe, (new Map()).set(0,new Map())); 
            xnumgara.set(classe,[Math.ceil(Math.random()*2)]); 
            iscritti.set(classe,new Map());
        }
        
        socket.username = String.fromCodePoint(userSimbol++)
        socket.real= username;
        socket.punti = 0;
        socket.prove = 0;
        socket.classe = classe;
        socket.livello = 0;
        socket.fase=0;
        console.log((gara.get(classe)[0].size));
        //if (gara.get(classe)[0].size>0)
        //socketMulticast(gara.get(classe)[0],'new_client', {username:socket.username,classe:socket.classe});
        gara.get(classe)[0].set(myid, socket);
        iscritti.get(classe).set(myid,{  username: socket.username , 
            real: socket.real,  
            punti: socket.punti,
            prove: socket.prove,
            classe: socket.classe,
            livello: socket.livello
         } );
        console.log((gara.get(classe)[0].size));
        socket.broadcast.emit('new_client', {username:socket.username,classe:socket.classe, punti:0});
        socket.emit('new_client', {username:socket.username,classe:socket.classe, punti:0});
        socket.emit('new_number',{ liv:socket.livello, msg :'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario '});
    });
    
    // Quando un messaggio viene ricevuto, il nome utente del client viene recuperato e inviato agli altri partecipanti
    socket.on('message', function (message) {
        let myid = socket.id;
        let condizione=false;
        console.log(myid);
        message = ent.encode(message.msg);
        if (socket.livello>saltaLiv[0])
            if (socket.livello>saltaLiv[1])
            if (socket.livello>saltaLiv[2])
               condizione= (message.trim()===xnumgara.get(socket.classe)[socket.livello].toString(2));
            else
            {
                condizione =parseFloat(message).toString(2) 
                console.log(condizione);
                condizione=( condizione.indexOf(".")==-1? condizione+".":condizione)+"0000000";
                condizione=condizione.substring(0,condizione.indexOf(".")+socket.livello-saltaLiv[1]+1);
                console.log(condizione);
                condizione=(condizione=== xnumgara.get(socket.classe)[socket.livello]); 
                console.log(condizione);
                console.log(xnumgara.get(socket.classe)[socket.livello]);
        }else
          condizione =(parseInt(message) == parseInt(xnumgara.get(socket.classe)[socket.livello],2)); 

        else
         condizione =(parseInt(message,2) == xnumgara.get(socket.classe)[socket.livello]);
       
        console.log(condizione);
        if (condizione ) {
            //  socket.livello++; 
            socket.punti++;
            xnumgara.get(socket.classe)[socket.livello]=Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello+1));           
            gara.get(socket.classe)[socket.livello].delete(myid);
            // socket.broadcast.emit()
            // socketMulticast(gara.get(socket.classe)[socket.livello],'message', {liv: socket.livello ,username: socket.username, punti: 2*socket.punti+socket.prove , message: "WINNER"});
            console.log(socket.classe+"nuovo #"+xnumgara.get(socket.classe)[socket.livello]);    
            if (socket.livello>saltaLiv[0]){
                if (socket.livello>saltaLiv[1]){
                    if (socket.livello>saltaLiv[2]){
                        let decimali=socket.livello-saltaLiv[2];
                        let bc= (Math.random()*100).toString(2);
                        bc=( bc.indexOf(".")==-1? bc+".":bc)+"00000000";
                        bc=bc.substring(0,bc.indexOf(".")+decimali+1);
                        xnumgara.get(socket.classe)[socket.livello]=parseInt(bc.substring(bc.indexOf(".")+1),2)/2**(bc.length-bc.indexOf(".")-1)+parseInt(bc.substring(0,bc.indexOf(".")),2)
                        //xnumgara.get(socket.classe)[socket.livello] =bc.toString();                        
                    }else{
                    let decimali=socket.livello-saltaLiv[1];
                    let bc= (Math.random()*100).toString(2)+"00000000";
                    xnumgara.get(socket.classe)[socket.livello]=bc.substring(0,bc.indexOf(".")+decimali+1);
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale con . + '+decimali+'bit Livello:'});
                    }
                }else{
                   xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
                   socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale '});
                }
            }else{  
                socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario '});
           }  
           socket.livello++;
            if (gara.get(socket.classe).length==socket.livello){
                gara.get(socket.classe).push(new Map()); 
                xnumgara.get(socket.classe).push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));
                if (socket.livello>saltaLiv[0]){
                    if (socket.livello>saltaLiv[1]){
                      if (socket.livello>saltaLiv[2]){
                          let decimali=socket.livello-saltaLiv[2];
                          let bc= (Math.random()*100).toString(2);
                          bc=( bc.indexOf(".")==-1? bc+".":bc)+"00000000";
                          bc=bc.substring(0,bc.indexOf(".")+decimali+1);
                          xnumgara.get(socket.classe)[socket.livello]=parseInt(bc.substring(bc.indexOf(".")+1),2)/2**(bc.length-bc.indexOf(".")-1)+parseInt(bc.substring(0,bc.indexOf(".")),2)                       
                      }else{
                        let bc= (Math.random()*100).toString(2)+"00000000";
                        xnumgara.get(socket.classe)[socket.livello]=bc.substring(0,bc.indexOf(".")+socket.livello-saltaLiv[1]+1);
                     }
                    }else{
                    xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
                    }
                } 
            }
            gara.get(socket.classe)[socket.livello].set( myid,socket); 
            if (socket.livello>saltaLiv[0]){
                if (socket.livello>saltaLiv[1]){
                    if (socket.livello>saltaLiv[2]){
                        socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In BINARIO con . e + '+(socket.livello-saltaLiv[2])+' bits x Livello:'});
                    }else{
                    socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale con . e + '+(socket.livello-saltaLiv[1])+' bits x Livello:'});
                    }
                }else{
               // xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale per il livello'});
                } 
            }else{  
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario  per il livello'});
            }         
        }else { message = '&#128169;'.repeat(++socket.prove); }
     //   socketMulticast(gara.get(socket.classe)[socket.livello],'message', {liv: socket.livello ,username: socket.username, punti: '&#127942;'.repeat(socket.punti) , message: message});
       
     socket.broadcast.emit('message', {liv: socket.livello ,username: socket.username,classe: socket.classe , punti: 2*socket.punti-socket.prove , message: message});
     socket.emit('message', {liv: socket.livello ,username: socket.username, punti: 2*socket.punti-socket.prove , message: message});       
   if (iscritti.get(classe).get(myid)){
    let iscritto = iscritti.get(classe).get(myid);
        iscritto.punti = socket.punti;
        iscritto.prove= socket.prove;
        iscritto.livello= socket.livello;
        iscritto.fase=socket.fase;    
        fs.writeFile('gara'+gare+'.json', JSON.stringify(Object.fromEntries(iscritti.get(classe)), null, 2), 'utf-8', (err) => {
                if (err) {
                    console.error('Errore durante il salvataggio del file:', err);
                } else {
                    console.log('Mappa salvata in mappa.json');
                }
            });
        }else{console.log('Non iscritto' )}   
        }); 
        
        socket.on('disconnect', function() {
            console.log("ABBANDONO");
            if(socket.classe && socket.livello){
             gara.get(socket.classe)[socket.livello].delete(socket.Id);
            let punteggio= socket.punti-socket.prove/2;
            console.log(punteggio)
            //message += '&#128169;'.repeat(socket.prove);
            socketMulticast(gara.get(socket.classe)[socket.livello],'message', {username: socket.username, punti: '&#127942;'.repeat(socket.punti), 
            message: 'Si ritira \u25BA '+socket.livello+' con punti:'+punteggio+'&#128169;'.repeat(socket.prove)});
            let  newUser = { 
                //id : socket.username.codePointAt(0),
                username: socket.username , 
                real: socket.real,  
                punti: punteggio,
                prove: socket.prove,
                false: socket.fase 
            };
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
            });   
            
            fs.writeFile('config.json', JSON.stringify({userSimbol : userSimbol, gara : gare+1 }) , function(err) {
                if (err) {
                    console.error('Errore durante la scrittura del file:', err);
                } else {
                    console.log('Dati scritti correttamente nel file "');
                }
            });
        }
        });
    });
    
    
    // Avvia il server sulla porta 8080
    server.listen(11911, () => {
        console.log('Server avviato. Accedi all\'URL http://localhost:11911/');
    });
    

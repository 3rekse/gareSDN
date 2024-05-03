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

const os = require('os');

// Ottieni l'indirizzo IP locale (IPv4)
const serverIpAddress = Object.values(os.networkInterfaces())
  .flat()
  .filter(details => details.family === 'IPv4' && !details.internal)
  .map(details => details.address)[0];

console.log(`Indirizzo IP locale del server: ${serverIpAddress}`);

//const filePath = path.join(__dirname, 'indexChat.html');
const htmlChat = fs.readFileSync(__dirname + '/indexChat.html', 'utf8');
  // Sostituisci il segnaposto con l'indirizzo del server
const updatedChat = htmlChat.replace('__SERVER_ADDRESS__', serverIpAddress);
const cors = require('cors'); // Importa il middleware CORS

const app = express();

// Abilita il middleware CORS
app.use(cors());
// Crea un'app Express e un server HTTP

server = http.createServer(app),
io = socketIo(server);
let gare=0; userSimbol =127789;
let saltaLiv=[20,21,23,25,27];
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
const gareInWait = new Map();
var countDown=false;
const gara = new Map();
const xnumgara= new Map(); 
const iscritti= new Map(); 
// Carica la pagina 
app.get('/top', function (req, res) {
        res.sendFile(__dirname + '/verificaDecBin.html');
});
// Carica la pagina index.html
app.get('/', function (req, res) {
   // res.sendFile(__dirname + '/indexChat.html');
      // Leggi il file HTML
  

  // Invia il file HTML aggiornato al client
  res.send(updatedChat);
});

function inviaAttese() {
    console.log(Object.keys(gareInWait).length)
    for (var nomegara in gareInWait) {
        if (gareInWait.hasOwnProperty(nomegara)) { // Verifica se la chiave è effettivamente nella mappa
            gareInWait[nomegara] -= 1; // decrementa il valore numerico
            console.log("meno "+ gareInWait[nomegara]);
            socketMulticast  (gara.get(nomegara)[0], 'down', gareInWait[nomegara]);          
            if (gareInWait[nomegara]==0) 
            { delete gareInWait[nomegara];
                if( Object.keys(gareInWait).length==0){
                    clearInterval(countDown);
                    console.log("stoopato ")
                    countDown=false;
                } 
                delete gareInWait[nomegara];               
            }
        }
      }     
  }
  
  // Imposta l'intervallo di 30 secondi per inviare l'evento
  // 30000 millisecondi = 30 secondi */
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
            gareInWait[classe]= 60;
            if (!countDown){
               countDown=setInterval(inviaAttese, 1000);
               console.log("CountDown" );
             }
            xnumgara.set(classe,[Math.ceil(Math.random()*2)]); 
            iscritti.set(classe,new Map());
        }
        
        socket.username = String.fromCodePoint(userSimbol++);
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
        socket.broadcast.emit('new_client', {username:socket.username,classe:socket.classe,real:socket.real, punti:0});
        socket.emit('new_client', {username:socket.username,classe:socket.classe,real:socket.real, punti:0});
        socket.emit('gara',gare);
        socket.emit('avatar', {username:socket.username, real:socket.real});
        socket.emit('new_number',{ liv:socket.livello, msg :'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario '});
    });
    
    // Quando un messaggio viene ricevuto, il nome utente del client viene recuperato e inviato agli altri partecipanti
    socket.on('message', function (message) {
        let myid = socket.id;
        let condizione=false;
        console.log(myid);
        message = ent.encode(message.msg);
      
        if (socket.livello<=saltaLiv[0]){
             let tipConv = socket.livello%6 ;
            if (tipConv==0)  //d2b
            condizione =(parseInt(message,2) == xnumgara.get(socket.classe)[socket.livello]);
            else if (tipConv==1) //b2d
            condizione =(parseInt(message) == parseInt(xnumgara.get(socket.classe)[socket.livello],2));
            else if (tipConv==2) //d2o
            condizione =(parseInt(message,8) == xnumgara.get(socket.classe)[socket.livello]);
            else if (tipConv==3) //o2d
            condizione =(parseInt(message) == parseInt(xnumgara.get(socket.classe)[socket.livello],8));
            else if (tipConv==4) //d2E
            condizione =(parseInt(message,16) == xnumgara.get(socket.classe)[socket.livello]);
            else //if (tipConv==5) //E2d
            condizione =(parseInt(message) == parseInt(xnumgara.get(socket.classe)[socket.livello],16));
        }
      
        else if (socket.livello<=saltaLiv[2]) //b2o
             condizione =(parseInt(message,8) == parseInt(xnumgara.get(socket.classe)[socket.livello],2)); 
        else if (socket.livello<=saltaLiv[3]){ //fb2fd
            condizione =parseFloat(message).toString(2) 
            console.log(condizione);
            condizione=(condizione.indexOf(".")==-1? condizione+".":condizione)+"0000000";
            condizione=condizione.substring(0,condizione.indexOf(".")+socket.livello-saltaLiv[1]+1);
            console.log(condizione);
            condizione=(condizione=== xnumgara.get(socket.classe)[socket.livello]); 
            console.log(condizione);
            console.log(xnumgara.get(socket.classe)[socket.livello]);
        }else //fd2fb      
            condizione= (message.trim()===xnumgara.get(socket.classe)[socket.livello].toString(2));       
        console.log(condizione);
        if (condizione ) {
         
            socket.punti+=1+Math.floor(socket.livello/5);
            xnumgara.get(socket.classe)[socket.livello]=Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello+1));           
            gara.get(socket.classe)[socket.livello].delete(myid);
            // socket.broadcast.emit()
            // socketMulticast(gara.get(socket.classe)[socket.livello],'message', {liv: socket.livello ,username: socket.username, punti: 2*socket.punti+socket.prove , message: "WINNER"});
            console.log(socket.classe+"nuovo #"+xnumgara.get(socket.classe)[socket.livello]);    
            
            if (socket.livello<=saltaLiv[0]){
                let tipConv = socket.livello%6 ;
                if (tipConv==0)  //d2b
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario '});
                else if (tipConv==1) //b2d
                { //b2d
                    xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale '});
                }
                else if (tipConv==2) //d2o
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In ottale '});
                else if (tipConv==3) //o2d
                { 
                    xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(8);
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>8</sub> In decimale '});
                }
                else if (tipConv==4) //d2E
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In esadecimale '});
                else //if (tipConv==5) //E2d
                { 
                    xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(16);
                    socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>16</sub> In decimale '});
                }
            } 
                
            else if (socket.livello<=saltaLiv[2]){ //b2o
                xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(8);
                socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale '});
                }
            else if (socket.livello<=saltaLiv[3]){
                let decimali=socket.livello-saltaLiv[2];
                let bc= (Math.random()*100).toString(2)+"00000000";
                xnumgara.get(socket.classe)[socket.livello]=bc.substring(0,bc.indexOf(".")+decimali+1);
                socketMulticast(gara.get(socket.classe)[socket.livello],'new_number',{ liv: socket.livello, ok:false  ,msg:'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale con . + '+decimali+'bit Livello:'});
            }else{  
                let decimali=socket.livello-saltaLiv[3];
                let bc= (Math.random()*100).toString(2);
                bc=( bc.indexOf(".")==-1? bc+".":bc)+"00000000";
                bc=bc.substring(0,bc.indexOf(".")+decimali+1);
                xnumgara.get(socket.classe)[socket.livello]=parseInt(bc.substring(bc.indexOf(".")+1),2)/2**(bc.length-bc.indexOf(".")-1)+parseInt(bc.substring(0,bc.indexOf(".")),2)
                        //xnumgara.get(socket.classe)[socket.livello] =bc.toString();                        
            }
            socket.livello++;
            if (gara.get(socket.classe).length==socket.livello){
                gara.get(socket.classe).push(new Map()); 
           //     xnumgara.get(socket.classe).push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));
                    if (socket.livello<=saltaLiv[0]){
                   
                   let tipConv = socket.livello%6 ;
                   
                   xnumgara.get(socket.classe).push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));
                   if (tipConv==1) //b2d
                   xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
                   else if (tipConv==3) //o2d
                   xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(8);
                   else if (tipConv==5) //E2d
                   xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(16);
                    } 
            else if (socket.livello<=saltaLiv[2]){ //b2o
                        xnumgara.get(socket.classe).push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));
                        xnumgara.get(socket.classe)[socket.livello]=xnumgara.get(socket.classe)[socket.livello].toString(2);
    
                }else if (socket.livello<=saltaLiv[3]){ //fb2fd
                        let bc= (Math.random()*100).toString(2)+"00000000";
                        xnumgara.get(socket.classe)[socket.livello]=bc.substring(0,bc.indexOf(".")+socket.livello-saltaLiv[2]+1);
                }else{  //fd2fb
                          let decimali=socket.livello-saltaLiv[3];
                          let bc= (Math.random()*100).toString(2);
                          bc=( bc.indexOf(".")==-1? bc+".":bc)+"00000000";
                          bc=bc.substring(0,bc.indexOf(".")+decimali+1);
                          xnumgara.get(socket.classe)[socket.livello]=parseInt(bc.substring(bc.indexOf(".")+1),2)/2**(bc.length-bc.indexOf(".")-1)+parseInt(bc.substring(0,bc.indexOf(".")),2)              
                }
            }    
            gara.get(socket.classe)[socket.livello].set( myid,socket); 
            if (socket.livello<=saltaLiv[0]){
                let tipConv = socket.livello%6 ;
                if (tipConv==0)  //d2b
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario  per il livello'});
                else if (tipConv==1) //b2d
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale per il livello'});
                else if (tipConv==2) //d2o
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In ottale per il livello'});
                else if (tipConv==3) //o2d
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>8</sub> In decimale per il livello'});
                else if (tipConv==4) //d2E
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In esadecimale per il livello'});
                else //if (tipConv==5) //E2d
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>16</sub> In decimale per il livello'});
            }
            else if (socket.livello<=saltaLiv[2]) //b2o
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In ottale per il livello'});
            else if (socket.livello<=saltaLiv[3])  //fb2d
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>2</sub> In decimale con . e + '+(socket.livello-saltaLiv[1])+' bits x Livello:'});
            else //fd2b
                socket.emit('new_number',{ liv: socket.livello, ok:true ,msg:'🏆🏆🏆🏆&#x270C; Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In BINARIO con . e + '+(socket.livello-saltaLiv[2])+' bits x Livello:'});
        
        }else { message = '&#128169;'.repeat(++socket.prove); }
        socket.broadcast.emit('message', {liv: socket.livello ,username: socket.username,real: socket.real,classe: socket.classe , punti: 2*socket.punti-socket.prove , message: message});
        socket.emit('message', {liv: socket.livello ,username: socket.username,real:socket.real ,classe: socket.classe , punti: 2*socket.punti-socket.prove , message: message});       
        if (socket.prove-socket.punti>10){
        socket.emit('banned');
        console.log('BANNED'+socket.real)
        }
        if (iscritti.get(classe).get(myid)){
            let iscritto = iscritti.get(classe).get(myid);
            iscritto.punti = socket.punti;
            iscritto.prove= socket.prove;
            iscritto.livello= socket.livello;
            iscritto.classe=socket.classe;    
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
            socketMulticast(gara.get(socket.classe)[socket.livello],'message', {username: socket.username,real: socket.real, punti: '&#127942;'.repeat(socket.punti), 
            message: 'Si ritira \u25BA '+socket.livello+' con punti:'+punteggio+'&#128169;'.repeat(socket.prove)});
            let  newUser = { 
                //id : socket.username.codePointAt(0),
                username: socket.username , 
                real: socket.real,  
                punti: punteggio,
                prove: socket.prove,
                classe: socket.classe ,
                gara: gare
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
    

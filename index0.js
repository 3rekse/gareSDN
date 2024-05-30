// Setup basic express server
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const ent = require('ent');
const fs = require('fs');
const gareInWait = new Map();
const gareInRun = new Map();

const gara = new Map();
const xnumgara= new Map(); 
const iscritti= new Map(); 
let countDown=false;
let gare=Date().toISOString();
let userSimbol =127789;
let saltaLiv=[99,21,23,25,27]; // cambia tipi di esercizio 
// Routing
app.use(express.static('public'));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// MUTEX per la sincronizzazione
const { Mutex } = require('async-mutex');

// Creazione di un mutex
const mutex = new Mutex();

const socketMulticastMutex = (socketMappa,titolo,msqemit) => {
  // Corpo della funzione
  console.log("#Avviso: "+titolo+'-'+msqemit + " per:" +socketMappa.size);
  for (const [socketId] of socketMappa) {   
    console.log(` ${socketId} .  ${msqemit.liv}`);
      io.to(socketId).emit(titolo, msqemit);
  }
};
// Funzione che utilizza il mutex
async function socketMulticast(socketMappa,titolo,msqemit) {
  // Acquisizione del mutex
  const release = await mutex.acquire();

  try {
    // Blocco di codice critico
    console.log('Inizio operazione critica');
    console.log("#Avviso: "+titolo+'-'+msqemit + " per:" +socketMappa.size);
  for (const [socketId] of socketMappa) {   
    console.log(` ${socketId} .  ${msqemit.liv}`);
      io.to(socketId).emit(titolo, msqemit);
  }
    console.log('Fine operazione critica');
  } finally {
    // Rilascio del mutex, anche in caso di errore
    release();
  }
}

function inviaAttese() {
  console.log(Object.keys(gareInWait).length)
  for (var nomegara in gareInWait) {
      if (gareInWait.hasOwnProperty(nomegara)) { // Verifica se la chiave è effettivamente nella mappa
          gareInWait[nomegara] -= 1; // decrementa il valore numerico
          console.log("Gara: "+nomegara+" meno "+ gareInWait[nomegara]);
          socketMulticast  (gara.get(nomegara)[0], 'down', gareInWait[nomegara]);          
          if (gareInWait[nomegara]==0) 
          { delete gareInWait[nomegara];
              gareInRun[nomegara]= new Date(); //set timer 
              if( Object.keys(gareInWait).length==0){
                  clearInterval(countDown);
                  //console.log("stoopato ")
                  countDown=false;
              } 
              delete gareInWait[nomegara];               
          }
      }
    }     
}

function condizione (msg,socket){
if (socket.livello <= saltaLiv[0]) {
  let tipConv = socket.livello % 6;
  if (tipConv == 0) { //d2b
    return (parseInt(msg, 2) === xnumgara.get(socket.classe)[socket.livello]);
  } else if (tipConv == 1) { //b2d
    return (parseInt(msg) === parseInt(xnumgara.get(socket.classe)[socket.livello], 2));
  } else if (tipConv == 2) { //d2o
    return (parseInt(msg, 8) === xnumgara.get(socket.classe)[socket.livello]);
  } else if (tipConv == 3) { //o2d
    return (parseInt(msg) === parseInt(xnumgara.get(socket.classe)[socket.livello], 8));
  } else if (tipConv == 4) { //d2E
    return (parseInt(msg, 16) === xnumgara.get(socket.classe)[socket.livello]);
  } else { //if (tipConv==5) //E2d
    return (parseInt(msg) === parseInt(xnumgara.get(socket.classe)[socket.livello], 16));
  }
} else if (socket.livello <= saltaLiv[2]) { //b2o
  return (parseInt(msg, 8) === parseInt(xnumgara.get(socket.classe)[socket.livello], 2));
} else if (socket.livello <= saltaLiv[3]) { //fb2fd
  let myfloat = parseFloat(msg).toString(2);
  myfloat = (myfloat.indexOf(".") === -1 ? myfloat + "." : myfloat) + "0000000";
  myfloat = myfloat.substring(0, myfloat.indexOf(".") + socket.livello - saltaLiv[1] + 1);
  console.log(myfloat);
  return (myfloat === xnumgara.get(socket.classe)[socket.livello]);
} else { //fd2fb   
  console.log(" CRITIC POINT " + socket.classe + " livello" + socket.livello)
  return (msg.trim() === xnumgara.get(socket.classe)[socket.livello].toString(2));
}
}
function aggiorna_numeri (socket){
  if (socket.livello <= saltaLiv[0]) {
    let tipConv = socket.livello % 6;
    if (tipConv == 0) { //d2b
      socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In binario ' });
    } else if (tipConv == 1) { //b2d
      { //b2d
        xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(2);
        socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In decimale ' });
      }
    } else if (tipConv == 2) { //d2o
      socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In ottale ' });
    } else if (tipConv == 3) { //o2d
      {
        xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(8);
        socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>8</sub> In decimale ' });
      }
    } else if (tipConv == 4) { //d2E
      socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In esadecimale ' });
    } else { //if (tipConv==5) //E2d
      {
        xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(16);
        socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>16</sub> In decimale ' });
      }
    }
  } else if (socket.livello <= saltaLiv[2]) { //b2o
    xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(8);
    socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In decimale ' });
  } else if (socket.livello <= saltaLiv[3]) {
    let decimali = socket.livello - saltaLiv[2];
    let bc = (Math.random() * 100).toString(2) + "00000000";
    xnumgara.get(socket.classe)[socket.livello] = bc.substring(0, bc.indexOf(".") + decimali + 1);
    socketMulticast(gara.get(socket.classe)[socket.livello], 'new_number', { liv: socket.livello, ok: false, msg: 'Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In decimale con . + ' + decimali + 'bit Livello:' });
  } else {
    let decimali = socket.livello - saltaLiv[3];
    let bc = (Math.random() * 100).toString(2);
    bc = (bc.indexOf(".") == -1 ? bc + "." : bc) + "00000000";
    bc = bc.substring(0, bc.indexOf(".") + decimali + 1);
    xnumgara.get(socket.classe)[socket.livello] = parseInt(bc.substring(bc.indexOf(".") + 1), 2) / 2 ** (bc.length - bc.indexOf(".") - 1) + parseInt(bc.substring(0, bc.indexOf(".")), 2)
    //xnumgara.get(socket.classe)[socket.livello] =bc.toString();                        
  }

}

function aggiungi_livello(socket) {
  gara.get(socket.classe).push(new Map());
  //     xnumgara.get(socket.classe).push(Math.pow(2,socket.livello)+Math.floor(Math.random()*Math.pow(2,socket.livello)));
  if (socket.livello <= saltaLiv[0]) { // Genero nuovo numero             
    let tipConv = socket.livello % 6;
    xnumgara.get(socket.classe).push(Math.pow(2, socket.livello) + Math.floor(Math.random() * Math.pow(2, socket.livello)));
    if (tipConv == 1) //b2d
      xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(2);
    else if (tipConv == 3) //o2d
      xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(8);
    else if (tipConv == 5) //E2d
      xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(16);
  } else if (socket.livello <= saltaLiv[2]) { //b2o
    xnumgara.get(socket.classe).push(Math.pow(2, socket.livello) + Math.floor(Math.random() * Math.pow(2, socket.livello)));
    xnumgara.get(socket.classe)[socket.livello] = xnumgara.get(socket.classe)[socket.livello].toString(2);

  } else if (socket.livello <= saltaLiv[3]) { //fb2fd
    let bc = (Math.random() * 100).toString(2) + "00000000";
    xnumgara.get(socket.classe)[socket.livello] = bc.substring(0, bc.indexOf(".") + socket.livello - saltaLiv[2] + 1);
  } else { //fd2fb
    let decimali = socket.livello - saltaLiv[3];
    let bc = (Math.random() * 100).toString(2);
    bc = (bc.indexOf(".") == -1 ? bc + "." : bc) + "00000000";
    bc = bc.substring(0, bc.indexOf(".") + decimali + 1);
    xnumgara.get(socket.classe)[socket.livello] = parseInt(bc.substring(bc.indexOf(".") + 1), 2) / 2 ** (bc.length - bc.indexOf(".") - 1) + parseInt(bc.substring(0, bc.indexOf(".")), 2)
  }
}
function premia(socket) {
  if (socket.livello <= saltaLiv[0]) {
    let tipConv = socket.livello % 6;
    if (tipConv == 0) //d2b
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In binario  per il livello' });
    else if (tipConv == 1) //b2d
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In decimale per il livello' });
    else if (tipConv == 2) //d2o
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In ottale per il livello' });
    else if (tipConv == 3) //o2d
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>8</sub> In decimale per il livello' });
    else if (tipConv == 4) //d2E
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In esadecimale per il livello' });
    else //if (tipConv==5) //E2d
      socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>16</sub> In decimale per il livello' });
  } else if (socket.livello <= saltaLiv[2]) //b2o
    socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In ottale per il livello' });
  else if (socket.livello <= saltaLiv[3])  //fb2d
    socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆🏆🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>2</sub> In decimale con . e + ' + (socket.livello - saltaLiv[1]) + ' bits x Livello:' });
  else //fd2b
    socket.emit('new_number', { liv: socket.livello, ok: true, msg: '🏆🏆🏆🏆&#x270C; Converti ' + xnumgara.get(socket.classe)[socket.livello] + '<sub>10</sub> In BINARIO con . e + ' + (socket.livello - saltaLiv[2]) + ' bits x Livello:' });

}
function aggiorna_iscritti(socket,myid,msg) {
  if (iscritti.get(socket.classe).get(myid)) {
    let iscritto = iscritti.get(socket.classe).get(myid);
    iscritto.punti = socket.punti;
    iscritto.prove = socket.prove;
    iscritto.livello = socket.livello;
    iscritto.classe = socket.classe;
    iscritto.VotoPer4 = (2 * socket.punti - socket.prove);
    fs.writeFile('G' + gare + '_' + socket.classe + '.json', JSON.stringify(Object.fromEntries(iscritti.get(socket.classe)), null, 2), 'utf-8', (err) => {
      if (err) {
        console.error('Errore durante il salvataggio del file:', err);
      } else {
        console.log('Save : ' + gare + '_' + socket.classe + '.json');
      }
    });
  } else { console.log('Non iscritto') }
  console.log('Avviso tutta la classe ');
  let myclass = gara.get(socket.classe)
  for (let i = myclass.length; i > 0;) {
    socketMulticast(gara.get(socket.classe)[--i], 'aggiorna', { liv: socket.livello, username: socket.username, real: socket.real, classe: socket.classe, punti: (2 * socket.punti - socket.prove), message: msg });
  }

  if (socket.prove - socket.punti > 10) {
    socket.emit('banned');
    console.log('BANNED' + socket.real)
  }
}
let numUsers = 0;

io.on('connection', function (socket) {
  let addedUser = false;
  console.log(`Client con ID ${socket.id} connesso.`);
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });
  
      // Quando un messaggio viene ricevuto, il nome utente del client viene recuperato e inviato agli altri partecipanti
  socket.on('message', function (message) {
    let myid = socket.id;
  
    console.log(myid);
    message = ent.encode(message.msg);
    if (condizione(message,socket)) {
      socket.punti += 1 + Math.floor(socket.livello / 8);
      xnumgara.get(socket.classe)[socket.livello] = Math.pow(2, socket.livello) + Math.floor(Math.random() * Math.pow(2, socket.livello + 1));
      // POSIZIONATO CORRETTAMENTE gara.get(socket.classe)[socket.livello].delete(myid);
      // socket.broadcast.emit()
      // socketMulticast(gara.get(socket.classe)[socket.livello],'message', {liv: socket.livello ,username: socket.username, punti: 2*socket.punti+socket.prove , message: "WINNER"});
      console.log(socket.classe + "nuovo #" + xnumgara.get(socket.classe)[socket.livello]);
      gara.get(socket.classe)[socket.livello].delete(myid); // Lo tolgo dalla lista livelli           
      aggiorna_numeri(socket);
      socket.livello++;
      if (gara.get(socket.classe).length == socket.livello) {
        aggiungi_livello(socket);
      }
      gara.get(socket.classe)[socket.livello].set(myid, socket); //aggiungo vincitore al livello
       premia(socket);
    } else {
      message = '&#128169;'.repeat(++socket.prove);
      //  socket.emit('message', {liv: socket.livello ,username: socket.username,real:socket.real ,classe: socket.classe , punti: 2*socket.punti-socket.prove , message: message}); 
    } //aggiungo a contatore errori  
    //socket.broadcast.emit('message', {liv: socket.livello ,username: socket.username,real: socket.real,classe: socket.classe , punti: 2*socket.punti-socket.prove , message: message});


    console.log('Aggiorno iscritti ');
    aggiorna_iscritti(socket,myid,message);
    
    let d1 = new Date();
    if ((d1 - gareInRun[socket.classe]) > (40 * 60 * 1000)) {
      let myclass = gara.get(socket.classe)
      for (let i = myclass.length; i > 0;)
        socketMulticast(gara.get(socket.classe)[--i], 'banned', { liv: socket.livello, username: socket.username, real: socket.real, classe: socket.classe, punti: (2 * socket.punti - socket.prove), message: message });
      console.log('testo')
    }
  });
        
       


  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  socket.on('new_client', function(newname) {     
    let username = ent.encode(newname.username);
    let classe=ent.encode(newname.classe); 
    let myid = socket.id;
    console.log(`Client cID ${myid} `);
    console.log(`${username} si è unito alla clesse ${classe} `);
    if (!gara.has(classe)) {
        // Mappa per tenere traccia dei client connessi
        console.log(`Nuova Classe ${classe}  `);
        gara.set(classe,[new Map()]);
        gareInWait[classe]= 30;
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
    console.log("classe:"+classe+" iscritti "+iscritti.get(classe).size+" livello 0 "+gara.get(classe)[0].size);
    socketMulticast(gara.get(socket.classe)[0],'new_client',{username:socket.username,classe:socket.classe,real:socket.real, punti:0});
//        socket.broadcast.emit('new_client', {username:socket.username,classe:socket.classe,real:socket.real, punti:0});
 //   socket.emit('new_client', {username:socket.username,classe:socket.classe,real:socket.real, punti:0});
    socket.emit('gara',gare);
    socket.emit('avatar', {username:socket.username, real:socket.real});
    socket.emit('new_number',{ liv:socket.livello, msg :'Converti '+xnumgara.get(socket.classe)[socket.livello]+'<sub>10</sub> In binario '});
});

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
  
});
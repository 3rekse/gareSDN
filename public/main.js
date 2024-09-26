/* global io */

$(function() {
  let FADE_TIME = 150; // ms
  let TYPING_TIMER_LENGTH = 400; // ms
  let COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  const $window = $(window);
  let $classeInput = $('#classeInput'); // Input for username
  let $usernameInput = $('#usernameInput'); // Input for username
  $usernameInput.hide();
  let $messages = $('.messages'); // Messages area
  let $inputMessage = $('#inputMessage'); // Input message input box
  let $url = $('#url');
 
  let $chat_form= $('#chat_form');
  $chat_form.hide()
  let $loginPage = $('.login.page'); // The login page
  let $chatPage = $('.chat_page'); // The chatroom page
  let $gara = $('#gara');

  const $canvas = $('#myCanvas')[0];
  const context = $canvas.getContext("2d");
  let livello = 0;
  $url.hide();


  // Prompt for setting a username
  let username;
  let classe;
  let connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $classeInput.focus();

  let socket = io({autoConnect: false});

  function drawCharacter() {
    context.clearRect(0, 0, $canvas.width, $canvas.height);
    context.font = "60px Arial";
    context.textAlign = "center";  // Centra il testo orizzontalmente
    context.textBaseline = "middle";  // Centra il testo verticalmente
    context.fillText(String.fromCodePoint(127789 + Math.floor(Math.random() * 100), 127789 + Math.floor(Math.random() * 100), 127789 + Math.floor(Math.random() * 100), 127789 + Math.floor(Math.random() * 100)), $canvas.width / 2, $canvas.height / 2);
  }

  function addParticipantsMessage (data) {
    let message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  function setClasse () {
        classe = cleanInput($classeInput.val().trim());
    
        // If the class is valid
        if (classe) {  
          $('#titolo').text('Inserisci il tuo username');
          $('#top').text(classe + ' Challeng');
          $classeInput.hide();
          $usernameInput.show();
          $currentInput = $usernameInput.focus();
        }
  }
  
  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      socket.connect();
      socket.on('connect', function() {
        // Tell the server your username
      console.log('Connessione stabilita!');
      socket.emit('add user', username);
      socket.emit('new_client', {username:username, classe:classe});
      document.title = classe + ' - ' + document.title;

      });
    }
  }

  // Sends a chat message
  function sendMessage () {
    let message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message',"liv:" + livello +"msg: "+message); // Sends the message to the others
      
      socket.emit('message',{liv:livello,msg: message}); 
      $('#boardr').prepend('<p><strong>\u25BA </strong> ' + message + '</p>');
                  
               // insertMessage(username, message); // Also displays the message on our page
                $('#message').val('').focus(); // Empties the chat form and puts the focus back on it
    }
  }

  // Log a message
  function log (message, options) {
    let $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    let $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    let $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    let $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    let typingClass = data.typing ? 'typing' : '';
    let $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    let $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        let typingTimer = (new Date()).getTime();
        let timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    let hash = 7;
    for (let i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    let index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (classe) {
                if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
                } else {
                setUsername();
                }
            } else {setClasse();}
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  function insertMessage(username,real, message,punti) {
    $('#boardr').prepend('<p><strong>' + username + '</strong> '+real+' ' + message +' Punti:'+punti +'</p>');
}

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    let message = "Welcome to Omarillos Challenge – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('down',function (data){
    console.log("down "+data);
    context.clearRect(0, 0, $canvas.width, $canvas.height);
    // Disegna il cerchio
    context.beginPath();
    context.arc($canvas.width/2,  $canvas.height/2, 60, 0, 2 * Math.PI, false);
  context.stroke();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = "80px Arial";
    context.fillText(data, $canvas.width/2, $canvas.height/2);
    
    if(data==0){
      $chat_form.show();
      $url.hide();
      $currentInput = $inputMessage.focus();
      setInterval(drawCharacter, 5000);
    }
    
  });
  socket.on('gara',function (data){ 
    $gara.text('# '+data);
    console.log("gara "+data);
  });

  socket.on('avatar', function(username) {
    $('#avatar').text('Avatar :'+username.username+''+username.real);
    $("#url").show();
  })
  socket.on('new_number', function(num) {
    if(num.ok) {livello++;}
    if(num.liv===livello)
        {$('#boardn').html('<p class="margineZero"><em>' + num.msg+ ' </em>'+num.liv+'</p>');}
   else {$('#boardn').html('<p class="margineZero">' + num.msg+ ' '+num.liv+'</p>');}
  });
  socket.on('aggiorna', function(data) {
    console.log('aggiorna '+data);
    console.log('$$$$'+data.real+'$$$$$');
    if (data.liv==livello) {
      insertMessage(data.username, data.real , data.message,data.punti);}
      let poz=(0>data.punti?0:data.punti);
      if (!$(`#${poz}`).length) {
        if (!$(`#${poz-1}`).length) {$('#ol').prepend(`<li id=${poz-1}></li>`);}
          $('#ol').prepend(`<li id=${poz}></li>`);
      } 
      if (!$(`#${data.username}`).length){ 
        $(`#${poz}`).prepend('<p id='+data.username+'>'+data.username+' '+ data.real+ ' <span id=pnt'+data.username+'>'+data.punti/4+'</span></p>');
      }else{
        $(`#${data.username}`).appendTo(`#${poz}`);
        $(`#${"pnt"+data.username}`).text(`${data.punti/4}`);
      }
  });
});
#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
charset="utf-8";
var log = {message: ""};

// Game Data
var serverData = new GameData('game');
var handshake = new GameData('handshake');
var users = [];
var userID = 0;
var enemyID = 0;
var spawnX = 400;
var spawnY = 300;
var enemyDead = true;
var playerImage = -1;

/******************************************************/
// Classes
/******************************************************/

function vector2(X, Y)
{
    this.x = X;
    this.y = Y;

    // Set current vector equal to passed vector
    this.set = function(vect)
    {
        this.x = vect.x;
        this.y = vect.y;
    }
    
    // Returns sum of current vector and passed vector
    this.add = function(vect)
    {
        var newVec = new vector2(this.x + vect.x, this.y + vect.y);
        return newVec;
    }
    
    // Returns difference of current vector and passed vector
    this.sub = function(vect)
    {
        var newVec = new vector2(this.x - vect.x, this.y - vect.y);
        return newVec;
    }
    
    // Returns product of current vector and passed vector
    this.mult = function(vect)
    {
        var newVec = new vector2(this.x * vect.x, this.y * vect.y);
        return newVec;
    }
    
    // Returns dot product of current vector and passed vector
    this.dot = function(vect)
    {
        return (this.x * vect.x) + (this.y * vect.y);
    }
    
    // Returns quotient of current vector and scalar value
    this.scalMult = function(scal)
    {
        var newVec = new vector2(this.x * scal, this.y * scal);
        return newVec;
    }
    
    // Returns magnitude of current vector
    this.magnitude = function()
    {
        var mag = Math.sqrt((this.x * this.x + this.y * this.y));
        return mag;
    }
    
    // Returns vector that is between current vector and passed vector, where second parameter is percentage distance between both vectors
    // (Linear interpolation between 2 vectors)
    this.lerp = function(vect, scal)
    {
        var temp = new vector2(this.x, this.y);
        var temp2 = new vector2(vect.x, vect.y);
        temp.set(temp.sub(temp2));
        temp.set(temp.scalMult(scal));
        temp.set(temp.add(temp2));
        return temp;
    }
    
    // Returns distance between current vector and passed vector
    this.distance = function(vect)
    {
        var temp = new vector2(vect.x, vect.y);
        var curVec = new vector2(this.x, this.y);
        temp.set(temp.sub(curVec));

        return Math.sqrt(temp.x * temp.x + temp.y * temp.y);
    }
    
    // Returns angle in degrees between current vector and passed vector
    this.angleDegrees = function(vect)
    {
        var angle = Math.atan2((-1 * (vect.y - this.y)), (vect.x - this.x));
        angle = angle / Math.PI * 180;
        return -1 * (angle);
    }
    
    // Returns angle in radians between current vector and passed vector
    this.angleRad = function(vect)
    {
        var angle = Math.atan2((-1 * (vect.y - this.y)), (vect.x - this.x));
        return -1 * (angle);
    }
    
    // Returns normalized version of current vector
    this.normalize = function()
    {
        var mag = this.magnitude();
        var newVec = new vector2(this.x / mag, this.y / mag);
        return newVec;
    }

    // Returns boolean indicating if current vector and passed vector are equal
    this.equal = function(vect)
    {
        if(this.x == vect.x && this.y == vect.y)
        {
            return true;
        }
        return false;
    }
}
   
function Missile(Speed, X, Y, dmg, ID)
{
    this.posX = X;
    this.posY = Y - 10;
    this.speed = Speed;
    this.width = 32;
    this.height = 32;
    this.life = 1;
    this.damage = dmg;
    this.id = ID;
    this.tileX = 0;
    this.tileY = 64;
    this.tileWidth = 32;
    this.tileHeight = 32;
    this.tarX = TarX;
    this.tarY = TarY;
    this.vector = new vector2(this.tarX - this.posX, this.tarY - this.posY);
    this.vector.set(this.vector.normalize());
    this.acc = 1;
}
    
function Player(ID, Remote_ID)
{
    this.posX = spawnX;
    this.posY = spawnY;
    this.width = 25;
    this.height = 25;
    this.id = ID;
    this.remoteID = Remote_ID;
    this.missiles = [];
    this.tileWidth = 32;
    this.tileHeight = 32;
    this.tileID = getPlayerImage();
    this.chassisVector = new vector2(this.posX - this.posX, (this.posY - 10) - this.posY);
    this.chassisVector.set(this.chassisVector.normalize());
    this.turretVector = new vector2(this.posX - this.posX, (this.posY + 10) - this.posY);
    this.turretVector.set(this.turretVector.normalize());
    this.speed = 5;
    this.acc = 1;
    
    this.acc = 1;
    if(this.tileID < 3)
    {
        this.tileX = (this.tileID * 2) * this.tileWidth;
        this.tileY = 0;
    }
    else
    {
        this.tileX = ((this.tileID - 3) * 2) * this.tileWidth;
        this.tileY = this.tileHeight;
    }
}

function GameData(Type)
{
    this.type = Type;
    this.players = {};
    this.enemies = [];
    if(this.type == 'handshake')
    {
        this.newID;
    }
}

function Enemy(ID)
{
    this.posX = spawnX;
    this.posY = spawnY;
    this.width = 25;
    this.height = 25;
    this.life = 1;
    this.id = ID;
}

/******************************************************/

/******************************************************/
// Game Functions
/******************************************************/ 
function initialization()
{
    generateEnemies(5);
}

function generateEnemies(numEnemies)
{
    for(var i = 0; i < numEnemies; i++)
    {
        var enemy = createNewEnemy()
        serverData.enemies.push(enemy);
        handshake.enemies.push(enemy);
    }
}

function createNewEnemy()
{
    enemyID += 1;
    enemy = new Enemy(enemyID);
    enemy.posX = Math.floor(Math.random() * 300) + 50;
    enemy.posY = Math.floor(Math.random() * 200) + 50;
    return enemy;
}

function processData(clientData, Remote_ID)
{
    serverData.players[clientData.player.id] = clientData.player;
    serverData.players[clientData.player.id].remoteID = Remote_ID;
    
}

function popArray(Array, popThis)
{
    for(var i = popThis; i < Array.length - 1; i++)
    {
        Array[i] = Array[i + 1];
    }
    Array.pop();
}

function createNewPlayer(Remote_ID)
{
    userID += 1;
    player = new Player(userID, Remote_ID);
    serverData.players[userID] = player;
    handshake.newID = player.id;
    handshake.players[userID] = player;
}

function getPlayerImage()
{
    playerImage++;
    if(playerImage > 5)
    {
        playerImage = 0;
    }
    return playerImage;
}

/******************************************************/ 

/******************************************************/
// Server Functions
/******************************************************/ 
var server = http.createServer(function(request, response)
{
    var date = new Date();
    console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() +
                ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(24654, function()
{
    var date = new Date();
    console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() +
                ' Server is listening on port 24654');
    initialization();
});

wsServer = new WebSocketServer(
{
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin)
{
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function(request)
{
    var date = new Date();
    if (!originIsAllowed(request.origin))
    {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() +
                    ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('game-connection', request.origin);
    console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() +
                ' Peer ' + connection.remoteAddress + ': Connection accepted.');
    
    connection.on('message', function(message)
    {
        if (message.type === 'utf8')
        {
            var e = JSON.parse(message.utf8Data);
            
            //******************************************************
            //				  Events received
            //******************************************************
            
            if(e.type == "game")
            {
                //Normal game data exchange. User is sent back the updated game data.
                processData(e, connection.remoteAddress);
                connection.send(JSON.stringify(serverData));
            }
            else if(e.type == "handshake")
            {
                //Initial Server connection. Sends the user a handshake
                createNewPlayer(connection.remoteAddress);
                connection.send(JSON.stringify(handshake));
            }
            else
            {
                console.log("Message is of unknown type");
                console.log(e);
            }
            
            //******************************************************
            //				End Events received
            //******************************************************
        }
        else if (message.type === 'binary')
        {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes at: ' +
                        date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
            connection.sendBytes(message.binaryData);
        }
    });
    
    connection.on('close', function(reasonCode, description)
    {
        for (var pID in serverData.players)
        {
            if(serverData.players.hasOwnProperty(pID))
            {
                if(serverData.players[pID].remoteID == connection.remoteAddress)
                {
                    delete serverData.players[pID];
                }
            }
        }
        var date = new Date();
        console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() +
                    ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    
    users.push(connection);
});

/******************************************************/ 
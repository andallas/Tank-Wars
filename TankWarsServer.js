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

function Vector(startX, startY, endX, endY)
{
    this.dirX = endX - startX;
    this.dirY = endY - startY;
    this.length = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
    this.velX = this.dirX / this.length;
    this.velY = this.dirY / this.length;
    
    this.update = function(startX, startY, endX, endY)
    {
        this.dirX = endX - startX;
        this.dirY = endY - startY;
        this.length = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
        this.velX = this.dirX / this.length;
        this.velY = this.dirY / this.length;
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
    this.vector = new Vector(this.posX, this.posY, this.tarX, this.tarY);
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
    this.chassisVector = new Vector(this.posX, this.posY, this.posX, this.posY + 10);
    this.turretVector = new Vector(this.posX, this.posY, this.posX, this.posY + 10);
    this.turretAngle = 0;
    this.speed = 25;
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
    console.log(this.tileID);
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
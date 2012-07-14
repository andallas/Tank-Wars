function Game()
{
    this.gameLoop = null;
    var self = this;
    var keyPressed;
    
    // Connection settings
    var socket;
    var connected = false;
    var sentConnectRequest = false;
    var serverUpdate = false;
    
    // Object variables
    missileID = 0;
    var guiText = [];
    
    // Scene management
    
    // Timing
    var prevTime = Date.now();
    var delta = 0;
    var elapsedTime = 0;
    var frame = 0;
    var FPS = 0;
    var tickTime = 0;
    var ticks = 1;
    var seconds = 0;
    var paused = false;

    // Context
    var _canvas = null;
    var _buffer = null;
    var canvas = null;
    var buffer = null;

    // Resources
        // Audio
        
        // Graphics
        var players;
        players = new Image();
        players.src = ('Graphics/players.png');
    
    // Input
    var mouseX = 0;
	var mouseY = 0;
    var mouseClick = 0;
    var mouseDown = false;
    
    var Keys = [0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0];
	
      
    var keysDown = {};

    addEventListener("keydown", function(e)
    {
        keysDown[e.keyCode] = true;
        keyPressed = e.keyCode;
    }, false);

    addEventListener("keyup", function(e)
    {
        keysDown[e.keyCode] = false;
    }, false);
	
	addEventListener("mousemove", function(e)
    {
        getMousePos(_canvas, e);
    }, false);
    
    addEventListener("click", doMouseClick, false);
    
    addEventListener("mousedown", doMouseDown, false);
    
    addEventListener("mouseup", doMouseUp, false);
    
    function getMousePos(canvas, evt)
	{
		// get canvas position
		var obj = canvas;
		var top = 0;
		var left = 0;
		while (obj && obj.tagName != 'BODY')
        {
			top += obj.offsetTop;
			left += obj.offsetLeft;
			obj = obj.offsetParent;
		}
	 
		// return relative mouse position
		mouseX = evt.clientX - left + window.pageXOffset;
		mouseY = evt.clientY - top + window.pageYOffset;
	}
    
    function doMouseClick(e)
    {
        mouseClick = true;
    }
    
    function doMouseDown(e)
    {
        mouseDown = true;
    }
    
    function doMouseUp(e)
    {
        mouseDown = false;
    }
    
    /******************************************************/
    // Classes
    /******************************************************/  

    function Vector(startX, startY, endX, endY)
    {
        this.vX = endX;
        this.vY = endY
        this.lenX = this.vX - startX;
        this.lenY = this.vY - startY;
        this.mag = Math.sqrt(this.lenX * this.lenX + this.lenY * this.lenY);
        this.velX = this.lenX / this.mag;
        this.velY = this.lenY / this.mag;
        
        this.dot = function(vector)
        {
            return (this.velX * vector.velX) + (this.velY * vector.velY);
        }
        
        this.angle = function(dot, vector)
        {
            return Math.acos(dot / (this.mag * vector.mag));
        }
        
        this.update = function(startX, startY, endX, endY)
        {
            this.vX = endX;
            this.vY = endY
            this.lenX = this.vX - startX;
            this.lenY = this.vY - startY;
            this.mag = Math.sqrt(this.lenX * this.lenX + this.lenY * this.lenY);
            this.velX = this.lenX / this.mag;
            this.velY = this.lenY / this.mag;
        }
    }
    
    function Missile(Speed, X, Y, TarX, TarY, dmg, ID)
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
        
        this.update = function(i)
        {
			if(this.posX < 0 ||
               this.posX > buffer.width ||
               this.posY < 0 ||
               this.posY > buffer.height)
            {
                self.popArray(clientData.player.missiles, i);
            }
            
            this.posX += this.vector.velX * ((this.speed + this.acc) * delta);
            this.posY += this.vector.velY * ((this.speed + this.acc) * delta);
            this.acc += 10;
            if(this.acc >= 200)
            {
                this.acc = 200;
            }
            
            //this.posY -= this.speed * delta;
            this.x1 = this.posX;
            this.y1 = this.posY - (this.height / 2);
            this.x2 = this.posX - (this.width / 2);
            this.y2 = this.posY + (this.height / 2);
            this.x3 = this.posX + (this.width / 2);
            this.y3 = this.posY + (this.height / 2);
        }
    }
    
    function Player(X, Y, ID)
    {
        this.posX = X;
        this.posY = Y;
        this.width = 32;
        this.height = 32;
        this.life = 1;
        this.id = ID;
        this.remoteID;
        this.missiles = [];
        this.tileID;
        this.tileX;
        this.tileY;
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.chassisVector = new Vector(this.posX, this.posY, this.posX, this.posY - 10);
        this.turretVector = new Vector(this.posX, this.posY, this.posX, this.posY + 10);
        this.turretAngle = 0;
        this.speed = 25;
        this.acc = 1;
        
        this.isAlive = function()
        {
            return (this.life > 0);
        }
        
        this.update = function()
        {
            this.turretVector.update(this.posX, this.posY, mouseX, mouseY);
            
            // Input
			if(Keys[0] != 0)
			{
                this.chassisVector.update(this.posX, this.posY, this.posX, this.posY - this.speed);
                this.posY += this.chassisVector.velY * ((this.speed + this.acc) * delta);
			}
			if(Keys[2] != 0)
			{
                this.chassisVector.update(this.posX, this.posY, this.posX, this.posY + this.speed);
                this.posY += this.chassisVector.velY * ((this.speed + this.acc) * delta);
			}
			if(Keys[1] != 0)
			{
                this.chassisVector.update(this.posX, this.posY, this.posX - this.speed, this.posY);
                this.posX += this.chassisVector.velX * ((this.speed + this.acc) * delta);
			}
			if(Keys[3] != 0)
			{
                this.chassisVector.update(this.posX, this.posY, this.posX + this.speed, this.posY);
                this.posX += this.chassisVector.velX * ((this.speed + this.acc) * delta);
			}
            if(mouseClick == true)
            {
                this.shoot();
                mouseClick = false;
            }
            
            if(Keys[0] == 0 && Keys[1] == 0 && Keys[2] == 0 && Keys[3] == 0)
            {
                this.acc = 0;
            }
            else
            {
                this.acc += 0.5;
            }
            
            if(this.acc >= 98)
            {
                this.acc = 98;
            }
        }
        
        this.shoot = function()
        {            
            missile = new Missile(20, this.posX, this.posY - 10, mouseX, mouseY, 1, missileID);
            missileID++;
            if(missileID > 500)
            {
                missileID = 0;
            }
            this.missiles.push(missile);
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

    function GameData(Type)
    {
        this.type = Type;
        if(this.type == 'game' || this.type == 'disconnect')
        {
            this.player = player;
            this.players = {};
            this.enemies = [];
        }
        
        this.drawPlayer = function()
		{
            // Draw Chassis
            buffer.drawImage(players,
                             this.player.tileX,
                             this.player.tileY,
                             this.player.tileWidth,
                             this.player.tileHeight,
                             this.player.posX,
                             this.player.posY,
                             this.player.width,
                             this.player.height);

            // Draw Turret
            var targetVector = new Vector(this.player.posX, this.player.posY, mouseX, mouseY);
            var dot = this.player.turretVector.dot(targetVector);
            var targetAngle = this.player.turretVector.angle(dot, targetVector) * (Math.PI / 180);
            
            if(!isNaN(targetAngle))
            {
                while(this.player.turretAngle > 360)
                {
                    this.player.turretAngle -= 360;
                }
                while(this.player.turretAngle < 0)
                {
                    this.player.turretAngle += 360;
                }
                
                    this.player.turretAngle += targetAngle * 10;
                
                console.log(this.player.turretAngle);
            }
            
            buffer.save();
            buffer.translate(this.player.posX + this.player.width / 2, this.player.posY + this.player.height / 2);
            buffer.rotate(this.player.turretAngle);
            buffer.drawImage(players,
                             this.player.tileX + 32,
                             this.player.tileY,
                             this.player.tileWidth,
                             this.player.tileHeight,
                             -this.player.width / 2,
                             -this.player.height / 2,
                             this.player.width,
                             this.player.height);
            buffer.restore();

            // Draw Missiles
            for(var i = 0; i < this.player.missiles.length; i++)
            {
                buffer.drawImage(players,
                             this.player.missiles[i].tileX,
                             this.player.missiles[i].tileY,
                             this.player.missiles[i].tileWidth,
                             this.player.missiles[i].tileHeight,
                             this.player.missiles[i].posX,
                             this.player.missiles[i].posY,
                             this.player.missiles[i].width,
                             this.player.missiles[i].height);
            }
		}
        
        this.drawServerPlayers = function(id)
        {
            buffer.drawImage(players,
                             this.players[id].tileX,
                             this.players[id].tileY,
                             this.players[id].tileWidth,
                             this.players[id].tileHeight,
                             this.players[id].posX,
                             this.players[id].posY,
                             this.players[id].width,
                             this.players[id].height);
            
            // Draw Missiles
            for(var i = 0; i < this.players[id].missiles.length; i++)
            {
                buffer.drawImage(players,
                             this.players[id].missiles[i].tileX,
                             this.players[id].missiles[i].tileY,
                             this.players[id].missiles[i].tileWidth,
                             this.players[id].missiles[i].tileHeight,
                             this.players[id].missiles[i].posX,
                             this.players[id].missiles[i].posY,
                             this.players[id].missiles[i].width,
                             this.players[id].missiles[i].height);
            }
        }
        
        this.drawServerEnemies = function()
		{
            for(var i = 0; i < this.enemies.length; i++)
            {
                buffer.beginPath();
                    buffer.fillStyle = "rgb(255, 0, 0)";
                    buffer.fillRect(this.enemies[i].posX - (this.enemies[i].width / 2), this.enemies[i].posY - (this.enemies[i].height / 2), this.enemies[i].width, this.enemies[i].height);
                buffer.closePath();
            }
		}
    }
    
    function GUIText(Text, X, Y, fStyle, aX, aY, R, G, B, A)
    {
        this.text = Text;
        this.x = X;
        this.y = Y;
		this.fontStyle = fStyle;
		this.alignX = aX;
		this.alignY = aY;
		this.color = new Color(R, G, B, A);
        this.fadeIn = false;
    }
    
    function Color(Red, Green, Blue, Alpha)
    {
        this.r = Red;
        this.g = Green;
        this.b = Blue;
        this.a = Alpha;
        
        
        this.toString = function()
        {
            return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
        }
    }
    
    /******************************************************/

    /******************************************************/
    // Global Functions
    /******************************************************/  
    
    this.popArray = function(Array, popThis)
    {
        for(var i = popThis; i < Array.length - 1; i++)
        {
            Array[i] = Array[i + 1];
        }
        Array.pop();
    }
    
    this.Collision = function(Shot, Target)
    {
        if(
           ((Shot.posY - Shot.height / 2) <= (Target.posY + Target.height / 2) &&
           (Shot.posY + Shot.height / 2) >= (Target.posY - Target.height / 2))
          )
        {
            if(
               ((Shot.posX - Shot.width / 2) <= (Target.posX + Target.width / 2) &&
               (Shot.posX + Shot.width / 2) >= (Target.posX - Target.width / 2))
              )
            {
                return true;
            }
            return false;
        }
        return false;
    }
    
    this.PlayerCollision = function(Player, Target)
    {
        if(
           ((Player.posY - Player.height / 2) <= (Target.posY + Target.height / 3) &&
           (Player.posY + Player.height / 2) >= (Target.posY - Target.height / 3))
          )
        {
            if(
               ((Player.posX - Player.width / 2) <= (Target.posX + Target.width / 3) &&
               (Player.posX + Player.width / 2) >= (Target.posX - Target.width / 3))
              )
            {
                return true;
            }
            return false;
        }
        return false;
    }
    
    this.levelBoundingCheck = function(Object)
	{
		if(Object.posY - Object.height / 2 < 0){Object.posY = Object.height / 2;}
		if(Object.posY + Object.height / 2 > _buffer.height){Object.posY = _buffer.height - Object.height / 2;}
		if(Object.posX - Object.width / 2 < 0){Object.posX = Object.width / 2;}
		if(Object.posX + Object.width / 2 > _buffer.width){Object.posX = _buffer.width - Object.width / 2;}
	}
    
    /******************************************************/  
    
    /******************************************************/
    // Initialization
    /******************************************************/

    this.Init = function(contents)
    {
        // Initialize connection
        self.initConnection();
        
        // Initialize canvas
        _canvas = document.getElementById('canvas');
        if(_canvas && _canvas.getContext)
        {
            canvas = _canvas.getContext('2d');

            _buffer = document.createElement('canvas');
            _buffer.width = _canvas.width;
            _buffer.height = _canvas.height;
            buffer = _buffer.getContext('2d');

            buffer.strokeStyle = "rgb(255, 255, 255)";
            buffer.fillStyle = "rgb(255, 255, 255)";
            buffer.font = "bold 25px sans-serif";
        }
        
        // Initialize GUI text
        guiText[0] = new GUIText("Connecting...", _canvas.width / 2, _canvas.height / 2 - 100, 
                                     "28px Helvetica", "center", "top", 109, 192, 103, 0);
        guiText[0].fadeIn = true;
    }
    
    this.initConnection = function()
    {
        var url = "ws://localhost:24654";
        socket = new WebSocket(url, "game-connection");
        status.textContent = "Not Connected";
        
        socket.addEventListener("open", function(event)
        {
            if(!connected)
            {
                if(!sentConnectRequest)
                {
                    sentConnectRequest = true;
                    var handshake = new GameData('handshake');
                    socket.send(JSON.stringify(handshake));
                }
                else
                {
                    console.log("Already connected");
                }
            }
        });

        // Display messages received from the server
        socket.addEventListener("message", function(event)
        {
            var e = JSON.parse(event.data);
            if(e.type == "game")
            {
                clientData.players = e.players;
                clientData.enemies = e.enemies;
            }
            else if(e.type == "handshake")
            {
                console.log("Connected");
                connected = true;
                
                player = new Player(400, 300, 0);
                clientData = new GameData('game');
                self.createNewPlayer(e.players[e.newID]);
                clientData.player.id = e.newID;
                clientData.enemies = e.enemies;
            }
            else
            {
                console.log("Message is of unknown type");
                console.log(e);
            }
        });

        // Display any errors that occur
        socket.addEventListener("error", function(event)
        {
            console.log("Error: " + event);
        });

        socket.addEventListener("close", function(event)
        {
            console.log("Not Connected");
            connected = false;
            socket.close();
        });
    }

    this.createNewPlayer = function(newPlayer)
    {
        clientData.player.posX = newPlayer.posX;
        clientData.player.posY = newPlayer.posY;
        clientData.player.remoteID = newPlayer.remoteID;
        clientData.player.missiles = newPlayer.missiles;
        clientData.player.tileID = newPlayer.tileID;
        clientData.player.tileX = newPlayer.tileX;
        clientData.player.tileY = newPlayer.tileY;
        clientData.player.turretAngle = newPlayer.turretAngle;

        clientData.player.chassisVector.dirX = newPlayer.chassisVector.dirX;
        clientData.player.chassisVector.dirY = newPlayer.chassisVector.dirY;
        clientData.player.chassisVector.length = newPlayer.chassisVector.length;
        clientData.player.chassisVector.velX = newPlayer.chassisVector.velX;
        clientData.player.chassisVector.velY = newPlayer.chassisVector.velY;
        clientData.player.chassisVector.update();
        
        clientData.player.turretVector.dirX = newPlayer.turretVector.dirX;
        clientData.player.turretVector.dirY = newPlayer.turretVector.dirY;
        clientData.player.turretVector.length = newPlayer.turretVector.length;
        clientData.player.turretVector.velX = newPlayer.turretVector.velX;
        clientData.player.turretVector.velY = newPlayer.turretVector.velY;
        clientData.player.turretVector.update();
        
        clientData.player.speed = newPlayer.speed;
        clientData.player.acc = newPlayer.acc;
    }
    
    /******************************************************/

    /******************************************************/
    // Update
    /******************************************************/
    this.Update = function()
    {
        if(connected)
        {
            // Input
            self.doInput();
            
            // Update objects
            if(clientData.player.isAlive())
            {
                self.levelBoundingCheck(clientData.player);
                clientData.player.update();
            }
            
            for(var i = 0; i < clientData.enemies.length; i++)
            {
                if(clientData.enemies[i].life <= 0)
                {
                    self.popArray(clientData.enemies, i);
                }
                
                if(self.PlayerCollision(clientData.player, clientData.enemies[i]))
                {
                    clientData.enemies[i].life = 0;
                }
                
                for(var j = 0; j < clientData.player.missiles.length; j++)
                {
                    if(self.Collision(clientData.player.missiles[j], clientData.enemies[i]))
                    {
                        self.popArray(clientData.player.missiles, j);
                        clientData.enemies[i].life = 0;
                    }
                }
            }
            
            for(var i = 0; i < clientData.player.missiles.length; i++)
            {
                clientData.player.missiles[i].update(i);
            }
            /*
            for(var i = 0; i < clientData.enemies.length; i++)
            {
                for(var j = 0; j < clientData.player.missiles.length; j++)
                {
                    if(self.Collision(clientData.player.missiles[j], clientData.enemies[i]))
                    {
                        self.popArray(clientData.player.missiles, j);
                        self.popArray(clientData.enemies, i);
                    }
                }
            }
            */
            if(serverUpdate)
            {
                socket.send(JSON.stringify(clientData));
                serverUpdate = false;
            }
        }
    }

    this.doInput = function()
    {
		//Do Keyboard Input
        if(keysDown[38] == true || keysDown[87] == true) // W || Up
        {if(Keys[0] == 0){Keys[0] = 1;}else if(Keys[0] == 1 || Keys[0] == 2){Keys[0] = 2;}}else if(keysDown[38] == false || keysDown[87] == false){if(Keys[0] == 1 || Keys[0] == 2){Keys[0] = 0;}}
        
        if(keysDown[37] == true || keysDown[65] == true) // A || Left
        {if(Keys[1] == 0){Keys[1] = 1;}else if(Keys[1] == 1 || Keys[1] == 2){Keys[1] = 2;}}else if(keysDown[37] == false || keysDown[65] == false){if(Keys[1] == 1 || Keys[1] == 2){Keys[1] = 0;}}

        if(keysDown[40] == true || keysDown[83] == true) // S || Down
        {if(Keys[2] == 0){Keys[2] = 1;}else if(Keys[2] == 1 || Keys[2] == 2){Keys[2] = 2;}}else if(keysDown[40] == false || keysDown[83] == false){if(Keys[2] == 1 || Keys[2] == 2){Keys[2] = 0;}}

        if(keysDown[39] == true || keysDown[68] == true) // D || Right
        {if(Keys[3] == 0){Keys[3] = 1;}else if(Keys[3] == 1 || Keys[3] == 2){Keys[3] = 2;}}else if(keysDown[39] == false || keysDown[68] == false){if(Keys[3] == 1 || Keys[3] == 2){Keys[3] = 0;}}

        if(keysDown[81] == true) // Q
        {if(Keys[4] == 0){Keys[4] = 1;}else if(Keys[4] == 1 || Keys[4] == 2){Keys[4] = 2;}}else if(keysDown[81] == false){if(Keys[4] == 1 || Keys[4] == 2){Keys[4] = 0;}}
        
        if(keysDown[69] == true) // E
        {if(Keys[5] == 0){Keys[5] = 1;}else if(Keys[5] == 1 || Keys[5] == 2){Keys[5] = 2;}}else if(keysDown[69] == false){if(Keys[5] == 1 || Keys[5] == 2){Keys[5] = 0;}}

        if(keysDown[48] == true) // 0
        {if(Keys[6] == 0){Keys[6] = 1;}else if(Keys[6] == 1 || Keys[6] == 2){Keys[6] = 2;}}else if(keysDown[48] == false){if(Keys[6] == 1 || Keys[6] == 2){Keys[6] = 0;}}

        if(keysDown[49] == true) // 1
        {if(Keys[7] == 0){Keys[7] = 1;}else if(Keys[7] == 1 || Keys[7] == 2){Keys[7] = 2;}}else if(keysDown[49] == false){if(Keys[7] == 1 || Keys[7] == 2){Keys[7] = 0;}}

        if(keysDown[50] == true) // 2
        {if(Keys[8] == 0){Keys[8] = 1;}else if(Keys[8] == 1 || Keys[8] == 2){Keys[8] = 2;}}else if(keysDown[50] == false){if(Keys[8] == 1 || Keys[8] == 2){Keys[8] = 0;}}

        if(keysDown[51] == true) // 3
        {if(Keys[9] == 0){Keys[9] = 1;}else if(Keys[9] == 1 || Keys[9] == 2){Keys[9] = 2;}}else if(keysDown[51] == false){if(Keys[9] == 1 || Keys[9] == 2){Keys[9] = 0;}}

        if(keysDown[52] == true) // 4
        {if(Keys[10] == 0){Keys[10] = 1;}else if(Keys[10] == 1 || Keys[10] == 2){Keys[10] = 2;}}else if(keysDown[52] == false){if(Keys[10] == 1 || Keys[10] == 2){Keys[10] = 0;}}

        if(keysDown[53] == true) // 5
        {if(Keys[11] == 0){Keys[11] = 1;}else if(Keys[11] == 1 || Keys[11] == 2){Keys[11] = 2;}}else if(keysDown[53] == false){if(Keys[11] == 1 || Keys[11] == 2){Keys[11] = 0;}}

        if(keysDown[54] == true) // 6
        {if(Keys[12] == 0){Keys[12] = 1;}else if(Keys[12] == 1 || Keys[12] == 2){Keys[12] = 2;}}else if(keysDown[54] == false){if(Keys[12] == 1 || Keys[12] == 2){Keys[12] = 0;}}

        if(keysDown[55] == true) // 7
        {if(Keys[13] == 0){Keys[13] = 1;}else if(Keys[13] == 1 || Keys[13] == 2){Keys[13] = 2;}}else if(keysDown[55] == false){if(Keys[13] == 1 || Keys[13] == 2){Keys[13] = 0;}}

        if(keysDown[56] == true) // 8
        {if(Keys[14] == 0){Keys[14] = 1;}else if(Keys[14] == 1 || Keys[14] == 2){Keys[14] = 2;}}else if(keysDown[56] == false){if(Keys[14] == 1 || Keys[14] == 2){Keys[14] = 0;}}

        if(keysDown[57] == true) // 9
        {if(Keys[15] == 0){Keys[15] = 1;}else if(Keys[15] == 1 || Keys[15] == 2){Keys[15] = 2;}}else if(keysDown[57] == false){if(Keys[15] == 1 || Keys[15] == 2){Keys[15] = 0;}}

        if(keysDown[32] == true) // Space
        {if(Keys[16] == 0){Keys[16] = 1;}else if(Keys[16] == 1 || Keys[16] == 2){Keys[16] = 2;}}else if(keysDown[32] == false){if(Keys[16] == 1 || Keys[16] == 2){Keys[16] = 0;}}
        
        if(keysDown[27] == true) // Escape
        {if(Keys[17] == 0){Keys[17] = 1;}else if(Keys[17] == 1 || Keys[17] == 2){Keys[17] = 2;}}else if(keysDown[27] == false){if(Keys[17] == 1 || Keys[17] == 2){Keys[17] = 0;}}
        
        if(keysDown[13] == true) // Enter
        {if(Keys[18] == 0){Keys[18] = 1;}else if(Keys[18] == 1 || Keys[18] == 2){Keys[18] = 2;}}else if(keysDown[13] == false){if(Keys[18] == 1 || Keys[18] == 2){Keys[18] = 0;}}
		
        if(keysDown[66] == true) // B
        {if(Keys[19] == 0){Keys[19] = 1;}else if(Keys[19] == 1 || Keys[19] == 2){Keys[19] = 2;}}else if(keysDown[66] == false){if(Keys[19] == 1 || Keys[19] == 2){Keys[19] = 0;}}
    }

    /******************************************************/

    /******************************************************/
    // Draw
    /******************************************************/
    this.Draw = function()
    {
        buffer.clearRect(0, 0, _buffer.width, _buffer.height);
        canvas.clearRect(0, 0, _canvas.width, _canvas.height);
    
        //Draw Code
        var x = _buffer.width / 2;
        var y = _buffer.height / 2;
        buffer.lineWidth = 1;
        
        // Background
        buffer.fillStyle = "rgb(64, 64, 64)";
        buffer.fillRect(0, 0, _buffer.width, _buffer.height);
        
        // Draw GUI
        this.drawGUI(connected);
        
        if(connected)
        {
            // Draw objects
            clientData.drawPlayer();
            clientData.drawServerEnemies();
            
            for(var e in clientData.players)
            {
                if(clientData.players.hasOwnProperty(e))
                {
                    if(clientData.players[e].id != clientData.player.id)
                    {
                        clientData.drawServerPlayers(clientData.players[e].id);
                    }
                }
            }
        }
        
        canvas.drawImage(_buffer, 0, 0);
    }
    
    this.drawGUI = function(isConnected)
    {
        if(isConnected)
        {
            self.drawText(isConnected);
        }
        else
        {
            self.drawText(isConnected);
        }
    }
    
    this.drawText = function(isConnected)
    {
        if(!isConnected)
        {
            if(ticks % 2 == 0)
            {
                if(guiText[0].fadeIn)
                {
                    if(guiText[0].color.a < 0.95)
                    {
                        guiText[0].color.a += 0.015;
                    }
                    if(guiText[0].color.a >= 0.95)
                    {
                        guiText[0].fadeIn = !guiText[0].fadeIn;
                    }
                    
                }
                else if(!guiText[0].fadeIn)
                {
                    if(guiText[0].color.a > 0.25)
                    {
                        guiText[0].color.a -= 0.015;
                    }
                    if(guiText[0].color.a <= 0.25)
                    {
                        guiText[0].fadeIn = !guiText[0].fadeIn;
                    }
                }
            }
            
            // Draw Text
            buffer.beginPath();
            for(var i = 0; i < guiText.length; i++)
            {
                buffer.fillStyle = guiText[i].color.toString();
                buffer.font = guiText[i].fontStyle;
                buffer.textAlign = guiText[i].alignX;
                buffer.textBaseline = guiText[i].alignY;
                buffer.fillText(guiText[i].text, guiText[i].x, guiText[i].y);
            }
            buffer.closePath();
        }
    }
    
    /******************************************************/

    /******************************************************/
    // Run
    /******************************************************/
    this.Run = function()
    {	
        if(canvas != null)
        {
            self.gameLoop = setInterval(self.Loop, 1);
        }
        else
        {
            socket.close();
        }
    }
    
    /******************************************************/
    
    /******************************************************/
    // Game Loop
    /******************************************************/
    this.Loop = function()
    {
        frame++;
        var curTime = Date.now();
        elapsedTime = curTime - prevTime;
        prevTime = curTime;

        delta = elapsedTime / 1000;

        tickTime += delta;
        if(tickTime >= (ticks / 30))
        {
            serverUpdate = true;
            ticks++;
            if(ticks >= 30)
            {
                tickTime = 0;
                ticks = 0;
                seconds++;
            }
        }
        if(ticks % 5 == 0)
        {
            FPS = Math.floor(1 / delta);
        }
        
        self.Update();
        self.Draw();
    }
    
    /******************************************************/
}
this.vector2(X, Y)
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
        var angle = Math.atan2((vect.y - this.y), (vect.x - this.x));
        angle = angle / Math.PI * 180;
        return angle;
    }
    
    // Returns angle in radians between current vector and passed vector
    this.angleRad = function(vect)
    {
        var angle = Math.atan2((vect.y - this.y), (vect.x - this.x));
        return angle;
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
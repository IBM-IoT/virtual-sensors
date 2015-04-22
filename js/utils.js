
// Parse a string containing a date in the format: Y-m-d M:H:S.00000
function parseIfxDate( str )
{
	str = str.split(".")[0].split(" ");
	var dateStr = str[0].split("-");
	var timeStr = str[1].split(":");
	
	return new Date( Date.UTC( parseInt( dateStr[0] ) , parseInt( dateStr[1] ) - 1 , parseInt( dateStr[2] ) ,
					 parseInt( timeStr[0] ) , parseInt( timeStr[1] ) , parseInt( timeStr[2] ) ) );
}

function zeroPad( n ) { return n < 10 ? "0" + n : n; }

// Convert date object to Y-m-d M:H:S.00000
Date.prototype.toIfxString = function()
{
	return this.getUTCFullYear() + "-" + zeroPad( this.getUTCMonth() + 1 ) + "-" + zeroPad( this.getUTCDate() ) + " " +
	       zeroPad( this.getUTCHours() ) + ":" + zeroPad( this.getUTCMinutes() ) + ":" + zeroPad( this.getUTCSeconds() ) + ".00000";
};

Date.prototype.toCustomDate = function()
{
	return zeroPad( this.getMonth() + 1 ) + "/" + zeroPad( this.getDate() ) + "/" + zeroPad( this.getFullYear() % 100 );
};

Date.prototype.toCustomTime = function()
{
	return zeroPad( this.getHours() ) + ":" + zeroPad( this.getMinutes() ) + ":" + zeroPad( this.getSeconds() );
};

function fixMillis( millis )
{
	// REST Listener converts "local" db timestamp to UTC
	// while values are inserted in the db using UTC already
	// This causes a double conversion that needs to be fixed ( e.g. GMT -5 becomes GMT +5 instead of UTC )
	var date = new Date();
	return millis - date.getTimezoneOffset() * 60000;
}

function getLocalDate( millis )
{
	date = new Date(0);
	date.setUTCMilliseconds( millis );
	return date;
}
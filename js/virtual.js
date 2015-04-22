
$( document ).on( "pagecreate" , "#virtualSensorsPage" , VirtualSensorsPageCreate );

function VirtualSensorsPageCreate()
{
	console.log( "VirtualSensorsPage :: Create" );

	$.ajax( { 
		url : "config.json",
		dataType : "json"
	} ).done( LoadVirtualSensors ).fail( function( data ) { alert( "Couldn't parse JSON file config.json" ); } );
	
	$( document ).on( "change" , "#cfgRandomRange" , ConfigRandomChange );
	$( document ).on( "change" , "#cfgIntervalRange" , ConfigIntervalRangeChange );
}

function LoadVirtualSensors( data )
{
	var menu = $( "#virtualSensorsMenu" );
	
	VirtualSensor.dbInfo = data.db;
	
	for( var i in data.sensors )
	{
		if( data.sensors[i].step === undefined ) data.sensors[i].step = 1;
		if( data.sensors[i].chance === undefined ) data.sensors[i].chance = 1;
	
		menu.append( '<div class="gridItem" style="line-height:1em" data-vsid="' + i + '"><div class="sensorDot"> </div><img src="' + data.sensors[i].icon + '" width="100" height="100"><br><span style="font-size:100%">' + data.sensors[i].name + '</span>'
		+ '<input id="vs_value' + i + '" type="range" data-mini="true" min="' + data.sensors[i].minValue + '" max="' + data.sensors[i].maxValue + '" step="' + data.sensors[i].step + '" value="' + data.sensors[i].defaultValue + '">'
		+ '<div data-role="controlgroup" data-type="horizontal" data-mini="true"><a href="#" class="ui-btn ui-corner-all vsStartStop">Start</a>'
		+ '<input type="checkbox" class="vsRandom" id="random' + i + '"><label for="random' + i + '">Random</label>'
		+ '<a href="#configPopup" data-rel="popup" class="ui-btn ui-corner-all ui-btn-icon-notext ui-icon-gear ui-nodisc-icon ui-alt-icon vsConfig">?</a></div>' );
		
		VirtualSensor.sensors.push( new VirtualSensor( i , data.sensors[i] ) );
	}
	
	menu.enhanceWithin();
}

function PopulateConfig( vs )
{
	// console.log( "Populate config:" , vs );

	var configPopup = $( "#configPopup" );
	var slider = configPopup.find( "#cfgRandomRange" );
	var min = slider.find( "input:eq(0)" );
	min.attr( "min" , vs.minValue );
	min.attr( "max" , vs.maxValue );
	min.attr( "step" , vs.step );
	min.val( vs.randMin );
	var max = slider.find( "input:eq(1)" );
	max.attr( "min" , vs.minValue );
	max.attr( "max" , vs.maxValue );
	max.attr( "step" , vs.step );
	max.val( vs.randMax );
	
	slider.rangeslider( "refresh" );
	
	slider = configPopup.find( "#cfgIntervalRange" );
	if( vs.isIrregular )
	{
		min = slider.find( "input:eq(0)" );
		min.attr( "min" , vs.interval );
		min.attr( "max" , vs.intervalMax );
		min.attr( "step" , vs.intervalStep );
		min.val( vs.intervalRandMin );
		max = slider.find( "input:eq(1)" );
		max.attr( "min" , vs.interval );
		max.attr( "max" , vs.intervalMax );
		max.attr( "step" , vs.intervalStep );
		max.val( vs.intervalRandMax );
		
		slider.rangeslider( "refresh" );
		slider.show();
	}
	else slider.hide();
}

function ConfigRandomChange() {
	
	var min = $( this ).find( "input:eq(0)" ).val();
	var max = $( this ).find( "input:eq(1)" ).val();
	
	var vs = VirtualSensor.currentConfig;
	vs.randMin = parseFloat( min );
	vs.randMax = parseFloat( max );
}

function ConfigIntervalRangeChange() {
	
	var min = $( this ).find( "input:eq(0)" ).val();
	var max = $( this ).find( "input:eq(1)" ).val();
	
	var vs = VirtualSensor.currentConfig;
	vs.intervalRandMin = parseInt( min );
	vs.intervalRandMax = parseInt( max );
}

// Virtual Sensor class

VirtualSensor = function( id , prop ) {

	this.id = id;
	this.name = prop.name;
	this.dbinfo = prop.dbinfo;
	this.query = prop.query;
	this.randMin = this.minValue = prop.minValue;
	this.randMax = this.maxValue = prop.maxValue;
	this.step = prop.step;
	this.interval = prop.interval;
	this.intervalMax = ( prop.intervalMax === undefined ? null : prop.intervalMax );
	this.intervalStep = ( prop.intervalStep === undefined ? null : prop.intervalStep );
	this.chance = prop.chance;
	
	this.isIrregular = ( this.intervalMax != null && this.intervalStep != null );
	if( this.isIrregular )
	{
		this.intervalRandMin = this.interval;
		this.intervalRandMax = this.intervalMax;
	}
	
	this.timeout_Main = null;
	this.isFloat = ( this.step - Math.floor( this.step ) > 0 );
	this.isRunning = false;
	this.isRandom = false;
	
	this.container = $( "div[data-vsid='" + this.id + "']" );
	this.sensorDot = this.container.find( ".sensorDot" );
	
	this.container.find( ".vsStartStop" ).on( "click" , this.HandleStartStop.bind( this ) );
	this.container.find( ".vsRandom" ).on( "change" , this.HandleRandomChange.bind( this ) );
	this.container.find( ".vsConfig" ).on( "click" , this.HandleConfigClick.bind( this ) );
};

VirtualSensor.prototype.HandleStartStop = function( event ) {
	
	if( !this.isRunning )
	{
		this.sensorDot.addClass( "sensorActiveTransition" );
		this.Start();
		$( event.target ).text( "Stop" );
	}
	else
	{
		this.Stop();
		$( event.target ).text( "Start" );
		this.sensorDot.removeClass( "sensorActiveTransition sensorActivePulse" );
	}
	
	event.preventDefault();
};

VirtualSensor.prototype.HandleRandomChange = function( event ) {

	this.isRandom = $( event.target ).prop( "checked" );
};

VirtualSensor.prototype.HandleConfigClick = function( event ) {
	
	VirtualSensor.currentConfig = this;
	PopulateConfig( this );
};

VirtualSensor.prototype.Start = function() {
	this.tickTimestamp = null;
	this.currentInterval = 0;
	this.Tick();
	this.isRunning = true;
};

VirtualSensor.prototype.Stop = function() {
	clearTimeout( this.timeout_Main );
	this.isRunning = false;
};

VirtualSensor.prototype.Tick = function() {
	if( Math.random() >= this.chance ) return;

	if( this.isRandom )
	{
		var vs = $( "#vs_value" + this.id );
		var rand = 0;
		if( this.isFloat )
		{
                        var f = Math.random();
			rand = f * ( this.randMax - this.randMin  ) + this.randMin;
			rand = rand.toFixed( 2 );
		console.log( this.name + "[LOG]: f: " + f + " min/max: " + this.randMin + "/" + this.randMax + " R: "+rand);
		}
		else rand = Math.floor( Math.random() * ( this.randMax - this.randMin + 1 ) ) + this.randMin;
		vs.val( rand );
		vs.slider( "refresh" );
	}

	
	var tstamp = ( new Date() ).getTime();
	tstamp -= tstamp % ( this.isIrregular ? this.intervalStep : this.interval );
	var value = $( "#vs_value" + this.id ).val();
	if( this.query !== undefined )
	{
		var queryStr = this.query.replace( /%tstamp/g , ( new Date( tstamp ) ).toIfxString() ).replace( /%data/g , value );
		SQLQuery( queryStr , VirtualSensor.dbInfo , function( data , status , xhr ) {
			
			// console.log( data );
			
		} , null );
		console.log( this.name + ": " + queryStr );
	}
	else
	{
		var insertData = this.dbinfo.fields.replace( /%tstamp/g , ( new Date( tstamp ) ).toIfxString() ).replace( /%data/g , value );;
		console.log( this.name + ": " + insertData );
		RESTInsert( VirtualSensor.dbInfo , this.dbinfo.table , insertData );
	}
	
	this.sensorDot.removeClass( "sensorActiveTransition" );
	this.sensorDot.addClass( "sensorActivePulse" );
	setTimeout( this.PulseAnimation.bind( this ) , 50 );
	
	var now = ( new Date() ).getTime();
	var deltaTime = ( this.tickTimestamp == null ? 0 : now - this.tickTimestamp - this.currentInterval );
	this.tickTimestamp = now - deltaTime;
	
	if( this.isIrregular )
	{
		this.currentInterval = ( Math.random() * ( this.intervalRandMax - this.intervalRandMin ) );
		this.currentInterval -= this.currentInterval % this.intervalStep;
		this.currentInterval += this.intervalRandMin;
	}
	else this.currentInterval = this.interval;
	
	this.timeout_Main = setTimeout( this.Tick.bind( this ) , this.currentInterval - deltaTime );
};

VirtualSensor.prototype.PulseAnimation = function() {
	if( !this.sensorDot.hasClass( "sensorActivePulse" ) ) return;
	this.sensorDot.toggleClass( "sensorActiveTransition sensorActivePulse" ); 
};

VirtualSensor.sensors = [];
VirtualSensor.dbInfo = null;
VirtualSensor.currentConfig = null;


function SQLQuery( sql , db , success , error )
{
	console.log( "Query: " + sql );
	
	$.ajax( {
		url : "http://" + db.host + ":" + db.port + "/" + db.db +"/system.sql?query={\"$sql\":\"" + sql + "\"}",
		dataType : "json",
		contentType : "text/plain",
		success : success,
		error : error,
		xhrFields: {
			withCredentials: true
	    }
	} );
}

function RESTInsert( db , table , data )
{
	$.ajax( {
		url : "http://" + db.host + ":" + db.port + "/" + db.db +"/" + table + "/",
		type : "POST",
		data : data,
		dataType : "json",
		contentType : "text/plain",
		xhrFields: {
			withCredentials: true
	    }
	} );
}
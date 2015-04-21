var app = require('express')();
var server = require('http').createServer(app).listen(3000);
var io = require('socket.io').listen(server);
var fs = require('fs');
var request = require("request")
var parsedJSON = require('./city.json');		//városok és ID-k vannak benne
var JSONstring;									//a kiválasztott városról lekérdezett adatok vannak benne
var clients = [];
var is_client = 0;
var temperatures = [];
var dashboards = {};
var dash_id;


// Using the .html extension instead of
// having to name the views as *.ejs
app.engine('.html', require('ejs').__express);
 
// Set the folder where the pages are kept
app.set('views', __dirname + '/views');
 
// This avoids having to provide the 
// extension to res.render()
app.set('view engine', 'html');



var city_id;


app.get('/', function (req, res) {
	dash_id = Math.floor((Math.random() * 100000000) + 1);
//	res.send({dashboardid: dash_id});
	res.redirect('/dash/'+ dash_id);
	
	
});

app.get('/dash/:id', function (req, res) {
	console.log("dash"+req.params.id);
	
    if (dashboards[req.params.id])
    {
        var choice=dashboards[req.params.id];
//		console.log(req.params.id);
    }else{
		dashboards[req.params.id]=new Array();
	}
	console.log(dashboards);

res.render("socket",{
	dashboardid:req.params.id, mydashboard: JSON.stringify(choice)
	});
 // res.sendfile(__dirname + '/views/socket.html');;
});




io.sockets.on('connection', function (socket) {
	
	
	clients.push(socket);
	//---------------aktív kapcsolatok karbantartásához--------------
	console.log('Connected user is:', clients.length);
	io.sockets.emit('info', parsedJSON);  //------------ezzel tudom az összes socketnek ugyanazt kiküldeni------------
	
	
	/****** ha csak az adott socketnek szeretnem:
	socket.emit('info', { msg: Math.floor((Math.random() * 100) + 1 )});
	*******/
	
	socket.on('getcity', function(data)			//egy ugyanilyennel nyomon lehet követni a a dashboardokat   ______ 
	{
		//socket.emit('torefresh', { msg: "reggeli"});
		console.log(data);
//		dashboards[data.dashboardid]=data;

		
		
		

		//-------------végignézi a tárolt városok listáját, és a megfelelő város id mezőjét kiválasztja-----------
		for(var i=0; i<parsedJSON.length; i++){
			if (parsedJSON[i].name == data)
				{
//					console.log(parsedJSON[i]._id);
					city_id = parsedJSON[i]._id
				}
//				else 	console.log("nincs");		
		}
		
		
		
		var url = "http://api.openweathermap.org/data/2.5/forecast/daily?id=" + city_id;



		request({
			url: url,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
			
			
			var t = new Date( body.list[0].dt*1000 );
//			var formatted = t.format("dd.mm.yyyy hh:MM:ss");

				
		       ; // Print the json response
			   JSONstring = JSON.stringify(body);
				   

			}
		})
		
			socket.emit("buildchart", JSONstring);

		
	});
	
		socket.on('dash', function(data){

			dashboards[data.id].push(data.city);
			
			});

	

	
	
	  socket.on('disconnect', function () {
	  	for (i=0; i<clients.length; i++) {
		if(clients[i].id == socket.id) 
			{
			clients.splice(i,1);				//-----------------kapcsolatot bontott socket törlése a listából--------------------
			}
		}
		io.emit('user disconnected');
		console.log("disc")

	  });
	


});

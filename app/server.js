var express = require('express');
var app = express();

/*------------------------------------------------------------------------------
Config.
-----------------------------------------------------------------------------*/
app.set('port', (process.env.PORT || 5100));

/*------------------------------------------------------------------------------
Public Files.
-----------------------------------------------------------------------------*/
app.use('/public', express.static(__dirname + '/public'));

/*------------------------------------------------------------------------------
App Views.
-----------------------------------------------------------------------------*/
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/*------------------------------------------------------------------------------
Page Routes.
-----------------------------------------------------------------------------*/
app.get('/', function(request, response) {
	response.render('pages/index')
});
app.post('/', function(request, response) {
    call_api(request, response);
});
app.get('*', function(request, response) {
	response.status(404).render('pages/page_404')
});

/*------------------------------------------------------------------------------
Start Server.
-----------------------------------------------------------------------------*/
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

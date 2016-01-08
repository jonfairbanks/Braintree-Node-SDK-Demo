
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  user = require('./routes/user'),
  http = require('http'),
  moment = require('moment'),
  cool = require('cool-ascii-faces'),
  path = require('path');

var app = express();

var braintree = require('braintree');

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: 'YOUR MERCHANT ID',
  publicKey: 'YOUR PUBLIC KEY',
  privateKey: 'YOUR PRIVATE KEY'
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'Home | Braintree Demo'
  });
});

app.get('/about', function(req, res){
  res.render('about', {
    title: 'About | Braintree Demo'
  });
});

app.get('/client_token', function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.send(response.clientToken);
  });
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/customer', function(req, res){
  clientToken = gateway.clientToken.generate({}, function (err, response) {
    //console.log('Client Token:', response.clientToken);
	clientToken = response.clientToken;
    res.render('customer', {
      title: 'Create a Customer | Braintree Demo'});
  });
});

app.post('/create-customer', function (req, res) {
    var fName = req.body.firstName;
    var lName = req.body.lastName;
    var email = req.body.email;
    var phone = req.body.phone;
    var fax = req.body.fax;
    var coName = req.body.companyName;
    var webUrl = req.body.webUrl;
    gateway.customer.create({
       firstName: fName,
       lastName: lName,
       email: email,
       phone: phone,
       fax: fax,
       company: coName,
       website: webUrl
    }, function (err, result) {
       btResponse = JSON.stringify(result, null, 4);
       btObj = result;
       if(result.success == true){
           //console.log(result);
           res.render('customer-complete', {
               title: 'Customer Created | Braintree Demo'});
       }else{
           console.log(result);
           res.send(result);
       }
    })
});

app.get('/sale', function(req, res){
  clientToken = gateway.clientToken.generate({}, function (err, response) {
	clientToken = response.clientToken;
    res.render('sale', {
      title: 'Basic Sale Payment | Braintree Demo'});
  });
});

app.post('/sale-checkout', function (req, res) {
  var nonce = req.body.payment_method_nonce;
  gateway.transaction.sale({
    amount: '1.00',
    paymentMethodNonce: nonce,
    channel: 'paypal.bn_code',
    options: {
      submitForSettlement: true
    }
  }, function (err, result) {
    //TO DO: Error Handling
	btResponse = JSON.stringify(result, null, 4);
    btObj = result;
    try {
        tempId = btObj.transaction.paypal.debugId;
        debugId = tempId.substring(6);
    }catch(e){
        debugId = 'n/a';
    }
    timestamp = moment(btObj.transaction.createdAt, moment.ISO_8601).format('MMM Do YYYY @ h:mm a');
    res.render('sale-complete', {
	   title: 'Payment Complete | Braintree Demo'});
  });
});

app.get('/vault', function(req, res){
  clientToken = gateway.clientToken.generate({}, function (err, response) {
	clientToken = response.clientToken;
    res.render('vault', {
      title: 'PayPal Vault Payment | Braintree Demo'});
  });
});

app.post('/vault-checkout', function (req, res) {
  var saleRequest = {
    amount: '1.00',
    paymentMethodNonce: 'fake-paypal-future-nonce',
    orderId: 'Your PayPal Invoice #',
    options: {
        paypal: {
            customField: 'Something, Something, Something, Dark Side',
            description: 'Braintree Node.JS SDK Demo',
        },
        submitForSettlement: true
    }
  };
  
  gateway.transaction.sale(saleRequest, function (err, result) {
    if (err) {
        res.send("<h1>Error:  " + err + "</h1>");
    } else if (result.success) {
        btResponse = JSON.stringify(result, null, 4);
        btObj = result;
        try {
            tempId = btObj.transaction.paypal.debugId;
            debugId = tempId.substring(6);
        }catch(e){
            debugId = 'n/a';
        }
        timestamp = moment(btObj.transaction.createdAt, moment.ISO_8601).format('MMM Do YYYY @ h:mm a');
        res.render('vault-complete', {
           title: 'Vault 111 | Braintree Demo'}
        );
    } else {
        res.send("<h1>Error:  " + result.message + "</h1>");
    }
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Braintree Demo listening on port " + app.get('port'));
});

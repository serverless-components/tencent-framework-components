import sl_handler

event = {
 "requestContext": {
   "serviceId": "service-abcdefg",
   "path": "/",
   "httpMethod": "GET",
   "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
   "sourceIp": "10.0.2.14",
   "stage": "release"
 },
 "headers": {
   "accept-Language": "en-US,en,cn",
   "accept": "text/html,application/xml,application/json",
   "host": "localhost",
   "user-Agent": "User Agent String"
 },
 "body": "{}",
 "pathParameters": {
   "path": "value"
 },
 "queryStringParameters": {
   "foo": "bar"
 },
 "headerParameters":{
   "Refer": "127.0.0.1"
 },
 "stageVariables": {
   "stage": "release"
 },
 "path": "/",
 "queryString": {
   "foo" : "bar",
   "bob" : "alice"
 },
 "httpMethod": "GET"
}

res = sl_handler.handler(event, {});

print(res)

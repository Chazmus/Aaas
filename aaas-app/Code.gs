// Google OAuth configuration
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index');
}

// Google OAuth2 flow
function loginWithGoogle() {
  var service = getOAuthService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    return HtmlService.createHtmlOutput('<a href="' + authorizationUrl + '">Authorize Google Account</a>');
  } else {
    var token = service.getAccessToken();
    var userInfo = getGoogleUserInfo(token);
    saveUserData(userInfo);
    return HtmlService.createHtmlOutput('<h1>Welcome, ' + userInfo.name + '</h1><p>Email: ' + userInfo.email + '</p>');
  }
}

// Google OAuth2 configuration
function getOAuthService() {
  return OAuth2.createService('google')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId('YOUR_GOOGLE_CLIENT_ID')
    .setClientSecret('YOUR_GOOGLE_CLIENT_SECRET')
    .setRedirectUri('https://script.google.com/macros/d/1k5PyWPR2F8mjn6FNh7tO9A0Xb8-xcUNqG8okFnynU1TXMaDmhDPKrCT1/usercallback') // Script ID
    .setScope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback');
}

// Callback function after OAuth2 flow completes
function authCallback(request) {
  var service = getOAuthService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can now close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Authorization denied.');
  }
}

// Retrieve Google user information using access token
function getGoogleUserInfo(token) {
  var url = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  return JSON.parse(response.getContentText());
}

// Save user data to Google Sheets
function saveUserData(userInfo) {
  var sheet = SpreadsheetApp.openById('1-rubsPcdsoIgFd0wHLpd-8ynBpF-8zrX7Ahrmpy7ehE').getSheetByName('Users'); // Sheet ID
  sheet.appendRow([new Date(), userInfo.id, userInfo.name, userInfo.email]);
}

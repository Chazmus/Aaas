global.SpreadsheetApp = {
  openById: function() {
    // simulate slow I/O
    let sum = 0;
    for(let i=0; i<1000000; i++) { sum += i; }
    return {
      getSheetByName: function() {
        return {
          appendRow: function() {
            let sum = 0;
            for(let i=0; i<1000000; i++) { sum += i; }
          }
        }
      }
    }
  }
};

let cacheStore = {};
global.CacheService = {
  getScriptCache: function() {
    return {
      get: function(key) { return cacheStore[key]; },
      put: function(key, val, time) { cacheStore[key] = val; }
    }
  }
};

global.config = { GOOGLE_SPREADSHEET_ID: '123' };

function saveUserDataOriginal(userInfo) {
  var sheet = SpreadsheetApp.openById(config.GOOGLE_SPREADSHEET_ID).getSheetByName('Users'); // Sheet ID
  sheet.appendRow([new Date(), userInfo.id, userInfo.name, userInfo.email]);
}

let cachedSheet = null;
function saveUserDataOptimized(userInfo) {
  var cache = CacheService.getScriptCache();
  if (cache.get(userInfo.id)) {
    return;
  }

  if (!cachedSheet) {
    cachedSheet = SpreadsheetApp.openById(config.GOOGLE_SPREADSHEET_ID).getSheetByName('Users'); // Sheet ID
  }
  cachedSheet.appendRow([new Date(), userInfo.id, userInfo.name, userInfo.email]);
  cache.put(userInfo.id, 'true', 21600);
}

const userInfo = { id: 'user123', name: 'Test', email: 'test@example.com' };

// Benchmark original
let start = Date.now();
for (let i = 0; i < 100; i++) {
  saveUserDataOriginal(userInfo);
}
console.log('Original:', Date.now() - start, 'ms');

// Benchmark optimized
start = Date.now();
for (let i = 0; i < 100; i++) {
  saveUserDataOptimized(userInfo);
}
console.log('Optimized:', Date.now() - start, 'ms');

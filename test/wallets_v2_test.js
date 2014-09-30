var helper   = require("./test_helper");
var walletV2 = require("../lib/models/wallet_v2");
var hash     = require("../lib/util/hash");
var Promise  = helper.Stex.Promise;
var _        = helper.Stex._;
var notp     = require("notp");

describe("GET /v2/kdf_params", function() {
  it("succeeds", function() {
    return test.supertestAsPromised(app)
        .get('/v2/kdf_params')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
  });
});

describe("POST /v2/wallets/show_login_params", function() {
  beforeEach(function(done) {
    this.submit = function(params) {
      return test.supertestAsPromised(app)
        .post('/v2/wallets/show_login_params')
        .send(params)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
    };

    done();
  });

  it("retrieves the login params properly by username", function() {
    return this.submit({username:"scott"}).expect(200);
  });

  it("fails to find the login params when none exists for the username", function() {
    return this.submit({username:"missing"}).expect(404);
  });
});

describe("POST /v2/wallets/show", function() {
  beforeEach(function(done) {
    this.submit = function(params) {
      return test.supertestAsPromised(app)
        .post('/v2/wallets/show')
        .send(params)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
    };

    this.lockout = function(username) {
      return Promise.all([
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
        this.submit({username:username, walletId:"somewrongtoken"}).expect(403),
      ]);
    };

    done();
  });

  it("retrieves the wallet properly", function() {
    return this.submit({username:"scott", walletId:new Buffer("authtoken").toString("base64")}).expect(200);
  });

  it("retrieves the wallet properly with totpCode", function() {
    return this.submit({username:"mfa", walletId:new Buffer("authtoken").toString("base64"), totpCode:notp.totp.gen("mytotpKey", {})}).expect(200);
  });

  it("fails with 403 when the username is not found", function() {
    return this.submit({username:"missing", walletId:new Buffer("authtoken").toString("base64")}).expect(403);
  });

  it("fails with 403 when the authToken is incorrect", function() {
    return this.submit({username:"scott", walletId:"somewrongtoken"}).expect(403);
  });

  it("locks an ip address out after the configured number of failed login attempts", function() {
    var self = this;
    
    return this.lockout("scott").then(function() {    
      self.submit({username:"scott", walletId:new Buffer("authtoken").toString("base64")}).expect(403);
    });
  });

  it("fails when the totpToken is required and is wrong", function() {
    return this.submit({username:"mfa", walletId:new Buffer("authtoken").toString("base64"), totpCode:"wrongvalue"}).expect(403);
  });
});


describe("POST /v2/wallets/create", function() {
  beforeEach(function(done) {
    this.params = {
      "username":         "nullstyle",
      "walletId":         new Buffer("2").toString('base64'),
      "salt":             "2",
      "kdfParams":        "2",
      "publicKey":        "2",
      "mainData":         "mains",
      "mainDataHash":     hash.sha1("mains"),
      "keychainData":     "keys",
      "keychainDataHash": hash.sha1("keys")
    };

    this.submit = function() {
      return test.supertestAsPromised(app)
        .post('/v2/wallets/create')
        .send(this.params)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
    };

    done();
  });


  it("creates a wallet in the db when on the happy path", function(done) {
    this.submit()
      .expect(200)
      .end(done);
      //TODO: confirm the row was inserted
  });

  it("fails when the username isn't provided");
  it("fails when the username has already been taken");
  it("fails when the username contains invalid characters");

  it("fails when the walletId isn't provided");
  it("fails when the walletId is not properly base64 encoded");

  it("fails when the salt isn't provided");

  it("fails when the kdfParams isn't provided");
  it("fails when the kdfParams is not json");

  it("fails when the publicKey isn't provided");
  it("fails when the publicKey is not properly base64 encoded");
  it("fails when the publicKey cannot be an ed25519 key (i.e. 32-bytes long)");

  it("fails when the mainData isn't provided");
  it("fails when the mainData is too large");
  it("fails when the provided mainHash doesn't verify the mainData");

  it("fails when the keychainData isn't provided");
  it("fails when the keychainData is too large");
  it("fails when the provided keychainHash doesn't verify the keychainData");
});
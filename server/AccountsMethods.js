import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

Meteor.methods({
  'jsaccounts/validateLogout': function (accessToken) {
    const connection = this.connection;

    process.env.DEBUG_ACCOUNTS && console.log('accountsServer', accountsServer);
    process.env.DEBUG_ACCOUNTS && console.log('connection', connection);
    process.env.DEBUG_ACCOUNTS && console.log('accessToken', accessToken);

    if (AccountsServer) {
      Meteor._noYieldsAllowed(function () {
        accountsServer.logout(accessToken);
        // AccountsServer._removeTokenFromConnection(connection.id);
        // AccountsServer._setAccountData(connection.id, 'loginToken', null);
      });
    }

    this.setUserId(null);
  },
  'jsaccounts/validateLogin': function (accessToken) {
    const connection = this.connection;
    const meteorContext = this;

    const method = Meteor.wrapAsync(function (accessToken, callback) {

      // ServerValidator.validateToken(accessToken, meteorContext)
      accountsServer.findSessionByAccessToken(accessToken)
        .then(user => {
          callback(null, user);
        })
        .catch(e => {
          callback(e, null);
        })
    });

    const user = method(accessToken);
    const jsaccountsContext = {
      userId: user ? user.id : null,
      user: user || null,
      accessToken,
    };

    if (AccountsServer)  {
      Meteor._noYieldsAllowed(function () {
        AccountsServer._removeTokenFromConnection(connection.id);
        AccountsServer._setAccountData(connection.id, 'loginToken', jsaccountsContext.accessToken);
        // AccountsServer.logout(jsaccountsContext.accessToken);
      });
    }

    this.setUserId(jsaccountsContext.userId);

    return true;
  }
});  

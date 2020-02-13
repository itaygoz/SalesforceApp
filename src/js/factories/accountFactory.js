define(['ojs/ojmodel'],
    function (Model) {
        var AccountFactory = {
            resorceUrl: 'https://um1.salesforce.com/services/apexrest/api/account/',
            createAccountModel: function (OAuth) {
                var account = Model.Model.extend({
                    urlRoot: this.resorceUrl,
                    idAttribute: "Id",
                    parseSave: this.parseSaveAccount,
                    oauth: OAuth
                });
                return new account();
            },
            createAccountCollection: function (OAuth) {
                var accounts = new Model.Collection.extend({
                    url: this.resorceUrl,
                    model: this.createAccountModel(OAuth),
                    oauth: OAuth
                });
                return new accounts();
            },
            parseSaveAccount: function(response) {
               return {
                        Id: response['Id'],
                        AccountNumber: response['AccountNumber'],
                        Name: response['Name'],
                        Site: response['Site'],
                        Phone: response['Phone'],
                        Website: response['Website'],
                        Description: response['Description']
                    }
            }
        };
        return AccountFactory;
    });
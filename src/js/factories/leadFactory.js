define(['ojs/ojmodel'],
    function (Model) {
        var LeadFactory = {
            resorceUrl: 'https://um1.salesforce.com/services/apexrest/api/leads/',
            createLeadModel: function (OAuth) {
                var Lead = Model.Model.extend({
                    urlRoot: this.resorceUrl,
                    idAttribute: "Id",
                    parseSave: this.parseSaveLead,
                    oauth: OAuth
                });
                return new Lead();
            },
            createLeadCollection: function (OAuth) {
                var Leads = new Model.Collection.extend({
                    url: this.resorceUrl,
                    model: this.createLeadModel(OAuth),
                    oauth: OAuth
                });
                return new Leads();
            },
            parseSaveLead: function (response) {
                return {
                    Id: response['Id'],
                    FirstName: response['FirstName'],
                    LastName: response['LastName'],
                    Phone: response['Phone'],
                    Website: response['Website'],
                    Description: response['Description'],
                    Company: response['Company'],
                    Status: response['Status']
                }
            }
        };
        return LeadFactory;
    });
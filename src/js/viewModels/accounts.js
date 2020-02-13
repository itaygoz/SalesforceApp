/**
 * @license
 * Copyright (c) 2014, 2019, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * @ignore
 */
define(['accUtils', 'knockout', 'ojs/ojbootstrap', 'ojs/ojcollectiondataprovider', 'factories/accountFactory', 'jquery', 'alertifyjs', 'jscookie', 'ojs/ojknockout',
    'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout',
    'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojlabelvalue', 'ojs/ojmodel', 'ojs/ojtable'
  ],
  function (accUtils, ko, Bootstrap, CollectionDataProvider, Account, $, alertify, Cookies) {
    function DashboardViewModel() {
      var self = this;

      document.title = "Accounts";

      this.accountName = ko.observable();
      this.accountSite = ko.observable();
      this.description = ko.observable();
      this.phone = ko.observable();
      this.website = ko.observable();
      this.accountNumber = ko.observable();
      this.okBtnTxt = ko.observable();

      var myOAuth = new oj.OAuth();

      this.accountsData = ko.observable();
      var accountCollection = Account.createAccountCollection(myOAuth);

      if (Cookies.get('oauth')) {
        fecthAccountContext();
        showTable(true);
      } else {
        showTable(false);
      }

      function showTable(flg) {
        $(document).ready(function () {
          if (flg) {
            $("#loginWrapper").hide();
            $("#contextWrapper").show();
          } else {
            $("#loginWrapper").show();
            $("#contextWrapper").hide();
          }
        });
      }

      this.signOut = function (event) {
        Cookies.remove('oauth');
        location.reload();
      }.bind(this);

      this.login = function (event) {
        var oAuthUrl = "https://login.salesforce.com/services/oauth2/authorize?" +
          "scope=full&" +
          "response_type=token&" +
          "client_id=3MVG9xB_D1giir9o7YW7j5B0DmMBeVWly1llfMRJ4Snudl_y2XZnwLEvOd1oTFx_aS2bYSeHH5c6lYJPJmnPO&" +
          "redirect_uri=http://localhost:8000/oauth/callback";

        oAuthWindow = window.open(oAuthUrl, "_blank", "menubar=no, toolbar=no, resizable = no,top=50,width=500,height=500,titlebar=no, alwaysRaised=yes");
        oAuthWindow.focus();
        var acToken, issued;
        id = setInterval(function () {
          if (oAuthWindow.location.href.includes("http://localhost:8000/oauth/callback", 0)) {
            clearInterval(id);
            //ready to close the window.
            url = oAuthWindow.location.href;
            // console.log(url);
            acToken = decodeURI(url.match(/\#(?:access_token)\=([\S\s]*?)\&/)[1]);
            issued = decodeURI(url.match(/\&(?:issued_at)\=([\S\s]*?)\&/)[1]);
            oAuthWindow.close();
            setAccessTokenOAuthAndCookie(acToken, issued);
          }
        }, 100);
      }.bind(this);

      function setAccessTokenOAuthAndCookie(token, issued) {
        var issuedTime = new Date(0);
        issuedTime.setUTCMilliseconds(issued);
        var expireDate = new Date(issuedTime.getTime() + 60 * 60 * 1000);
        // console.log("issued", issuedTime.getTime());
        // console.log("issuedDate", expireDate);
        // Cookies.remove('oauth');
        Cookies.set('oauth', token, {
          expires: expireDate
        });
        showTable(true);
        fecthAccountContext();
      }

      function fecthAccountContext() {
        credentials = {
          access_token: Cookies.get('oauth'),
          token_type: "Bearer"
        };
        myOAuth.setAccessTokenResponse(credentials);

        self.accountsData(new CollectionDataProvider(accountCollection), {
          keyAttributes: 'Id'
        });
        accountCollection.fetch({
          success: function () {
            console.log('success in fetch!');
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('Error in fetch: ' + JSON.stringify(jqXHR));
          }
        });
      }

      this.createAccount = function (event) {
        document.getElementById('create_dialog').open();
        this.accountName('');
        this.accountSite('');
        this.description('');
        this.phone('');
        this.website('');
        this.accountNumber('');
        this.okBtnTxt('Create');

        $("#okButton").unbind().click(function () {
          if (this.okBtnTxt() == 'Create') {
            var accountRec = {
              AccountNumber: this.accountNumber(),
              Name: this.accountName(),
              Site: this.accountSite(),
              Phone: this.phone(),
              Website: this.website(),
              Description: this.description()
            };
            accountCollection.create(accountRec, {
              wait: true,
              success: function (model, response) {
                console.log('Successfully create account ', response);

              },
              error: function (jqXHR, textStatus, errorThrown) {
                console.log('Error in Create: ' + textStatus);
              }
            });
            document.getElementById('create_dialog').close();
          }
        }.bind(this));
      }.bind(this);

      this.deleteAccountBtn = function (event, accountId) {

        var accModel = accountCollection.get(accountId.data);

        if (accModel) {

          // dialog("Are you sure you want to delete " + accModel.attributes.Name + "?",
          //   function () {
          //     console.log("Delete Account", accModel);
          //     accModel.destroy({
          //       success: function (model, response) {
          //         accountCollection.remove(accModel);
          //         console.log("success delete", response);
          //       },
          //       error: function (jqXHR, textStatus, errorThrown) {
          //         console.log('Error in Deleting: ', jqXHR);
          //       }
          //     });
          //   },
          //   function () {
          //     // If press No
          //   }
          // );

          alertify.confirm("Delete " + accModel.attributes.Name, "Are you sure you want to delete " + accModel.attributes.Name + "?",
            function () {
              console.log("Delete Account", accModel);
              accModel.destroy({
                success: function (model, response) {
                  accountCollection.remove(accModel);
                  console.log("success delete", response);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  console.log('Error in Deleting: ', jqXHR);
                }
              });
              alertify.success('Deleted');
            },
            function () {
              alertify.error('Canceled');
            });

        }
      }.bind(this);

      this.updateAccountBtn = function (event, accountId) {
        var accModel = accountCollection.get(accountId.data);

        if (accModel) {
          document.getElementById('create_dialog').open();
          console.log("account", accModel);
          this.accountName(accModel.attributes.Name);
          this.accountSite(accModel.attributes.Site);
          this.description(accModel.attributes.Description);
          this.phone(accModel.attributes.Phone);
          this.website(accModel.attributes.Website);
          this.accountNumber(accModel.attributes.AccountNumber);
          this.okBtnTxt('Update');
          $("#okButton").unbind().click(function () {
            if (this.okBtnTxt() == 'Update') {
              var accountRec = {
                AccountNumber: this.accountNumber(),
                Name: this.accountName(),
                Site: this.accountSite(),
                Phone: this.phone(),
                Website: this.website(),
                Description: this.description()
              };
              accModel.save(accountRec, {
                wait: true,
                success: function (model, response) {
                  console.log('Successfully create update ', response);
                  alertify.success("Update succefully!");

                },
                error: function (jqXHR, textStatus, errorThrown) {
                  console.log('Error in Create: ' + textStatus);
                }
              });
              document.getElementById('create_dialog').close();
            }
          }.bind(this));
        }
      }.bind(this);


    }
    this.cancelBtn = function () {
      document.getElementById('create_dialog').close();
    }

    function dialog(message, yesCallback, noCallback) {
      $('.title').html(message);
      var dialog = $('#deleteDialog')[0];
      dialog.open();
      console.log('var', document.getElementById('deleteDialog'));
      console.log('dialog', dialog);


      $('#deleteButton').click(function () {
        dialog.close();
        yesCallback();
      });
      $('#NoDeleteButton').click(function () {
        dialog.close();
        noCallback();
      });
    }

    return DashboardViewModel;
  }
);
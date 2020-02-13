/**
 * @license
 * Copyright (c) 2014, 2019, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * @ignore
 */
define(['accUtils', 'knockout', 'ojs/ojbootstrap', 'ojs/ojcollectiondataprovider', 'factories/leadFactory', 'jquery', 'alertifyjs', 'jscookie', 'ojs/ojknockout',
    'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout',
    'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojlabelvalue', 'ojs/ojmodel', 'ojs/ojtable', 'ojs/ojselectcombobox', 'ojs/ojvalidationgroup'
  ],
  function (accUtils, ko, Bootstrap, CollectionDataProvider, Lead, $, alertify, Cookies) {
    function DashboardViewModel() {
      var self = this;

      document.title = "Leads";

      this.firstName = ko.observable();
      this.lastName = ko.observable();
      this.company = ko.observable();
      this.status = ko.observable("Open - Not Contacted");
      this.phone = ko.observable();
      this.website = ko.observable();
      this.description = ko.observable();
      this.okBtnTxt = ko.observable();

      var myOAuth = new oj.OAuth();

      this.leadsData = ko.observable();
      var leadCollection = Lead.createLeadCollection(myOAuth);

      if (Cookies.get('oauth')) {
        fecthLeadContext();
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
            console.log(url);
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
        console.log("issued", issuedTime.getTime());
        console.log("issuedDate", expireDate);
        // Cookies.remove('oauth');
        Cookies.set('oauth', token, {
          expires: expireDate
        });
        showTable(true);
        fecthLeadContext();
      }

      function fecthLeadContext() {
        if (!Cookies.get('oauth'))
          location.reload();
        credentials = {
          access_token: Cookies.get('oauth'),
          token_type: "Bearer"
        };
        myOAuth.setAccessTokenResponse(credentials);

        self.leadsData(new CollectionDataProvider(leadCollection), {
          keyAttributes: 'Id'
        });
        leadCollection.fetch({
          success: function () {
            console.log('success in fetch!');
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('Error in fetch: ' + JSON.stringify(jqXHR));
          }
        });
      }

      this.createLead = function (event) {
        document.getElementById('create_dialog').open();
        this.firstName('');
        this.lastName('');
        this.company('');
        this.status("Open - Not Contacted");
        this.phone('');
        this.website('');
        this.description('');
        this.okBtnTxt('Create');

        $("#okButton").unbind().click(function () {
          if (!Cookies.get('oauth'))
            location.reload();
          var valid = _checkValidationGroup();
          // console.log("validate", valid);
          if (!valid) {
            return;
          }
          if (this.okBtnTxt() == 'Create') {
            var leadRec = {
              FirstName: this.firstName(),
              LastName: this.lastName(),
              Company: this.company(),
              Status: this.status(),
              Phone: this.phone(),
              Website: this.website(),
              Description: this.description()
            };
            leadCollection.create(leadRec, {
              wait: true,
              success: function (model, response) {
                console.log('Successfully create lead ', response);

              },
              error: function (jqXHR, textStatus, errorThrown) {
                console.log('Error in Create: ' + textStatus);
              }
            });
            document.getElementById('create_dialog').close();
          }
        }.bind(this));
      }.bind(this);

      this.deleteLeadBtn = function (event, leadId) {

        var accModel = leadCollection.get(leadId.data);

        if (accModel) {

          // dialog("Are you sure you want to delete " + accModel.attributes.Name + "?",
          //   function () {
          //     console.log("Delete Lead", accModel);
          //     accModel.destroy({
          //       success: function (model, response) {
          //         leadCollection.remove(accModel);
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

          alertify.confirm("Delete " + accModel.attributes.Name, "Are you sure you want to delete " + accModel.attributes.FirstName + " " + accModel.attributes.LastName + "?",
            function () {
              console.log("Delete Lead", accModel);
              accModel.destroy({
                success: function (model, response) {
                  leadCollection.remove(accModel);
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

      this.updateLeadBtn = function (event, leadId) {
        var accModel = leadCollection.get(leadId.data);

        if (accModel) {
          document.getElementById('create_dialog').open();
          console.log("lead", accModel);
          this.firstName(accModel.attributes.FirstName);
          this.lastName(accModel.attributes.LastName);
          this.company(accModel.attributes.Company);
          this.status(accModel.attributes.Status);
          this.phone(accModel.attributes.Phone);
          this.website(accModel.attributes.Website);
          this.description(accModel.attributes.Description);
          this.okBtnTxt('Update');
          $("#okButton").unbind().click(function () {
            if (!Cookies.get('oauth'))
              location.reload();
            var valid = _checkValidationGroup();
            console.log("validate", valid);
            if (!valid) {
              return;
            }
            if (this.okBtnTxt() == 'Update') {
              var leadRec = {
                FirstName: this.firstName(),
                LastName: this.lastName(),
                Company: this.company(),
                Status: this.status(),
                Phone: this.phone(),
                Website: this.website(),
                Description: this.description()
              };
              accModel.save(leadRec, {
                wait: true,
                success: function (model, response) {
                  console.log('Successfully update ', response);
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

    var _checkValidationGroup = function () {
      var tracker = document.getElementById("tracker");
      if (tracker.valid === "valid") {
        return true;
      } else {
        // show messages on all the components
        // that have messages hidden.
        tracker.showMessages();
        tracker.focusOn("@firstInvalidShown");
        return false;
      }
    };


    return DashboardViewModel;
  }

);
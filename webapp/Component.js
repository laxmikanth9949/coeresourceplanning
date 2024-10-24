//sap.ui.getCore().loadLibrary("sap.coe.capacity.reuselib", jQuery.sap.getModulePath("sap.coe.rpa") + "/reuselib/src/sap/coe/capacity/reuselib/");
sap.ui.getCore().loadLibrary("sapit", { url: sap.ui.require.toUrl("sap/coe/rpa") + "/resources/sapit", async:
true });
// sap.ui.getCore().loadLibrary("reuelib", { url: sap.ui.require.toUrl("sap/coe/capacity/reuselib"), async:true });
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/coe/capacity/reuselib/utils/DataManager",
	"sap/coe/capacity/reuselib/utils/P13nHelper",
	"sap/coe/capacity/reuselib/fragment/NoAuthorizationDialog",
	"sap/coe/rpa/util/helpers",
	"sapit/util/cFLPAdapter" 
], function(UIComponent, DataManager, P13nHelper, NoAuthDialog, Helpers, cFLPAdapter) {
	"use strict";

	return UIComponent.extend("sap.coe.rpa.Component", {
		metadata: {
			manifest: "json",
			"config": {
				"fullWidth": true,
				"titleResource": "APPLICATION_TITLE_PERSONAL_CALENDAR",
				/* eslint-disable sap-no-hardcoded-url */
				"jamResource": "https://jam4.sapjam.com/groups/about_page/iDrRymI7rWhoNrog2NpHea",
				/* eslint-enable sap-no-hardcoded-url */
				"categoryResource": "IMFIT_DBS_CRM_TECH",
				"appName": "sap.coe.rpa",
				//IT Launchpad Mobile reporting parameter
				reportingId: "Personal Calendar",
				reportingHosts: ["sapit-customersupport-prod-kestrel.launchpad.cfapps.eu10.hana.ondemand.com", "sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com", "myapp.hana.ondemand.com", "fiorilaunchpad.sap.com"]
			}
		},

		init: function() {
			cFLPAdapter.init();
			// call super init (will call function "create content")
			UIComponent.prototype.init.apply(this, arguments);

			// instantiate client model and populate with personalization data
			this._initP13n();

			// initialize Mobile reporting
			this._initMobileUsageReporting();

			this.getRouter().initialize();
			
			var oUserContextModel = new sap.ui.model.json.JSONModel();
			this.setModel(oUserContextModel, "praUserContext");
			
			// set model with logged-in user details
			this.setLoggedInUser();

			DataManager.getUserOrgUnit(this, "", this.setUserModel);			

			//this.noAuthDialog = new NoAuthDialog(); uncomment when back end auth is working in prof
			Helpers.preventSessionTimeout(this.getModel(), 1200000);
			sap.ui.getCore().getConfiguration().setLanguage("en-gb");
			sap.ui.getCore().getConfiguration().setFormatLocale("en-GB");
		},

		setUserModel: function(oData, aParameters, that) {
			var oUserContext = {
				EmpId: oData.EmpId,
				HigherUnt: oData.HigherUnt,
				/* eslint-disable sap-no-hardcoded-url */
				BaseURLCRM: "https://" + "icp" /*that.getCRMserverFromSystem(jsonResult.system)*/ + ".wdf.sap.corp/"
				/* eslint-enable sap-no-hardcoded-url */
			};
			that.getModel("praUserContext").setProperty("/", oUserContext);
			that.getModel("praUserContext").firePropertyChange();
		},
		
		setLoggedInUser: function(){
		//	var oModel = new sap.ui.model.json.JSONModel("/services/userapi/currentUser");
			var oModel = new sap.ui.model.json.JSONModel(sap.ui.require.toUrl("sap/coe/rpa") + "/user-api/currentUser");
			this.setModel(oModel, "userModel");
		},

		getCRMserverFromSystem: function(sSystem) {
			var sServer;

			switch (sSystem.toLowerCase()) {
				case "pgd":
					sServer = "icd";
					break;
				case "pgt":
					sServer = "ict";
					break;
				case "pgp":
					sServer = "icp";
					break;
				default:
					sServer = "icd";
			}

			return sServer;
		},

		updateP13n: function(sPersonalizer, oPersData) {
			if (this[sPersonalizer]) {
				P13nHelper.saveData(this[sPersonalizer], oPersData);
			}

			if (sPersonalizer === "_calViewP13n") {
				this.getModel("p13nModel").setProperty("/viewKey", oPersData);
			}
		},

		_initP13n: function() {
			this._calViewP13n = P13nHelper.init(this, "calendar.settings", "viewKey");

			this._calSortP13n = P13nHelper.init(this, "calendarsort.settings", "calendarSortKey");
			this._calPersP13n = P13nHelper.init(this, "calendarpers.settings", "calendarPersKey");
			this._variantSortP13n = P13nHelper.init(this, "variantsort.settings", "variantsortKey");

			var oP13nModel = new sap.ui.model.json.JSONModel();
			this.setModel(oP13nModel, "p13nModel");

			P13nHelper.readData(this._calViewP13n, function(oPersData) {
				// Check if view key from p13n is valid
				if (P13nHelper.validateViewKey(oPersData)) {
					this.getModel("p13nModel").setProperty("/viewKey", oPersData);
				} else {
					// if not valid set to default view key
					this.getModel("p13nModel").setProperty("/viewKey", "6");
				}
			}.bind(this), function() {
				// if p13n request fails set to default view key
				this.getModel("p13nModel").setProperty("/viewKey", "6");
			}.bind(this));

			P13nHelper.readData(this._calPersP13n, function(oPersData) {
				if (oPersData !== undefined) {
					this.getModel("p13nModel").setProperty("/calPersKey", oPersData);
				}
				else {
					this.getModel("p13nModel").setProperty("/calPersKey", {empId: false, country: false, orgTxt: false, orgId: false});
				}
			}.bind(this), function() {
				// if p13n request fails set to default view key
				this.getModel("p13nModel").setProperty("/calPersKey", {empId: false, country: false, orgTxt: false, orgId: false});
			}.bind(this));
		},

		//IT Launchpad Mobile reporting
		_initMobileUsageReporting: function() {
			// Use Enterprise Mobility "Mobile Usage Reporting" framework
			try {
				/* eslint-disable sap-no-hardcoded-url */
				jQuery.sap.registerModulePath("sap.git.usage", "https://trackingshallwe.hana.ondemand.com/web-client/");
				/* eslint-enable sap-no-hardcoded-url */
				jQuery.sap.require("sap.git.usage.MobileUsageReporting");
				sap.git.usage.MobileUsageReporting.startReporting(this);
			} catch (err) {
				jQuery.sap.log.error("Could not load/inject MobileUsageReporting");
			}
		}
	});

});
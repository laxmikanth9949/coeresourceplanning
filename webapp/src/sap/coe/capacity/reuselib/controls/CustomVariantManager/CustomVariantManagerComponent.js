/**
 * @class
 * @name CustomVariantManagerComponent
 */
sap.ui.define([
	"sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
	"sap/coe/capacity/reuselib/utils/variantManager",
	"sap/coe/capacity/reuselib/utils/DataManager",
	"sap/coe/capacity/reuselib/utils/helpers",
	"sap/coe/capacity/reuselib/utils/i18n",
	"sap/coe/capacity/reuselib/utils/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/coe/capacity/reuselib/utils/P13nHelper"
], function (BaseFragmentComponent, variantUtil, DataManager, helpers, i18n, formatter, Filter, FilterOperator, MessageBox, MessageToast,
	P13nHelper) {
	"use strict";

	var CustomVariantManager = BaseFragmentComponent.extend(
		"sap.coe.capacity.reuselib.controls.CustomVariantManager.CustomVariantManagerComponent", {

			metadata: {
				properties: {
					// required when interacting with OData service to determine app in scope
					// RDL: SAP.COE.PLANNING.CALENDARPilot04; Capacity Analysis: SAP.COE.CAPACITY.ANALYSISPilot05; Team Calendar: SAP.COE.RPAPilot03
					appId: {
						type: "String",
						default: ""
					},
					// required when interacting with OData service, maps to backend table where data is stored
					// RDL: WORKLISTPilot04; Capacity Analysis: CAPACITYANALYSISPilot05; Team Calendar: TEAM_CALPilot03
					variantSet: {
						type: "String",
						default: ""
					},
					// can be function or object. If object it contains default variant settings. If function, that function can be called to retrieve default variant settings
					defaultVariant: {
						type: "Object",
						default: undefined
					},
					preventSearchAfterLoad: {
						type: "Boolean",
						default: true
					},
					//here we need to pass a controller with direct access to the component!!
					parentControllerContext: {
						type: "Object",
						default: undefined
					}
				},
				associations: {
					// associated filter bar where the custom variant manager will be inserted
					filterBar: {
						type: "sap.ui.comp.filterbar.FilterBar",
						multiple: false
					}
				}
			},

			renderer: {},

			/**
			 * This function is called when the component is being initialized
			 * @name init
			 * @function
			 * @return {void}
			 */
			init: function () {
				//Instantiate fragment controller and fragment
				this._initFragment(
					"",
					"sap.coe.capacity.reuselib.controls.CustomVariantManager.CustomVariantManager"
				);
				//allows us to access the parent controller so we can now access the application component from the scope of 
				//this controller
				//we have to use this to find the model in reuse library bc when this is called from analysis app
				//the view has a different utils model set to the view and we cannot update that app
				this.setModel(new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/model/utilsModel.json"),
					"ReuseModel");
			}

		});

	/* public functions */

	/**
	 * Function to update and activate the default variant
	 *
	 * @public
	 * @param {object} oDefaultVariantContent The content of the "VariantFilterModel" of the filter bar
	 * @return {object} oRequestSent The request sent for creation, with the property "results" added.
	 */
	CustomVariantManager.prototype.createDefaultVariant = function (oDefaultVariantContent) {
		var oDefaultVariant = {
				ApplicationId: this.getAppId(),
				VariantSetName: this.getVariantSet(),
				VariantDisplayName: "Default",
				VariantContent: JSON.stringify(oDefaultVariantContent),
				IsDefault: true,
				Editable: false,
				ExecuteOnSelect: false
			},
			oRequestSent = this._updateVariants([oDefaultVariant]);

		oRequestSent.VariantDetails.results = [oDefaultVariant];

		return oRequestSent;
	};

	/**
	 * Determines if variant or variant fields should be editable by the current user. Called as formatter of table cells and during onVariantSave function.
	 *
	 * @public
	 * @param {string} sScope - scope property of variant
	 * @return {string} sOwnerId - owner id of variant
	 * @return {boolean} true if variant is editable by current user, false if not editable
	 */
	CustomVariantManager.prototype.isEditable = function (sScope, sOwnerId) {
		var bEditable = sScope === "GLOBAL" && sOwnerId !== this.sEmployeeId ? false : true;
		return bEditable;
	};

	/**
	 * Setter for filterBar association, instantiates VariantItems model, adds CustomVariantManager to FilterBar toolbar, triggers _getVariants.
	 *
	 * @public
	 * @param {object} oDefaultVariantContent The content of the "VariantFilterModel" of the filter bar
	 * @return {object} oRequestSent The request sent for creation, with the property "results" added.
	 */
	CustomVariantManager.prototype.setFilterBar = function (oFilterBar) {
		var oItemModel = new sap.ui.model.json.JSONModel({
			Items: [],
			Active: undefined
		});
		oItemModel.setDefaultBindingMode("OneWay");
		oFilterBar.setModel(oItemModel, "VariantItems");

		// Add custom variant manager to toolbar
		if (oFilterBar._oToolbar && oFilterBar._oToolbar.insertContent) {
			oFilterBar._oToolbar.insertContent(this, 0);
			jQuery.sap.log.info("Custom Variant Manager successfully inserted to Filter Bar control");
		} else {
			jQuery.sap.log.error("Failed to add variant manager to Filter Bar");
			// TODO add to parent view?
		}
		// Set as global variable of component
		this.oFilterBar = oFilterBar;
		// Call _getVariants to read variant data for user
		this._getVariants();
		// Call _getEmployeeId to set employee ID - used to determine if variants are editable by current user
		this._getEmployeeId();
	};

	/* Service callback functions */

	/**
	 * Callback after create variant from the server
	 *
	 * @public
	 * @param {object} oData The data retrieved
	 * @return {void}
	 */
	CustomVariantManager.prototype.onCreateSuccess = function (oData) {
		var oVariantModel = this.oFilterBar.getModel("VariantItems"),
			oVariantData = oVariantModel.getProperty("/"),
			// TODO oNewVariant ever populated?
			oNewVariant = this._getNewVariantFromResponse(oData.VariantDetails.results),
			bCreatingDefaultVariant = false;

		oVariantData.Items = oData.VariantDetails.results;

		if (oNewVariant) {
			oVariantData.Active = oNewVariant;
		}

		if (!oVariantData.Active) {
			oVariantData.Active = this._getDefaultVariant(oVariantData.Items);
			bCreatingDefaultVariant = true;
		}

		this._refreshVariants(oVariantData);
		oVariantModel.updateBindings(true);

		if (bCreatingDefaultVariant) {
			this._updateFilterBarFields();
			this.oFilterBar.search();
		}
		sap.m.MessageToast.show(i18n.getText("MSG_TOAST_VARIANT_SAVE_SUCCESS"));
	};

	/**
	 * Callback after server error. It will display the error menssage store in the response.
	 *
	 * @public
	 * @param {object} oResponse The response from the server
	 * @return {void}
	 */
	CustomVariantManager.prototype.onErrorRequest = function (oResponse) {
		var sMessage = i18n.getText("MANAGEVARIANTS_DIALOG_SERVICE_ERROR"),
			that = this;

		if (oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value) {
			sMessage += "\n" + oResponse.error.message.value;
		} else if (oResponse && oResponse.responseText) {
			try {
				var oError = JSON.parse(oResponse.responseText);
				sMessage = oError.error && oError.error.message && oError.error.message.value ? sMessage + "\n" + oError.error.message.value :
					sMessage;
			} catch (err) {
				jQuery.sap.log.error(sMessage + " Failed to parse error text");
			}
		}

		MessageBox.error(sMessage, {
			title: i18n.getText("MANAGEVARIANTS_DIALOG_SERVICE_ERROR_TITLE"),
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			onClose: function (oAction) {
				if (oAction === "OK") {
					window.history.go(-1);
				}
			}.bind(that),
			styleClass: "",
			initialFocus: null,
			textDirection: sap.ui.core.TextDirection.Inherit
		});
	};

	/**
	 * Callback after successful read of variants from the server
	 *
	 * @public
	 * @param {object} oData The data retrieved
	 * @return {void}
	 */
	CustomVariantManager.prototype.onReadSuccess = function (oData) {
		this.fillFilterBarFromVariants(oData);
		this.oFilterBar.search();
	};

	CustomVariantManager.prototype.fillFilterBarFromVariants = function (oData) {
		var oVariantData = {},
			oDefaultVariant;

		if (oData.VariantDetails.results.length === 0) {
			// If no variants returned check defaultVariant property of Component
			// Some apps pass a function to retrieve defaultVariant settings other a variant object
			oDefaultVariant = this.getDefaultVariant();
			// if getDefaultVariant returns a function call that function
			// function should handle calling of createDefaultVariant function of component to create
			// variant via service and update filters
			if (typeof oDefaultVariant === "function") {
				oDefaultVariant();
				return;
			}
			// if getDefaultVariant is not a function call createDefaultVariant on default variant
			oData = this.createDefaultVariant(oDefaultVariant);
		}

		oVariantData.Items = oData.VariantDetails.results;
		oVariantData.Active = this._getDefaultVariant(oVariantData.Items);

		this._refreshVariants(oVariantData);

		if (!this.getPreventSearchAfterLoad()) {
			//fill FB from variants only if its NOT nav to from external app to worklist (coeplanningcalendar-Display) with pattern -Display&/XXXXXXXX
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			if (!sHash.includes("coeplanningcalendar-Display&/worklist")) {
				this._updateFilterBarFields();
			} else {
				//change the value binded variant title to reflect that we are not filling the filterbar based on variants, instead from the url
				this.getModel("VariantItems").setProperty("/Active/VariantDisplayName", i18n.getText("VARIANT_DISPLAYNAME_TITLE"));
			}
			this.setPreventSearchAfterLoad(false);
		}
	};

	/* Event handlers */

	/**
	 * Updates the IsDefault field of variant in TempVariant model
	 *
	 * @param {Object} oEvent - select event of sap.m.RadioButton
	 * @return {void}
	 * @public
	 */
	CustomVariantManager.prototype.onChangeDefault = function (oEvent) {
		var oRadioButton = oEvent.getSource(),
			sSelectedVariant = oRadioButton.getBindingContext("TempVariants").getObject().VariantId,
			oVariantItems = oRadioButton.getModel("TempVariants").getProperty("/").Items,
			i, l;

		for (i = 0, l = oVariantItems.length; i < l; i++) {
			// Find selected variant and update IsDefault property to true
			if (oVariantItems[i].VariantId === sSelectedVariant) {
				oVariantItems[i].IsDefault = true;
				// Else if not the selected variant and IsDefault is true, set to false
			} else if (oVariantItems[i].IsDefault === true) {
				oVariantItems[i].IsDefault = false;
			}
		}
	};

	/**
	 * Closes the dialog of button that triggers event
	 * 
	 * @param {oEvent} press event of button
	 * @return {void} 
	 * @public
	 */
	CustomVariantManager.prototype.onCloseDialog = function (oEvent) {
		oEvent.getSource().getParent().close();
	};

	/**
	 * Triggered after pressing the button "Ok" of the "Manage Variants" popup. Update the variant information when the user has made any change.
	 *
	 * @public
	 * @param {object} oEvent The event
	 * @return {void}
	 */
	CustomVariantManager.prototype.onCopyVariants = function (oEvent) {
		var oTempModel = oEvent.getSource().getModel("TempVariants"),
			oTempModelItems = oTempModel.getProperty("/Items"),
			oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable"),
			aSelectedItems = oSearchVariantTable.getSelectedItems(),
			fnAddToTempVariants = function (oVariant) {
				var i, l, bExists = false;
				// Checks if variant selected to be copied already exists in users variant list
				for (i = 0, l = oTempModelItems.length; i < l; i++) {
					if (oTempModelItems[i].VariantId === oVariant.VariantId) {
						bExists = true;
					}
				}
				// If does not already exist push to variant model, else display message toast
				if (!bExists) {
					if (oVariant.Scope === "LOCAL") {
						// Add NewCopy property as flag
						oVariant.NewCopy = true;
					}
					oVariant.IsDefault = false;
					oTempModelItems.push(oVariant);
				} else {
					sap.m.MessageToast.show(i18n.getText("MANAGEVARIANTS_VARIANT_ALREADY_COPIED", oVariant.VariantDisplayName));
				}

			};
		// Loop through selected variants
		aSelectedItems.forEach(function (aSelectedItem) {
			fnAddToTempVariants(aSelectedItem.getBindingContext().getObject());
		});
		// Update model bindings
		oTempModel.updateBindings();
		this._toggleManageView(1);
	};

	/**
	 * Updates Scope and IsSharing fields in TempVariant model
	 *
	 * @param {Object} oEvent - select event of sap.m.Select control
	 * @return {void}
	 * @public
	 */
	CustomVariantManager.prototype.onEditScope = function (oEvent) {
		var oSelect = oEvent.getSource(),
			oVariant = oSelect.getBindingContext("TempVariants").getObject(),
			bGlobal = oVariant.Scope === "GLOBAL" ? true : false;

		oVariant.Scope = bGlobal ? "GLOBAL" : "LOCAL";
		oVariant.IsSharing = bGlobal;

		oSelect.getModel("TempVariants").updateBindings(true);
	};

	CustomVariantManager.prototype.onLiveChange = function (oEvent) {
		var oOkButton = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "okBtn");
		var sInputString = oEvent.getParameter("value");
		var bEnabled = sInputString !== "" ? true : false;

		oOkButton.setEnabled(bEnabled);
	};

	/**
	 * Handles enabling/disabling Save As dialog OK button. Only enabled if variant name has been entered.
	 *
	 * @public
	 * @param {object} oEvent - change event of variant name input
	 * @return {void}
	 */
	CustomVariantManager.prototype.onEnterVariantName = function (oEvent) {
		var oOkButton = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "okBtn"),
			oNameInput = oEvent.getSource();

		if (oNameInput.getValue()) {
			oOkButton.setEnabled(true);
		}
	};

	/**
	 * Handles Down Arrow button press. Opens VariantSelectList dialog.
	 *
	 * @public
	 * @param {object} event triggered by press of Down Arrow button in FilterBar
	 * @return {void}
	 */
	CustomVariantManager.prototype.onOpenVariantManager = function (oEvent) {
		var sFragmentId = this._sFragmentId + "--" + "VariantSelectList";
		if (!this._oVariantSelectList) {
			this._oVariantSelectList = helpers.initializeFragmentFromObject({
				oParentController: this,
				sFragment: "sap.coe.capacity.reuselib.controls.CustomVariantManager.fragment.VariantSelectList",
				sCreateId: sFragmentId
			});
		}
		this._oVariantSelectList.openBy(oEvent.getSource());
	};

	/**
	 * Handles Save as button press, opens dialog
	 *
	 * @public
	 * @param {object} event triggered by press of "Save as" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onSaveAs = function (oEvent) {
		var sFragmentId = this._sFragmentId + "--" + "SaveAsDialog";
		if (!this.oSaveAsDialog) {
			this.oSaveAsDialog = helpers.initializeFragmentFromObject({
				oParentController: this,
				sFragment: "sap.coe.capacity.reuselib.controls.CustomVariantManager.fragment.SaveAsDialog",
				sCreateId: sFragmentId
			});
		}

		// Only for the planning calendar, which uses its own custom 'saveas' dialog
		if (this.getAppId() !== "SAP.COE.PLANNING.CALENDARPilot04") {
			/*UI Changes needed, moved to next wave
			var oRadioBtnBoxSaveDate = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantDates");
			oRadioBtnBoxSaveDate.setVisible(false);*/

			var oCheckBoxSaveDate = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantSaveDate"),
				oCheckBoxSaveColumns = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForColumnSaving");
			oCheckBoxSaveDate.setVisible(false);
			oCheckBoxSaveColumns.setVisible(false);
		}
		this.oSaveAsDialog.open();
	};

	/**
	 * Updates binding of table based on Employee ID entered in input, and adjusts title text
	 *
	 * @return {void}
	 * @public
	 */
	CustomVariantManager.prototype.onSearchEmployeeVariants = function () {
		var oEmployeeInput = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "empSelect").getFragment(),
			oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable"),
			oListItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{VariantDisplayName}"
					}),
					new sap.m.Text({
						text: "{OwnerId}"
					}),
					new sap.m.Text({
						text: "{OrgId}"
					}),
					new sap.m.Text({
						text: "{OrgTxt}"
					}),
					new sap.m.Text({
						text: "{= ${Scope} === 'LOCAL' ? ${i18n>MANAGEVARIANTS_DIALOG_VARIANT_COMBO_PRIVATE} : ${i18n>MANAGEVARIANTS_DIALOG_VARIANT_COMBO_GLOBAL} }"
					})
				]
			});

		oSearchVariantTable.bindItems({
			path: "/VariantDetails",
			template: oListItemTemplate,
			filters: [new Filter("ApplicationId", FilterOperator.EQ, this.getAppId()),
				new Filter("VariantSetName", FilterOperator.EQ, this.getVariantSet()),
				new Filter("OwnerId", FilterOperator.EQ, oEmployeeInput.getValue().trim())
			]
		});

		oSearchVariantTable.setVisible(true);
		this._oManageVariant.setTitle(i18n.getText("MANAGEVARIANTS_DIALOG_TITLE_COPY_EMPLOYEEID") + " " + oEmployeeInput.getValue().trim());
	};

	/**
	 * Triggered when the user select a different variant in list of variants of the "Variants" popup
	 *
	 * @public
	 * @param {object} event triggered by selectionChange event of sap.m.SelectList
	 * @return {void}
	 */
	CustomVariantManager.prototype.onSelectionChange = function (oEvent) {
		var oFilterBar = this.oFilterBar,
			oVariantModel = oFilterBar.getModel("VariantItems"),
			sSelectedKey = oVariantModel.getProperty(oEvent.getParameter("listItem").getBindingContext("VariantItems").sPath).VariantId,
			oSelectedVariant = this._getVariantByKey(sSelectedKey);

		oVariantModel.setProperty("/Active", oSelectedVariant);

		this._updateFilterBarFields();
		oFilterBar.search();
		this._oVariantSelectList.close();
	};

	/**
	 * Triggered after pressing the delete button of the ManageVariants dialog table. Removes deleted variant from TempVariants model.
	 *
	 * @public
	 * @param {object} event triggered by press of delete button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onVariantDelete = function (oEvent) {
		var oButton = oEvent.getSource(),
			oTempModel = oButton.getModel("TempVariants"),
			oTempModelItems = oTempModel.getProperty("/Items"),
			oVariant = oButton.getBindingContext("TempVariants").getObject(),
			i, l;

		// checks if this is a 'Global' variant the user has created and has been copied by other people
		if (oVariant.LinkedRes !== "" && oVariant.OwnerId === this.sEmployeeId) {
			var that = this,
				sMessage = i18n.getText("FRAGMENT_DELETE_GLOBAL_VARIANT_WARNING_1") + "\n\n" + oVariant.LinkedRes + i18n.getText(
					"FRAGMENT_DELETE_GLOBAL_VARIANT_WARNING_2");

			return sap.m.MessageBox.warning(sMessage, {
				title: i18n.getText("FRAGMENT_DELETE_GLOBAL_VARIANT_TITLE"),
				actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction === "DELETE") {
						for (i = 0, l = oTempModelItems.length; i < l; i++) {
							if (oTempModelItems[i].VariantId === oVariant.VariantId) {
								oTempModelItems.splice(i, 1);
								oTempModel.updateBindings();
								break;
							}
						}
					}
				}.bind(that),
				styleClass: "",
				initialFocus: null,
				textDirection: sap.ui.core.TextDirection.Inherit
			});
		} else {
			for (i = 0, l = oTempModelItems.length; i < l; i++) {
				if (oTempModelItems[i].VariantId === oVariant.VariantId) {
					oTempModelItems.splice(i, 1);
					oTempModel.updateBindings();
					break;
				}
			}
		}
	};

	/**
	 * `Checks if the user has left the variant name field blank, updates validation status.
	 *
	 * @public
	 * @param {object} event triggered by press of "OK" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onLiveChangeVariantName = function (oEvent) {
		var oVariantNameInput = oEvent.getSource(),
			oVariantNameValue = oEvent.getParameter("value"),
			sValueState = oVariantNameValue !== "" ? "None" : "Error",
			sValueStateText = oVariantNameValue !== "" ? "" : "MANAGEVARIANTS_DIALOG_VARIANT_BLANK_VALUESTATE_MSG";

		oVariantNameInput.setValueState(sValueState);
		oVariantNameInput.setValueStateText(i18n.getText(sValueStateText));
	};

	/**
	 * Triggered after pressing the button "OK" of the ManageVariants dialog. Passes edited variants from TempVariant model to _updateVariants to be saved to service.
	 *
	 * @public
	 * @param {object} event triggered by press of "OK" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onVariantsEdit = function (oEvent) {
		var oTempModelItems = oEvent.getSource().getModel("TempVariants").getProperty("/Items"),
			bValidVariantName = true,
			bNoDuplicateVariantNames = true;

		oTempModelItems.forEach(function (oVariant) {
			if (oVariant.VariantDisplayName === "") {
				bValidVariantName = false;
			}
			if (oVariant.NewCopy) {
				// If a NewCopy, this variant is being copied from another user
				// Properties VariantId and OwnerId need to be delete to allow backend to generate these fields
				delete oVariant.VariantId;
				delete oVariant.OwnerId;
				delete oVariant.NewCopy;
			}

			for (var i = oTempModelItems.length - 1; i >= 0; i--) {
				if (oVariant.VariantId !== oTempModelItems[i].VariantId) {
					if ((oVariant.VariantDisplayName.toUpperCase() === oTempModelItems[i].VariantDisplayName.toUpperCase()) && (oVariant.IsLinked !==
							true || oTempModelItems[i].IsLinked !== true)) {
						bNoDuplicateVariantNames = false;
					}
				}
			}
		});

		// If a variant name is left blank, display a warning message
		if (!bValidVariantName) {
			MessageBox.warning(i18n.getText("MANAGEVARIANTS_DIALOG_VARIANT_MSGTOAST_EMPTYNAME"));
		}
		// If a variant name matches another, display a warning message
		else if (!bNoDuplicateVariantNames) {
			MessageBox.warning(i18n.getText("MANAGEVARIANTS_DIALOG_VARIANT_MSGTOAST_DUPLICATENAME"));
		} else {
			this._updateVariants(oTempModelItems);
			this.onCloseDialog(oEvent);
		}
	};

	/**
	 * Handles Manage button press, opens dialog
	 *
	 * @public
	 * @param {object} event triggered by press of "Manage" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onVariantManage = function (oEvent) {
		// Create temp model with copy of VariantItems data so it can be edited in ManageVariant dialog
		var oTempModel = new sap.ui.model.json.JSONModel($.extend(true, {}, this.oFilterBar.getModel("VariantItems").oData));
		var sFragmentId = this._sFragmentId + "--" + "ManageVariant";
		if (!this._oManageVariant) {
			this._oManageVariant = helpers.initializeFragmentFromObject({
				oParentController: this,
				sFragment: "sap.coe.capacity.reuselib.controls.CustomVariantManager.fragment.ManageVariant",
				sCreateId: sFragmentId
			});
		} else {
			// if manage variant fragment already instantiated, reset to first "view"
			this._toggleManageView(1);
		}
		this._oManageVariant.setModel(oTempModel, "TempVariants");
		this._oManageVariant.open();
	};

	//this function returns a string representing the name of the current active variant.
	CustomVariantManager.prototype.getActiveVariantName = function () {
		var oActiveVariant = this.oFilterBar.getModel("VariantItems").getProperty("/Active");
		return oActiveVariant.VariantDisplayName;
	};

	/**
	 * Handles Save button press. Populates latest filter criteria to the active variant and triggers _updateVariants to save data to service.
	 *
	 * @public
	 * @param {object} event triggered by press of "Save" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onVariantSave = function (oEvent) {
		var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
			oNewFilter = this.oFilterBar.getModel("VariantFilterModel").getProperty("/"),
			oActiveVariant = this.oFilterBar.getModel("VariantItems").getProperty("/Active"),
			sNewFilter = JSON.stringify(oNewFilter),
			sName = this.getActiveVariantName(),
			bIsVariantUpdated = false;

		// Check if variant is editable using isEditable function - if scope is GLOBAL and variant is not owned by current user
		// saving changes to the variant should not be possible
		if (this.isEditable(oActiveVariant.Scope, oActiveVariant.OwnerId)) {
			// checks if this is a 'Global' variant the user has created and has been copied by other people
			if (oActiveVariant.LinkedRes !== "" && oActiveVariant.OwnerId === this.sEmployeeId) {
				var that = this,
					sMessage = i18n.getText("FRAGMENT_SAVE_GLOBAL_VARIANT_WARNING_1") + "\n\ \n\ " + oActiveVariant.LinkedRes + i18n.getText(
						"FRAGMENT_SAVE_GLOBAL_VARIANT_WARNING_2");
				return sap.m.MessageBox.warning(sMessage, {
					title: i18n.getText("FRAGMENT_SAVE_GLOBAL_VARIANT_TITLE_WARNING"),
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === "OK") {
							for (var i = aVariants.length - 1; i >= 0; i--) {
								if (aVariants[i].VariantDisplayName === sName &&
									aVariants[i].VariantContent !== sNewFilter) {
									aVariants[i].VariantContent = sNewFilter;
									this._updateVariants();
									break;
								}
							}
						}
					}.bind(that),
					styleClass: "",
					initialFocus: null,
					textDirection: sap.ui.core.TextDirection.Inherit
				});
			} else {
				//loops through variants to see if there is any changes to push to the network
				for (var i = aVariants.length - 1; i >= 0; i--) {
					if (aVariants[i].VariantDisplayName === sName && aVariants[i].VariantContent !== sNewFilter) {
						aVariants[i].VariantContent = sNewFilter;
						this._updateVariants();
						bIsVariantUpdated = true;
						break;
					}
				}
				if (!bIsVariantUpdated) {
					sap.m.MessageToast.show(i18n.getText("MSG_TOAST_VARIANT_UPTO_DATE", [sName]));
				}
			}
		} else {
			// Display message if variant is not editable
			sap.m.MessageBox.error(i18n.getText("SAVE_NOT_OWN_GLOBAL_VARIANT_MSG", oActiveVariant.OwnerId));
			// temp removed, bug not fully fixed, needs more investigation
			// If the default variant is a linked global variant we need to trigger a search to backend

		}
		this._oVariantSelectList.close();
	};

	/**
	 * Handles OK button press from SaveAsDialog. Parses new variant properties based on checkbox selections and triggers _updateVariants to save data to service.
	 *
	 * @public
	 * @param {object} event triggered by press of "OK" button
	 * @return {void}
	 */
	CustomVariantManager.prototype.onVariantSaveAs = function (oEvent) {
		var oVariantNameInput = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantName"),
			oCheckBoxShare = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantSharing"),
			oCheckBoxSaveDate = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantSaveDate"),
			/*oRadioBtnSaveDate = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantSaveDate"),
			oRadioBtnSaveRange = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantSaveRange"),*/
			oCheckBoxDefault = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForVariantDefault"),
			oCheckBoxColumns = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "SaveAsDialog", "idForColumnSaving"),
			aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
			oNewFilter = this.oFilterBar.getModel("VariantFilterModel").getProperty("/"),
			sName = oVariantNameInput.getValue().trim(),
			bIsDefault = oCheckBoxDefault.getSelected(),
			oNewVariant,
			oOldDefaultVariant;

		// Only for the planning calendar, which uses its own custom 'saveas' dialog
		if (this.getAppId() === "SAP.COE.PLANNING.CALENDARPilot04") {
			// if the user doesn't select to save the dates then remove them from the model before saving
			if (!oCheckBoxSaveDate.getSelected()) {
				delete oNewFilter.startDate;
				delete oNewFilter.endDate;
			}

			/*UI Changes needed, moved to next wave
			if (!oRadioBtnSaveDate.getSelected()) {
			    delete oNewFilter.startDate;
			    delete oNewFilter.endDate;
			}
			if (oRadioBtnSaveDate.getSelected()) {
			    oNewFilter.staticDateSaved = true;
			    oNewFilter.staticRangeSaved = false;
			}
			if(oRadioBtnSaveRange.getSelected()) {
			    oNewFilter.dateRangePast = this.getParentControllerContext().oDateRangePast;
			    oNewFilter.dateRangeFuture = this.getParentControllerContext().oDateRangeFuture;
			    oNewFilter.staticDateSaved = false;
			    oNewFilter.staticRangeSaved = true;
			}*/
			if (oCheckBoxColumns.getSelected()) {
				oNewFilter.columnData = this.getParentControllerContext().aColumnSettingsData;
			}
		}

		oNewVariant = {
			ApplicationId: this.getAppId(),
			VariantSetName: this.getVariantSet(),
			VariantDisplayName: sName,
			VariantContent: JSON.stringify(oNewFilter),
			// Scope of new variant is determined in backend logic by IsSharing setting (Scope does not need to be set here)
			// true = GLOBAL variant, false = LOCAL/private variant
			IsSharing: oCheckBoxShare.getSelected(),
			IsDefault: bIsDefault,
			Editable: false,
			ExecuteOnSelect: false
		};

		if (oNewVariant.IsDefault) {
			oOldDefaultVariant = this._getDefaultVariant();
			oOldDefaultVariant.IsDefault = false;
		}

		aVariants.push(oNewVariant);
		this._updateVariants();
		this.onCloseDialog(oEvent);
	};

	CustomVariantManager.prototype.onGlobalVariantLiveSearch = function (oEvent) {
		var sSearchValue = oEvent.getParameter("newValue");
		this.filterGlobalVariants(sSearchValue);
	};

	CustomVariantManager.prototype.onGlobalVariantSearch = function (oEvent) {
		var sSearchValue = oEvent.getParameter("query");
		this.filterGlobalVariants(sSearchValue);
	};

	CustomVariantManager.prototype.filterGlobalVariants = function (sSearchValue) {
		var oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable");
		var oBinding = oSearchVariantTable.getBinding("items");
		//check if search field is empty
		if (sSearchValue) {
			var aFilter = [];
			aFilter.push(new Filter("OwnerId", FilterOperator.Contains, sSearchValue));
			aFilter.push(new Filter("VariantDisplayName", FilterOperator.Contains, sSearchValue));
			oBinding.filter(new sap.ui.model.Filter(aFilter, false));
		} else {
			oBinding.filter(null);
		}
	};
	/**
	 * Toggles visiblity of elements in ManageVariant dialog if user is searching for variants or managing their own variants
	 *
	 * @return {void}
	 * @public
	 */
	CustomVariantManager.prototype.searchGlobalVariant = function () {
		var oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable");
		var oListItemTemplate = new sap.m.ColumnListItem({
			cells: [
				new sap.m.Text({
					text: "{VariantDisplayName}"
				}),
				new sap.m.Text({
					text: "{OwnerId}"
				}),
				new sap.m.Text({
					text: "{OrgId}"
				}),
				new sap.m.Text({
					text: "{OrgTxt}"
				}),
				new sap.m.Text({
					text: "{= ${Scope} === 'LOCAL' ? ${i18n>MANAGEVARIANTS_DIALOG_VARIANT_COMBO_PRIVATE} : ${i18n>MANAGEVARIANTS_DIALOG_VARIANT_COMBO_GLOBAL} }"
				})
			]
		});
		var aFilters = [new Filter("ApplicationId", FilterOperator.EQ, this.getAppId()),
			new Filter("VariantSetName", FilterOperator.EQ, this.getVariantSet()),
			new Filter("Scope", FilterOperator.EQ, "GLOBAL")
		];
		// Update dialog to show global variant table
		this._toggleManageView(2, false);

		oSearchVariantTable.setBusy(true);
		this.oFilterBar.getModel().read("/VariantDetails", {
			filters: aFilters,
			success: function (oData) {
				//put the network response into a JSON model so that we can perform client side filtering on the table
				var oJSONModelVariantSet = new sap.ui.model.json.JSONModel();
				oJSONModelVariantSet.setData(oData);
				oSearchVariantTable.setModel(oJSONModelVariantSet);
				oSearchVariantTable.bindItems("/results", oListItemTemplate);
				oSearchVariantTable.setBusy(false);
			},
			error: function (oResponse) {}
		});
	};

	CustomVariantManager.prototype.onSortTablePress = function (oEvent) {
		//makes sure the UI model is up to date so we can bind correctly with fragment below
		this.prepareSortVariantsModel();

		if (!this._oDialogTableSettings) {
			this._oDialogTableSettings = helpers.initializeFragmentFromObject({
				oParentController: this,
				sFragment: "sap.coe.capacity.reuselib.controls.CustomVariantManager.fragment.SortVariants",
				sCreateId: this._sFragmentId + "--" + "SortVariantTable",
				oModel: this.getModel("ReuseModel")
			});
		}
		this._oDialogTableSettings.open();
	};

	// called when fragment is opened, updates table sorting with sort options from p13n, passes table within fragment to be sorted
	CustomVariantManager.prototype.onAfterOpenManageVariant = function (oEvent) {
		var oTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "manageVariantsTable");
		this.sortVariantTableP13n(oTable);
	};

	//called when fragment is opened, updates table sorting with sort options from p13n, passes table within fragment to be sorted
	CustomVariantManager.prototype.onAfterOpenVariantSelectList = function (oEvent) {
		var oTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "VariantSelectList", "timeAllocationsTable");
		this.sortVariantTableP13n(oTable);
	};

	// reads p13n sort settings from app component and applies them to table
	//currently two possible tables that should sorted (see calling functions)
	CustomVariantManager.prototype.sortVariantTableP13n = function (oTable) {

		//since we cannot update any of capacity analysis code base this is a workaround!
		//we cant update component so we just remove p13n behaviour when we access from that
		//app.... if from capacity analysis do nothing!
		if (this.getAppId() !== "SAP.COE.CAPACITY.ANALYSISPilot05") {

			P13nHelper.readData(this.getParentControllerContext().getOwnerComponent()._variantSortP13n, function (oSortOptionData) {
				if (oSortOptionData) {
					var oSorter = new sap.ui.model.Sorter(oSortOptionData.sortItem, oSortOptionData.sortDescending);

					var oBinding = oTable.getBinding("items");

					// sorting must be done on client side
					oBinding.bClientOperation = true;
					oBinding.aAllKeys = true;
					oBinding.sOperationMode = "Client";
					oBinding.sort(oSorter);
					oBinding.bClientOperation = false;
					oBinding.aAllKeys = null;
					oBinding.sOperationMode = "Server";

				}
			}.bind(this));
		}
	};

	CustomVariantManager.prototype.prepareSortVariantsModel = function () {
		var aSortItems = this.getModel("ReuseModel").getProperty("/VariantSortUIModel/SortItems");
		var sDefaultSortItemKey = this.getModel("ReuseModel").getProperty("/VariantSortUIModel/DefaultSortItemKey");

		//loops through the model and sets selected to true for the appropriate item,

		for (var key in aSortItems) {
			if (aSortItems.hasOwnProperty(key)) {
				if (aSortItems[key].key === sDefaultSortItemKey) {
					aSortItems[key].selected = true;
					break;
				}
			}
		}
	};

	//called when click ok on sort dialog
	CustomVariantManager.prototype.onConfirmSort = function (oEvent) {
		var oManageVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "manageVariantsTable"),
			oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable"),
			oSortTable = oManageVariantTable.getVisible() === true ? oManageVariantTable : oSearchVariantTable,
			oBinding = oSortTable.getBinding("items"),
			mParams = oEvent.getParameters(),
			sPath = mParams.sortItem.getKey(),
			bDescending = mParams.sortDescending;

		var oSorter = new sap.ui.model.Sorter(sPath, bDescending);
		if (sPath === "OrgId") {
			oSorter.fnCompare = function (value1, value2) {
				value2 = parseFloat(value2);
				value1 = parseFloat(value1);
				if (value1 < value2) return -1;
				if (value1 === value2) return 0;
				if (value1 > value2) return 1;
			};
		}

		this._handleModelOperationsInClient(oBinding, true);
		oBinding.sort(oSorter);
		this._handleModelOperationsInClient(oBinding, false);

		//we save the selected sort options to the app comp using p13n service 
		//if statement, we cant update analysis app so we avoid here
		if (this.getAppId() !== "SAP.COE.CAPACITY.ANALYSISPilot05") { //NOTE prob change to app id!!
			this.getParentControllerContext().getOwnerComponent().updateP13n("_variantSortP13n", {
				sortItem: sPath,
				sortDescending: bDescending
			});
		}

	};

	CustomVariantManager.prototype._handleModelOperationsInClient = function (oDataModel, bPerformInClient) {
		if (bPerformInClient) {
			oDataModel.bClientOperation = true;
			oDataModel.aAllKeys = true;
			oDataModel.sOperationMode = "Client";
		} else {
			oDataModel.bClientOperation = false;
			oDataModel.aAllKeys = null;
			oDataModel.sOperationMode = "Server";
		}
	};

	/**
	 * Toggles ManageVariant "views" bsaed on table toolbar button pressed
	 *
	 * @param {object} event by sap.m.Button in table toolbar
	 * @return {void}
	 * @public
	 */
	CustomVariantManager.prototype.toggleVariantTable = function (oEvent) {
		var bShowSearch = oEvent.getSource().getId().indexOf("idLinkToSearchVariants") > -1;

		if (bShowSearch) {
			this._toggleManageView(2, true);
		} else {
			this._toggleManageView(1);
		}
	};

	/* private functions */

	/**
	 * Loops through variants and returns variant with IsDefault true
	 *
	 * @private
	 * @param {object[]} aItems - set of variants
	 * @return {object|null} default variant
	 */
	CustomVariantManager.prototype._getDefaultVariant = function (aItems) {
		var aVariants = aItems || this.oFilterBar.getModel("VariantItems").getProperty("/Items");

		for (var i = aVariants.length - 1; i >= 0; i--) {
			if (aVariants[i].IsDefault) {
				return aVariants[i];
			}
		}

		return null;
	};

	/**
	 * Sets employee id of current user to global variant sEmployeeId
	 *
	 * @private
	 * @return {void}
	 */
	CustomVariantManager.prototype._getEmployeeId = function () {
		// Checks if running in sandbox or standalone mode, if so call to service call is required to retrieve ID
		if (sap.ushell.__sandbox__ || sap.ushell.Container.getUser().getId() === "DEFAULT_USER") {
			DataManager.getUserOrgUnit(this, "", function (oData, aParams, that) {
				that.sEmployeeId = oData.EmpId;
			});
			// Else when running in FLP, retrieve employee ID from shell
		} else {
			this.sEmployeeId = this.getModel("userModel").getData().name;
		}
	};

	/**
	 * Loops through variants and returns variant with id that matches argument sKey
	 *
	 * @private
	 * @param {string} sKey - variant id
	 * @return {object|null} variant that matches key
	 */
	CustomVariantManager.prototype._getVariantByKey = function (sKey) {
		var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items");

		for (var i = aVariants.length - 1; i >= 0; i--) {
			if (aVariants[i].VariantId === sKey) {
				return aVariants[i];
			}
		}
		return null;
	};

	/**
	 * Generates service call to retrieve variants
	 *
	 * @private
	 * @return {void}
	 */
	CustomVariantManager.prototype._getVariants = function () {
		var oModel = this.oFilterBar.getModel(),
			that = this;

		oModel.read("/SearchVariants(ApplicationId='" + this.getAppId() + "',VariantSetName='" + this.getVariantSet() + "')", {
			urlParameters: {
				"$expand": "VariantDetails"
			},
			success: that.onReadSuccess.bind(that),
			error: that.onErrorRequest.bind(that)
		});
	};

	/**
	 * Populates updated set of variants into the VariantItems model
	 *
	 * @private
	 * @param {object} oNewVariantData - updated variants
	 * @return {void}
	 */
	CustomVariantManager.prototype._refreshVariants = function (oNewVariantData) {
		var oVariantModel = this.oFilterBar.getModel("VariantItems"),
			oVariantData = oNewVariantData || oVariantModel.getProperty("/");

		oVariantModel.setProperty("/", {});
		oVariantModel.setProperty("/", oVariantData);
	};

	/**
	 * Toggles visibility and settings of elements in ManageVariant dialog
	 *
	 * @private
	 * @param {integer} nPageNo - flag to indicate which elements should be shown
	 * @param {boolean} bEmployeeSearch - on secondary view determines if employee search grid is visible
	 * @return {void}
	 */
	CustomVariantManager.prototype._toggleManageView = function (nPageNo, bEmployeeSearch) {
		var oManageVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "manageVariantsTable"),
			oSearchVariantTable = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchVariantsTable"),
			oSearchGrid = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchGrid"),
			oSaveButton = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "btnSave"),
			oCopyButton = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "btnCopy"),
			oSearchGlobalVariants = sap.ui.core.Fragment.byId(this._sFragmentId + "--" + "ManageVariant", "searchGlobalVariants");

		if (nPageNo === 1) {
			oManageVariantTable.setVisible(true);
			oSearchVariantTable.setVisible(false);
			oSearchGrid.setVisible(false);
			oCopyButton.setVisible(false);
			oSaveButton.setVisible(true);
			oSearchGlobalVariants.setValue(null);
			this._oManageVariant.setTitle(i18n.getText("MANAGEVARIANTS_DIALOG_TITLE"));
		} else {
			oManageVariantTable.setVisible(false);
			oSearchGrid.setVisible(bEmployeeSearch);
			oCopyButton.setVisible(true);
			oSaveButton.setVisible(false);
			if (bEmployeeSearch) {
				this._oManageVariant.setTitle(i18n.getText("MANAGEVARIANTS_DIALOG_TITLE_COPY"));
				oCopyButton.setText(i18n.getText("MANAGEVARIANTS_DIALOG_COPY_BUTTON"));
			} else {
				this._oManageVariant.setTitle(i18n.getText("MANAGEVARIANTS_DIALOG_TITLE_GLOBAL"));
				oCopyButton.setText(i18n.getText("MANAGEVARIANTS_DIALOG_CREATE_LINK_BUTTON"));
				oSearchVariantTable.setVisible(true);
			}
			// Remove previous search results
			oSearchVariantTable.unbindItems();
		}
	};

	/**
	 * Updates VariantFilterModel with content from active variant
	 *
	 * @private
	 * @return {void}
	 */
	CustomVariantManager.prototype._updateFilterBarFields = function () {
		var oFilterModel = this.oFilterBar.getModel("VariantFilterModel"),
			oActiveVariant = this.oFilterBar.getModel("VariantItems").getProperty("/Active"),
			oVariantContent = JSON.parse(oActiveVariant.VariantContent);

		// Only for the planning calendar,  if the user has saved a date value then use that
		// else use the default date range value
		if (this.getAppId() === "SAP.COE.PLANNING.CALENDARPilot04") {
			if (oVariantContent.hasOwnProperty("startDate")) {
				oVariantContent.startDate = new Date(oVariantContent.startDate);
				oVariantContent.endDate = new Date(oVariantContent.endDate);
				oVariantContent.staticDateSaved = true;
			} else {
				oVariantContent.staticDateSaved = false;
			}

			/*UI Changes needed, moved to next wave
			if (oVariantContent.staticDateSaved) {
			    oVariantContent.startDate = new Date(oVariantContent.startDate);
			    oVariantContent.endDate = new Date(oVariantContent.endDate);
			}
			else if (oVariantContent.staticRangeSaved) {
			    var aDateRange = helpers.getDateRangeForNumberOfWeeks(new Date(), oVariantContent.dateRangeFuture, oVariantContent.dateRangePast);
			    oVariantContent.startDate = new Date(aDateRange[0]);
			    oVariantContent.endDate = new Date(aDateRange[1]);
			}
			else {
			    var aDateRange = helpers.getDateRangeForNumberOfWeeks(new Date(), this.getParentControllerContext().oDateRangeFuture, this.getParentControllerContext().oDateRangePast);
			    oVariantContent.startDate = new Date(aDateRange[0]);
			    oVariantContent.endDate = new Date(aDateRange[1]);
			}*/

			if (oVariantContent.columnData) {
				this.getParentControllerContext()._oP13nModel.setProperty("/Columns", oVariantContent.columnData);
				this.getParentControllerContext()._refreshColumnData(oVariantContent.columnData);
			} else {
				this.getParentControllerContext()._oP13nModel.setProperty("/Columns", this.getParentControllerContext().aColumnSettingsData);
				this.getParentControllerContext()._refreshColumnData(this.getParentControllerContext().aColumnSettingsData);
			}
		}
		oFilterModel.setProperty("/", oVariantContent);
	};

	/**
	 * Generates POST request to service with updated variants to be saved
	 *
	 * @param {integer} aNewVariants - set of variants
	 * @private
	 * @return {void}
	 */
	CustomVariantManager.prototype._updateVariants = function (aNewVariants) {
		var that = this,
			oModel = this.oFilterBar.getModel(),
			aVariants = aNewVariants || this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
			oRequestCreate = {
				ApplicationId: this.getAppId(),
				VariantSetName: this.getVariantSet(),
				VariantDetails: aVariants
			};

		oModel.create("/SearchVariants", oRequestCreate, {
			success: that.onCreateSuccess.bind(that),
			error: that.onErrorRequest.bind(that)
		});

		return oRequestCreate;
	};

	// TODO needed? Variant shouldn't return without Id so always returns undefined.
	CustomVariantManager.prototype._getNewVariantFromResponse = function (aNewVariants) {
		var aVariants = this.oFilterBar.getModel("VariantItems").getProperty("/Items"),
			oInsertedVariant, oNewVariant;

		for (var i = aVariants.length - 1; i >= 0; i--) {
			if (!aVariants[i].VariantId) {
				oInsertedVariant = aVariants[i];
				break;
			}
		}

		if (!oInsertedVariant) {
			return undefined;
		}

		for (i = aNewVariants.length - 1; i >= 0; i--) {
			if (aNewVariants[i].VariantDisplayName === oInsertedVariant.VariantDisplayName) {
				oNewVariant = aNewVariants[i];
				break;
			}
		}

		return oNewVariant;
	};

	return CustomVariantManager;

});
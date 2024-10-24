sap.ui.define([
	"sap/coe/capacity/reuselib/utils/DataManager",
	"sap/coe/capacity/reuselib/utils/TokenHelper"
], function (DataManager, TokenHelper) {
	"use strict";

	var ManageVariant = {};

	ManageVariant.initManage = function (sUser, oFilterBar, sAppId, sVariantSet, fnDefault) {
		var oValue = {
			AppId: sAppId,
			VariantSet: sVariantSet
		};
		oFilterBar.addCustomData(new sap.ui.core.CustomData({
			key: sUser,
			value: oValue
		}));
		TokenHelper.applyToFBItem(oFilterBar, "sap.m.MultiInput", TokenHelper._setValidator);
		TokenHelper.applyToFBItem(oFilterBar, "sap.m.MultiComboBox", TokenHelper._setTokenChange, true);
		ManageVariant._attachFilterBarEvents(oFilterBar._oVariantManagement, oFilterBar);
		oFilterBar.setModel(new sap.ui.model.json.JSONModel(), "VariantItems");
		ManageVariant.getVariants(oFilterBar, sAppId, sVariantSet, fnDefault);
	};

	ManageVariant._attachFilterBarEvents = function (oVariantManager, oFilterBar) {
		oVariantManager.oManagementSave.attachPress(ManageVariant.onHandleVaraiantManage, oFilterBar);
		oVariantManager.oVariantList.attachSelectionChange(ManageVariant.onVariantSelectionChange, oFilterBar);
		oVariantManager.oSaveSave.attachPress(ManageVariant.onSaveAsVariant, oFilterBar);
		oVariantManager.oVariantPopOver.attachBeforeOpen(
			ManageVariant._beforeOpenVariantList, oVariantManager.oVariantList);
		oVariantManager.oVariantManage.attachPress(ManageVariant._beforeOpenVariantList, oVariantManager.oManagementTable);
	};

	ManageVariant.onSaveAsVariant = function (oEvent) {
		var oCustomDataValue = this.getCustomData()[0].getValue();
		var sAppId = oCustomDataValue.AppId;
		var sVariantSet = oCustomDataValue.VariantSet;
		var bIsDefault = this._oVariantManagement.oDefault.getProperty("selected");
		ManageVariant.saveVariant(sAppId, sVariantSet, this.getModel("VariantItems").getData(),
			this._oVariantManagement.oInputName.getValue(), bIsDefault, this);
	};

	ManageVariant.onVariantSelectionChange = function (oEvent) {
		var oModel = this.getModel("VariantFilterModel");
		var sVariantKey = oEvent.getParameter("selectedItem").getProperty("key");
		var oVariantData = this.getModel("VariantItems").getData();
		var aVariants = ManageVariant.getAllVariants(oVariantData);
		var oData = ManageVariant.getVariantById(aVariants, sVariantKey);
		TokenHelper.applyToFBItem(this, "sap.m.MultiComboBox", TokenHelper._setTokenChange, false);
		oModel.setProperty("/", {});
		oModel.setProperty("/", JSON.parse(oData.VariantContent));
		TokenHelper.applyToFBItem(this, "sap.m.MultiComboBox", TokenHelper._setTokenChange, true);
		this.search();
	};

	ManageVariant.onHandleVaraiantManage = function (oEvent) {
		var oCustomDataValue = this.getCustomData()[0].getValue();
		var sAppId = oCustomDataValue.AppId;
		var sVariantSet = oCustomDataValue.VariantSet;
		var aRenamedVariants = this._oVariantManagement.aRenamedVariants;
		var aRemovedVariants = this._oVariantManagement.aRemovedVariants;
		var sNewDefaultVariant = this._oVariantManagement.sNewDefaultKey;
		ManageVariant.manageVariants(sAppId, sVariantSet, aRenamedVariants, aRemovedVariants, sNewDefaultVariant, this);
	};

	ManageVariant.getVariants = function (oFilterBar, sAppId, sVariantSet, fnDefault) {
		var oModel = oFilterBar.getModel();
		oModel.read("/SearchVariants(ApplicationId='" + sAppId + "',VariantSetName='" + sVariantSet + "')", {
			urlParameters: {
				"$expand": "VariantDetails"
			},
			success: function (oData, response) {
				// If the Variant Set is Empty createGet the OrgUnit and 
				// save the default Variant
				if (oData.VariantDetails.results.length < 1) {
					fnDefault(oFilterBar, sAppId, sVariantSet);
				} else {
					//Move to own method, will use in save methods success
					// if (oFilterBar._oVariantManagement.getDefaultVariantKey() === "*standard*") {
					// }
					ManageVariant.getVariantsSuccess(oFilterBar, oData, true);
				}
				oFilterBar.search();
			},
			error: function (response) {}
		});
	};

	ManageVariant.getVariantsSuccess = function (oFilterBar, oData, bSetVariantMgmtText) {
		var VFModel = oFilterBar.getModel("VariantFilterModel");
		var oDefaultVariant = ManageVariant.getVariantByProperty(oData.VariantDetails.results, "IsDefault", true);
		var oVariantItems = oData.VariantDetails.results; //ManageVariant.removeVariant(oData.VariantDetails.results, oDefaultVariant.index);
		var oModelData = {};
		var oVariantListModel = oFilterBar.getModel("VariantItems");
		var oVMitem = new sap.ui.comp.variants.VariantItem({
			text: "{VariantItems>VariantDisplayName}",
			key: "{VariantItems>VariantId}",
			readOnly: "{VariantItems>IsDefault}",
			customData: {
				Type: "sap.ui.core.CustomData",
				key: "{VariantItems>VariantId}",
				value: "{path: 'VariantItems>VariantContent', formatter:'sap.coe.capacity.reuselib.utils.formatter.JSONStringify'}" // bind custom data
			}
		});
		VFModel.setData(JSON.parse(oData.VariantDetails.results[oDefaultVariant.index].VariantContent));
		oModelData.Default = [oDefaultVariant.object];
		oModelData.Items = oVariantItems;
		oVariantListModel.setProperty("/", oModelData);
		oFilterBar._oVariantManagement.removeAllVariantItems();
		//Bind non default variants to the aggregation
		oFilterBar._oVariantManagement.bindAggregation("variantItems", {
			path: "VariantItems>/Items/",
			template: oVMitem
		});
		//Directly set the Default variant the built in Standard List item
		ManageVariant._setDefaultVariant(oFilterBar._oVariantManagement, oModelData.Default[0].VariantDisplayName,
			oModelData.Default[0].VariantId, bSetVariantMgmtText);
	};

	ManageVariant._beforeOpenVariantList = function () {
		if (this.getAggregation("items")[0].getProperty("key") === "*standard*") {
			this.getAggregation("items")[0].destroy();
		}
	};

	ManageVariant._TeamCalendarDefault = function (oFilterBar, sAppId, sVariantSet) {
		var sUser = oFilterBar.getCustomData()[0].getKey();
		//TODO: Set Busy dialog setting default variant
		var aParameters = {
			oContext: oFilterBar,
			AppId: sAppId,
			VariantSet: sVariantSet,
			sPath: "OrgId"
		};
		DataManager.getUserOrgUnit(oFilterBar, sUser, ManageVariant.saveDefaultVariant, aParameters);
	};

	ManageVariant._WorklistDefault = function (oFilterBar, sAppId, sVariantSet) {
		//TODO: Set Busy dialog setting default variant
		var aParameters = {
			oContext: oFilterBar,
			AppId: sAppId,
			VariantSet: sVariantSet,
			sPath: "StaffingLevel"
		};
		var oObject = {};
		oObject.StaffingLevel = [];
		oObject.StaffingLevel.push("A");
		ManageVariant.saveDefaultVariant(oObject, aParameters);
	};

	ManageVariant._CapacityAnalysis = function (oFilterBar, sAppId, sVariantSet) {
		var sUser = oFilterBar.getCustomData()[0].getKey();
		//TODO: Set Busy dialog setting default variant
		var aParameters = {
			oContext: oFilterBar,
			AppId: sAppId,
			VariantSet: sVariantSet,
			sPath: "OrgId"
		};
		DataManager.getUserOrgUnit(oFilterBar, sUser, ManageVariant.saveDefaultVariant, aParameters);
	};

	ManageVariant.getAllVariants = function (oVariantData) {
		var aVariants = [];
		if (oVariantData.Default && oVariantData.Default.length > 0) {
			aVariants.push(oVariantData.Default[0]);
		}
		if (oVariantData.Items && oVariantData.Items.length > 0) {
			for (var iItem in oVariantData.Items) {
				aVariants.push(oVariantData.Items[iItem]);
			}
		}
		return aVariants;
	};

	ManageVariant.manageVariants = function (sAppId, sVariantSet, aRenamedVariants,
		aRemovedVariants, sNewDefaultVariantKey, oFilterBar) {
		var oModel = oFilterBar.getModel();
		var oVariantData = oFilterBar.getModel("VariantItems").getData();
		var aVariants = oVariantData.Items; //ManageVariant.getAllVariants(oVariantData);
		var oDefaultVariant = {};
		var oNewDefaultVariant = {};
		// Remove the Deleted variants 
		if (aRemovedVariants.length > 0 && aVariants.length > 0) {
			for (var iVar in aRemovedVariants) {
				aVariants = this.removeVariantForDelete(aVariants, aRemovedVariants[iVar]);
			}
		}
		if (sNewDefaultVariantKey !== oVariantData.Default[0].VariantId) {
			oDefaultVariant = ManageVariant.getVariantByProperty(aVariants, "IsDefault", true);
			oNewDefaultVariant = ManageVariant.getVariantByProperty(aVariants, "VariantId", sNewDefaultVariantKey);
			aVariants[oDefaultVariant.index].IsDefault = false;
			aVariants[oNewDefaultVariant.index].IsDefault = true;
		}
		var oCreateRequestBody = {
			ApplicationId: sAppId,
			VariantSetName: sVariantSet,
			VariantDetails: aVariants
		};

		oModel.create("/SearchVariants", oCreateRequestBody, {
			success: function (oResponse) {
				ManageVariant.getVariantsSuccess(oFilterBar, oResponse, true);
			},
			error: function (oResponse) {
				DataManager._requestError(oResponse, "Error while updating Variants");
			}
		});
	};

	ManageVariant.saveDefaultVariant = function (oData, mParameters, oFilterBar) {
		if (oData[mParameters.sPath] && oData[mParameters.sPath] !== "") {
			var oModel = mParameters.oContext.getModel();
			var odata = {};
			// if array do
			if (Object.prototype.toString.call(oData[mParameters.sPath]) === "[object Array]") {
				odata[mParameters.sPath] = oData[mParameters.sPath];
			} else {
				odata[mParameters.sPath] = [{
					id: oData.OrgId,
					name: oData.OrgText
				}];
			}
			var sStringify = JSON.stringify(odata);
			var oCreateRequestBody = {
				ApplicationId: mParameters.AppId,
				VariantSetName: mParameters.VariantSet,
				VariantDetails: [{
					ApplicationId: mParameters.AppId,
					VariantSetName: mParameters.VariantSet,
					VariantDisplayName: "Default",
					VariantContent: sStringify,
					IsDefault: true,
					Editable: false,
					ExecuteOnSelect: false
				}]
			};

			oModel.create("/SearchVariants", oCreateRequestBody, {
				success: function (oResponse) {
					ManageVariant.getVariantsSuccess(oFilterBar, oResponse, true);
					//ManageVariant.getVariants(mParameters.oContext, mParameters.AppId, mParameters.VariantSet);
				},
				error: function (oResponse) {
					DataManager._requestError(oResponse, "Error while saving default Variant.");
				}
			});
		} else {
			mParameters.oContext._oVariantManagement.removeAllVariantItems();
		}
	};

	ManageVariant.saveVariant = function (sAppId, sVariantSet, oVariantData, sNewVariantName, bIsDefault, oFilterBar) {
		var oModel = oFilterBar.getModel(),
			oNewVariantData = JSON.stringify(oFilterBar.getModel("VariantFilterModel").getProperty("/")),
			aVariants = oVariantData.Items, //ManageVariant.getAllVariants(oVariantData);
			aNewVar = [];
		if (bIsDefault) {
			ManageVariant.getVariantByProperty(aVariants, "IsDefault", true).object.IsDefault = false;
		}
		var oNewVariant = {
			ApplicationId: sAppId,
			VariantSetName: sVariantSet,
			VariantDisplayName: sNewVariantName,
			VariantContent: oNewVariantData,
			IsDefault: bIsDefault,
			Editable: true,
			ExecuteOnSelect: false
		};
		aNewVar.push(oNewVariant);
		for (var i in aVariants) {
			aNewVar.push(aVariants[i]);
		}
		var oCreateRequestBody = {
			ApplicationId: sAppId,
			VariantSetName: sVariantSet,
			VariantDetails: aNewVar
		};
		oModel.create("/SearchVariants", oCreateRequestBody, {
			success: function (oResponse) {
				ManageVariant.getVariantsSuccess(oFilterBar, oResponse, true);
			},
			error: function (oResponse) {
				DataManager._requestError(oResponse, "Error while saving Variant.");
			}
		});
	};

	/* eslint-disable no-undef */
	ManageVariant.addVariantsToList = function (oVariantList, filterBarVariant) {
		if (oVariantList) {
			filterBarVariant.removeAllVariantItems();
			filterBarVariant.oVariantList.attachSelectionChange(that.onCloseDialog);
			//Store all Variant Names in an array
			var aVariantNames = [];
			for (var key in oVariantList) {
				if (oVariantList.hasOwnProperty(key)) {
					var a = {
						name: key,
						key: oVariantList[key]
					};
					aVariantNames.push(a);
				}
			}
			for (var iVariant in aVariantNames) {
				var oVMitem = new sap.ui.comp.variants.VariantItem({
					text: aVariantNames[iVariant].name,
					key: aVariantNames[iVariant].key,
					select: ManageVariant.select()
				});
				filterBarVariant.addVariantItem(oVMitem);
			}
		}
	};
	/* eslint-enable no-undef */

	ManageVariant.getDefaultVariant = function (oObject) {
		for (var i in oObject) {
			if (oObject[i].IsDefault === true) {
				return {
					object: oObject[i],
					index: i
				};
			}
		}
	};

	ManageVariant.getVariantByProperty = function (oObject, sProperty, sValue) {
		for (var i in oObject) {
			if (oObject[i][sProperty] === sValue) {
				return {
					object: oObject[i],
					index: i
				};
			}
		}
	};

	ManageVariant.removeVariant = function (oObject, iIndex) {
		if (oObject[iIndex]) {
			$.grep(oObject, function (e) {
				return e.IsDefault === true;
			});
			oObject = $.grep(oObject, function (e) {
				return e.IsDefault !== true;
			});
		}
		return oObject;
	};

	ManageVariant._setDefaultVariant = function (oFilterBar, sName, sId, bSetVariantMgmtText) {
		if (bSetVariantMgmtText) {
			oFilterBar.setInitialSelectionKey(sId);
			oFilterBar.setDefaultVariantKey(sId);
		}
	};

	ManageVariant.getVariantById = function (aVariants, sKey) {
		for (var iVariant in aVariants) {
			if (aVariants[iVariant].VariantId === sKey) {
				return aVariants[iVariant];
			}
		}
	};

	ManageVariant.removeVariantForDelete = function (oObject, iIndex) {
		$.grep(oObject, function (e) {
			return e.VariantId === iIndex;
		});
		oObject = $.grep(oObject, function (e) {
			return e.VariantId !== iIndex;
		});
		return oObject;
	};

	return ManageVariant;

});
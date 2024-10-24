/**
 * @class
 * @name QualificationSelectComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/ui/model/Filter"
], function (BaseFragmentComponent, TokenHelper, Messages, formatter, oHelpers, Filter) {
    "use strict";

    var QualificationSelect = BaseFragmentComponent.extend(
        "sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectComponent", {

            metadata: {
                events: {
                    onRetrieveData: {}
                },
                properties: {
                    //The String to add to QOID for proficiency
                    proficiency: {
                        type: "string",
                        defaultValue: ""
                    },
                    qualForCapacity: {
                        type: "boolean",
                        defaultValue: false
                    }
                }
            },

            renderer: {},

            /**
             * This function is called when the component is being initialized
             * @name init
             * @function
             * @memberOf QualificationSelectComponent#
             * @return {void}
             */
            init: function () {
                this._initFragment(
                    "",
                    "sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectMultiInput"
                );
                var sSearchParameter, // Corresponds to the property in the search entity
                    oTokenBindingInfo = this._oFragment.getBindingInfo("tokens");
                sSearchParameter = this.getFragmentId().substring(this.getFragmentId().indexOf("For") + 3);
                sSearchParameter = sSearchParameter.split("--")[0];
                this.addValidator(this.getFragment(), sSearchParameter, this.getProficiency);
                // sVariantModelPath is the property name in the variant structure/service
                // If sSearchParameter is Qualification app is RDL and search entity is ResDemand. However corresponding property
                // in the variant structure is called Qualificationid. All other apps have the same property name in variant structure and search entity
                this.sVariantModelPath = sSearchParameter === "Qualification" ? "Qualificationid" : sSearchParameter;
                // If sSearchParameter is ResQualification or DemandQualification it is Capacity Analysis app, which uses different variant structure
                // MultiInput needs to be bound to the tokens array inside the variant structure property in this scenario
                oTokenBindingInfo.path = sSearchParameter === "ResQualification" || sSearchParameter === "DemandQualification" ? "/" + this.sVariantModelPath +
                    "/tokens" : "/" + this.sVariantModelPath;
            },

            /**
             * This function is called after rendering of the component. In here the model is already bound to the control
             * @name onAfterRendering
             * @function
             * @memberOf QualificationSelectComponent#
             * @return {void}
             */
            onAfterRendering: function () {
                this.refreshQualificationFieldTexts();
            }

        });

    /**
     * Initialize the Qualificaton Select Dialog
     * @name _initQualificationDialog
     * @function
     * @memberOf QualificationSelectComponent#
     * @return {void}
     * @public     
     */
    QualificationSelect.prototype._initQualificationDialog = function () {
        this._sFragmentId = this.getId() + "--" + "SkillSelectTree";
        var oFilterBarModel = this.getModel("VariantFilterModel");

        if (!this._oDialogSkillSelectTree) {
            this._oDialogSkillSelectTree = oHelpers.initializeFragmentFromObject({
                oParentController: this,
                sFragment: "sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelect",
                sCreateId: this._sFragmentId
            });
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oDialogServiceTeam);
        }
        this._oDialogSkillSelectTree.setModel(oHelpers.copyModel(oFilterBarModel, "/"), "TempModel");
    };
    /**
     * When dialog is opened, set dialog as dependant and sets up qualification navigation tree
     * @name onQualificationDialogOpen
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onQualificationDialogOpen = function (oEvent) {
        this._initQualificationDialog();
        this.oQualificationsList = sap.ui.core.Fragment.byId(this._sFragmentId, "qualificationCatalogList");
        this.oQualificationsSearchList = sap.ui.core.Fragment.byId(this._sFragmentId, "qualificationSearchList");
        this.oNavigation = [{
            id: "93100025"
        }];
        this._oDialogModel = new sap.ui.model.json.JSONModel({
            selected: "NavigateQual",
            navigationLength: 1
        });
        this._oDialogSkillSelectTree.setModel(this._oDialogModel, "UI");
        this.oNavBttn = sap.ui.core.Fragment.byId(this._sFragmentId, "navigationButton");

        this._filterList(this.oNavigation[0].id, this.oQualificationsList);
        this._oDialogSkillSelectTree.open();
    };
    /**
     * Called when user clicks on the searchbar
     * @name onSearch
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onSearch = function (oEvent) {
        var oQualificationsList = sap.ui.core.Fragment.byId(this._sFragmentId, "qualificationSearchList"),
            aFilters = [],
            sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
            var filter = new Filter("SearchSTR", sap.ui.model.FilterOperator.EQ, sQuery);
            aFilters.push(filter);
        }

        oQualificationsList.getBinding("items").filter(aFilters, "Application");
    };
    /**
     * When the dialog has finished loading set up the TempModel
     * @name onUpdateFinished
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onUpdateFinished = function (oEvent) {
        var aSelectedTokens = oEvent.getSource().getModel("TempModel").getProperty("/"),
            aItems = oEvent.getSource().getItems();
        this._setItemsSelected(this._getSelectedTokens(aSelectedTokens), aItems);

    };
    /**
     * Selects items which are already selected from the mulltiinput tokens
     * @name _setItemsSelected
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} aSelectedTokens: tokens previously selected, taken from multipinput
     * @param {Object} aItems: the qualifications bound to the navigation list
     * @return {void}
     */
    QualificationSelect.prototype._setItemsSelected = function (aSelectedTokens, aItems) {
        var aKeys = Object.keys(aSelectedTokens),
            sProficiency = this.getProficiency(),
            sId, aItemToSelect;

        for (var i = 0; i < aItems.length; i++) {
            sId = aItems[i].getProperty("description");
            // Check if item is in the selected list
            aItemToSelect = aKeys.filter(function (sKey) {
                return sId + sProficiency === sKey;
            });
            if (aItemToSelect.length > 0) {
                aItems[i].setSelected(true);
            }
        }
    };
    /**
     * When switching views (Nav/Search), need to clear the selected values and refresh items to fire the onUpdateFinished
     * @name onSegmentedBtnSelect
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onSegmentedBtnSelect = function (oEvent) {
        var aSelectedTokens = this.oQualificationsList.getModel("TempModel").getProperty("/"),
            sSelectedKey = oEvent.getParameter("key"),
            aItems;
        if (sSelectedKey === "NavigateQual") {
            aItems = this.oQualificationsList.getItems();
            this.oQualificationsList.setSelectedContextPaths([]);
            this._setItemsSelected(this._getSelectedTokens(aSelectedTokens), aItems);
        } else {
            aItems = this.oQualificationsSearchList.getItems();
            this.oQualificationsSearchList.setSelectedContextPaths([]);
            this._setItemsSelected(this._getSelectedTokens(aSelectedTokens), aItems);
        }
    };
    /**
     * Filters the list based on level/qualification set
     * @name _filterList
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {String} sCatologId: Qualifiation Catalog Id
     * @param {Object} oList:
     * @return {void}
     */
    QualificationSelect.prototype._filterList = function (sCatologId, oList) {
        var aFilters = this._getFilters("QOID", sCatologId);
        this.oQualificationsList.setMode(this.oNavigation.length > 1 ? "MultiSelect" : "None");
        oList.getBinding("items").filter(aFilters, "Application");
    };
    /**
     * Return Filters for Navigation List
     * @name _getFilters
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {String} sFilterPath: Filter Path
     * @param {String} sCatologId: Qualifiation Catalog Id
     * @return {Array} Array of Filters
     * @private    
     */
    QualificationSelect.prototype._getFilters = function (sFilterPath, sCatologId) {
        var aFilters = [];
        aFilters.push(new Filter("BegDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new Filter("EndDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new Filter(sFilterPath, sap.ui.model.FilterOperator.EQ, sCatologId));
        return aFilters;
    };
    /**
     * Navigates to another subunit of qualifications in the Navigation List
     * @name onQualificationNav
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void} Array of Filters
     * @public    
     */
    QualificationSelect.prototype.onQualificationNav = function (oEvent) {
        var sSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
            oProperty = this.getModel().getProperty(sSelectedContext.sPath, sSelectedContext),
            sSelectedId = oProperty.QOID;
        this.oNavigation.push({
            id: sSelectedId
        });
        this._oDialogModel.setProperty("/navigationLength", this.oNavigation.length);
        this._filterList(sSelectedId, this.oQualificationsList);
    };
    /**
     * Navigates to a previous subunit of qualifications in the Navigation List
     * @name onQualificationNavBack
     * @function
     * @memberOf QualificationSelectComponent#
     * @return {void} Array of Filters
     * @public    
     */
    QualificationSelect.prototype.onQualificationNavBack = function () {
        this.oNavigation.pop();
        this._oDialogModel.setProperty("/navigationLength", this.oNavigation.length);
        this._filterList(this.oNavigation[this.oNavigation.length - 1].id, this.oQualificationsList);
    };
    /**
     * When the item has been selected, determine if we need to navigate to a branch, or add selection to TempModel
     * @name onSelectionChange
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onSelectionChange = function (oEvent) {
        var sSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
            oProperty = this.getModel().getProperty(sSelectedContext.sPath, sSelectedContext),
            bIsSelected = oEvent.getParameter("listItem").isSelected(),
            // Select the correct property depending on service
            sSelectedId = oProperty.QOID || oProperty.QualificationID,
            sSelectedText = oProperty.QualificationText || oProperty.QDescriptionSText,
            // Is of type catalog (QK) or qualification (Q)
            bIsBranch = (oProperty.QOTYPE === "QK") ? true : false;
        if (bIsBranch) {
            this._selectQualificationBranch(this, bIsSelected, sSelectedId);
        } else {
            this._selectQualificationLeaf(bIsSelected, sSelectedId, sSelectedText);
        }
    };
    /**
     * When the item has been selected, determine if we need to navigate to a branch, or add selection to TempModel
     * @name onSeclectionChange (temp solution, to be removed)
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onSeclectionChange = function (oEvent) {
        var sSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
            oProperty = this.getModel().getProperty(sSelectedContext.sPath, sSelectedContext),
            bIsSelected = oEvent.getParameter("listItem").isSelected(),
            // Select the correct property depending on service
            sSelectedId = oProperty.QOID || oProperty.QualificationID,
            sSelectedText = oProperty.QualificationText || oProperty.QDescriptionSText,
            // Is of type catalog (QK) or qualification (Q)
            bIsBranch = (oProperty.QOTYPE === "QK") ? true : false;
        if (bIsBranch) {
            this._selectQualificationBranch(this, bIsSelected, sSelectedId);
        } else {
            this._selectQualificationLeaf(bIsSelected, sSelectedId, sSelectedText);
        }
    };
    /**
     * Navigate to a branch based off qualification selected, if bIsSelected add the tokens to the TempModel
     * @name onSelectionChange
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} that: context of the qualification list control
     * @param {Boolean} bIsSelected: if the list item has been selected
     * @param {String} sSelectedId: id of selected qualification
     * @return {void}
     */
    QualificationSelect.prototype._selectQualificationBranch = function (that, bIsSelected, sSelectedId) {
        var aFilters = this._getFilters("QOID", sSelectedId),
            sProficiency = this.getProficiency();
        this.getModel().read("/QualificationList", {
            filters: aFilters,
            success: function (oData, response) {
                var oQualifications = oData.results,
                    iQualification, sId,
                    aTempModelData = that._oDialogSkillSelectTree.getModel("TempModel").getProperty("/");
                if (bIsSelected) {
                    that._toggleSelected(aTempModelData, sSelectedId, true);
                    for (iQualification in oQualifications) {
                        sId = oQualifications[iQualification].QOID + sProficiency;
                        var sText = oQualifications[iQualification].QDescriptionSText;

                        TokenHelper._addToken(aTempModelData, sText, sId, that.sVariantModelPath, true, that.getQualForCapacity());
                    }
                } else {
                    that._toggleSelected(that._oDialogSkillSelectTree.getModel("TempModel").getProperty("/"), sSelectedId, false);
                    for (iQualification in oQualifications) {
                        sId = oQualifications[iQualification].QOID + sProficiency;
                        TokenHelper.removeToken(aTempModelData, sId, that.sVariantModelPath, true, that.getQualForCapacity());
                    }
                }
            },
            error: function (response) {
                Messages.showErrorMessage(response);
            }
        });
    };
    /**
     * When the item (leaf) has been selected, add selection to TempModel
     * @name _selectQualificationLeaf
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Boolean} bIsSelected: if the item has been selected
     * @param {String} sSelectedId: id of selected item
     * @param {String} sSelectedText: text of selected item
     * @return {Object} oTempModel: TempModel updated with new selection
     */
    QualificationSelect.prototype._selectQualificationLeaf = function (bIsSelected, sSelectedId, sSelectedText) {
        var sIdPlusProficiency = sSelectedId + this.getProficiency(),
            oTempModel = this._oDialogSkillSelectTree.getModel("TempModel").getProperty("/");
        if (bIsSelected) {
            TokenHelper._addToken(oTempModel, sSelectedText, sIdPlusProficiency, this.sVariantModelPath, true, this.getQualForCapacity());
        } else {
            TokenHelper.removeToken(oTempModel, sIdPlusProficiency, this.sVariantModelPath, true, this.getQualForCapacity());
        }
        return oTempModel;
    };
    /**
     * Sets the selected value of the item in the TempModel
     * @name _toggleSelected
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oData: TempModel
     * @param {Object} sKey: id of the item selected
     * @param {Object} bSetSelected: if the list item should be set to selected
     * @return {void}
     */
    QualificationSelect.prototype._toggleSelected = function (oData, sKey, bSetSelected) {
        if (bSetSelected) {
            oData[sKey] = true;
        } else {
            delete oData[sKey];
        }
        return oData;
    };
    /**
     * Closes the dialog
     * @name onCloseDialog
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    QualificationSelect.prototype.onCloseDialog = function (oEvent) {
        oEvent.getSource().getParent().close();
    };
    /**
     * Returns data object containing keys of selected qualifications
     * @name _getSelectedTokens
     * @function
     * @memberOf QualificationSelectComponent#
     * @param {Object} oData: temp model data
     * @return {Object} oData: data contain selected keys
     * @public
     */
    QualificationSelect.prototype._getSelectedTokens = function (oData) {
        return this.getQualForCapacity() ? oData[this.sVariantModelPath].selected : oData;
    };
    /**
     * Called when cross app navigation from Capacity Analysis to RDL to populated passed qualification to RDL filters
     * 
     * @param {String} sQualificationId: The id of the qualification
     * @param {String} sQualificationText: The description of the qualification to be displayed in token. If this parameter is not given, it will try to find its description using a server request
     * @return {void} 
     * @public
     */
    QualificationSelect.prototype.insertQualification = function (sQualificationId, sQualificationText) {
        var oQualificationInput = sap.ui.core.Fragment.byId(this._sFragmentId, "id___Qualificationid"),
            oFilterModel = this.getModel("VariantFilterModel").getProperty("/"),
            sIdValue = sQualificationId,
            sName = sQualificationText || sQualificationId,
            tempToken = new sap.m.Token({
                key: sIdValue,
                text: sName
            });

        oFilterModel[sIdValue] = true;
        oFilterModel.Qualificationid = oFilterModel.Qualificationid || [];
        oFilterModel.Qualificationid.push({
            id: sIdValue,
            name: sName
        });

        oQualificationInput.addToken(tempToken);
        if (!sQualificationText && this.getModel()) {
            this.refreshQualificationFieldTexts();
        }
    };

    /**
     * Refresh the description of the qualification tokens using the service "SearchSTR"
     * 
     * @return {void} 
     * @public
     */
    QualificationSelect.prototype.refreshQualificationFieldTexts = function () {
        var oQualificationInput = sap.ui.core.Fragment.byId(this._sFragmentId, "id___Qualificationid"),
            oFilterModel = this.getModel("VariantFilterModel").getProperty("/"),
            aTokens = oQualificationInput.getTokens(),
            aFilters = [];

        if (!aTokens.length) {
            return;
        }

        for (var i = 0; i < aTokens.length; i++) {
            aFilters.push(new sap.ui.model.Filter("SearchSTR", sap.ui.model.FilterOperator.EQ, aTokens[i].getText()));
        }

        this.getModel().read("/QualSearchHelpSet", {
            filters: aFilters,
            success: function (oData, oResponse) {
                var oQualificationReturned,
                    sName,
                    sId,
                    oQualificationInFilterBar,
                    oQualificationToken;

                for (i = 0; i < oData.results.length; i++) {
                    oQualificationReturned = oData.results[i];
                    sName = oQualificationReturned.QualificationText;
                    sId = oQualificationReturned.QualificationID;
                    oQualificationInFilterBar = this.getQualForCapacity() ? oFilterModel[this.sVariantModelPath].tokens.filter(function (item) {
                        return item.id === sId;
                    })[0] : oFilterModel[this.sVariantModelPath].filter(function (item) {
                        return item.id === sId || item.id === sId + ";0000";
                    })[0];
                    oQualificationToken = aTokens.filter(function (item) {
                        return item.getKey() === sId || item.getKey() === sId + ";0000";
                    })[0];

                    oQualificationInFilterBar.name = sName;
                    oQualificationToken.setText(sName);
                }
            }.bind(this),
            error: function (oResponse) {
                //Coment this line until transport in wave 4
                //Messages.showErrorMessage(oResponse);
            }
        });

    };

    return QualificationSelect;
});
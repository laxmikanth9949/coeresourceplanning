/**
 * @class
 * @name ServiceTeamSelectComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/coe/capacity/reuselib/utils/TokenHelperTest",
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/capacity/reuselib/utils/helpers"
], function (BaseFragmentComponent, Token, Filter, TokenHelper, formatter, oHelpers) {

    "use strict";
    var ServiceTeamSelect = BaseFragmentComponent.extend("sap.coe.capacity.reuselib.controls.ServiceTeamSelect.ServiceTeamSelectComponent", {

        metadata: {
            events: {
                onRetriveData: {}
            },
            properties: {
                filterPath: {
                    type: "string",
                    defaultValue: undefined
                }
            }
        },

        renderer: {},

        /**
         * This function is called when the component is being initialized
         * @name init
         * @function
         * @memberOf ServiceTeamSelectComponent#
         * @return {void}
         */
        init: function () {
            var sSearchParameter;

            this._initFragment(
                "",
                "sap.coe.capacity.reuselib.controls.ServiceTeamSelect.ServiceTeamMultiInput"
            );
            sSearchParameter = this.getFragmentId().substring(this.getFragmentId().indexOf("For") + 3);
            sSearchParameter = sSearchParameter.split("--")[0];
            // Set sSearchParameter, as retrieved from id naming, as the filterPath (corresponds to the variant structure property name)
            // If a filterPath property is set in XML coding when instantiating this component it will then overwrite the filterPath
            // Otherwise it remains the same (i.e. in cases such as CapacityAnalysis app where variant structure and search entity property names are the same)
            this.setFilterPath(sSearchParameter);
            this.addValidator(this.getFragment(), sSearchParameter);
        },

        /**
         * This function is called after rendering of the component. In here the model is already bound to the control
         * @name onAfterRendering
         * @function
         * @memberOf ServiceTeamSelectComponent#
         * @return {void}
         */
        onAfterRendering: function () {
            this._registerFieldInFilterBarModel();
            this._initServiceTeamDialog();
            this._attachOnRequestComplete();
        }
    });
    /**
     * Returns the global property sFilterPath
     * @name getFilterPath
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @return {string} filter path
     */
    ServiceTeamSelect.prototype.getFilterPath = function () {
        return this.sFilterPath;
    };

    /**
     * Called by init function and then if filterPath property is set for component
     * Sets filterPath to a global property sFilterPath and updates the tokens aggregation binding.
     * @name setFilterPath
     * @function
     * @param {String} sPath: model path
     * @memberOf ServiceTeamSelectComponent#
     * @return {void}
     */
    ServiceTeamSelect.prototype.setFilterPath = function (sPath) {
        var oTokenBindingInfo = this._oFragment.getBindingInfo("tokens");
        this.sFilterPath = sPath;
        oTokenBindingInfo.path = "/" + this.getFilterPath() + "/tokens";
    };
    /**
     * When dialog is opened, set dialog as dependant
     * @name onServiceTeamDialogOpen
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onServiceTeamDialogOpen = function (oEvent) {
        this._initServiceTeamDialog();
        this._oDialogServiceTeam.oSourcefield = oEvent.getSource();
        this._oDialogServiceTeam.open();
    };
    /**
     * Update list selection based off already selected tokens
     * @name onAfterOpen
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onAfterOpen = function (oEvent) {
        this.updateListBasedOnTokens(oEvent);
    };
    /**
     * Sort dialog list and refresh tokens
     * @name _attachOnRequestComplete
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @return {void}
     */
    ServiceTeamSelect.prototype._attachOnRequestComplete = function () {
        var oListModel = this.oServiceTeamList.getModel(),
            that = this;
        oListModel.attachRequestCompleted(function (oEvent) {
            if (!that._listSorted) {
                that._sortList();
            }
            that._refreshTokens(oEvent);
        });
    };
    /**
     * Sort dialog by ServiceTeamName
     * @name _sortList
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @return {void}
     */
    ServiceTeamSelect.prototype._sortList = function () {
        var oListBinding = this.oServiceTeamList.getBinding("items"),
            oSortList = new sap.ui.model.Sorter("ServiceTeamName", false);
        if (oListBinding.getLength() === 0) {
            return;
        }
        oListBinding.bClientOperation = true;
        oListBinding.aAllKeys = true;

        oListBinding.sort(oSortList);

        oListBinding.bClientOperation = false;
        oListBinding.aAllKeys = null;
        this._listSorted = true;
    };
    /**
     * Refresh token values
     * @name _refreshTokens
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype._refreshTokens = function (oEvent) {
        var aItems, aTokens, aTokensToSynchronize, oFilterModel, oTokenInModel, oServiceTeamInFilterModel, sIdValue, sName;

        if (oEvent && oEvent.getParameter("url").indexOf("ResServiceTeamSet") === -1) {
            return; //Refresh only on ResServiceTeamSet requests
        }
        aItems = this.oServiceTeamList.getItems();
        if (!aItems.length) {
            return; //ResServiceTeamSet not loaded
        }

        oFilterModel = this.getModel("VariantFilterModel").getProperty("/");

        aTokens = this._oFragment.getTokens();
        aTokensToSynchronize = aTokens.filter(function (oToken) {
            return oToken.getKey() === oToken.getText();
        });

        for (var i = 0; i < aTokensToSynchronize.length; i++) {
            sIdValue = aTokensToSynchronize[i].getKey();
            sName = sIdValue;

            oFilterModel.Organization.selected[sIdValue] = true;
            oTokenInModel = this.oServiceTeamList.getModel().getProperty("/ResServiceTeamSet('" + sIdValue + "')");
            if (oTokenInModel) {
                sName = oTokenInModel.ServiceTeamName;
            }
            aTokensToSynchronize[i].setText(sName);
            oServiceTeamInFilterModel = oFilterModel.Organization.tokens.filter(function (oRecord) {
                return oRecord.id === sIdValue;
            });
            if (oServiceTeamInFilterModel[0]) {
                oServiceTeamInFilterModel[0].name = sName;
            } else {
                oFilterModel.Organization.tokens.push({
                    id: sIdValue,
                    name: sName
                });
            }
        }
    };
    /**
     * Set selected list item in the TempModel
     * @name saveItemAsToken
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Boolean} bSelected: if the list item has been selected
     * @param {Object} oSelectedContext: binding context of the list item
     * @return {void}
     */
    ServiceTeamSelect.prototype.saveItemAsToken = function (bSelected, oSelectedContext) {
        var aItems = ["ServiceTeamID", "ServiceTeamName", this.getFilterPath()],
            oModel = this._oDialogServiceTeam.getModel(),
            sProperty = oModel.getProperty(oSelectedContext.sPath, oSelectedContext);

        TokenHelper.storeSelectedItems(
            bSelected,
            this._oDialogServiceTeam.getModel("TempModel").getProperty("/"),
            sProperty,
            aItems);
    };
    /**
     * Updates list selection based on token value
     * @name updateListBasedOnTokens
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.updateListBasedOnTokens = function (oEvent) {
        var _sFragmentId = this.getId() + "--" + "ServiceTeamSelect",
            aSelectedToken = this._oDialogServiceTeam.oSourcefield,
            aAllSelectedTokens = aSelectedToken.getTokens(),
            oList = sap.ui.core.Fragment.byId(_sFragmentId, "SelectOrganisationList"),
            aListItems = oList.getItems(),
            bSelected,
            oSelectedContext;

        for (var i = 0; i < aListItems.length; i++) {
            bSelected = false;
            for (var k = 0; k < aAllSelectedTokens.length; k++) {
                if (aListItems[i].getBindingContext().sPath.indexOf(aAllSelectedTokens[k].getKey()) !== -1) {
                    oSelectedContext = aListItems[i].getBindingContext();
                    bSelected = true;

                    this.saveItemAsToken(bSelected, oSelectedContext);
                    break;
                }
            }
            aListItems[i].setSelected(bSelected);
        }
    };
    /**
     * Called when list item has been selected/unselected
     * @name onServiceTeamSelectionChange
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onServiceTeamSelectionChange = function (oEvent) {
        if (oEvent.getId() === "itemPress") {
            oEvent.getParameter("listItem").setSelected(!oEvent.getParameter("listItem").getSelected());
        }

        var oSelectedContext = oEvent.getParameter("listItem").getBindingContext();
        this.saveItemAsToken(oEvent.getParameter("listItem").isSelected(), oSelectedContext);
    };
    /**
     * Apply search value
     * @name OrganisationTypeSearch
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.OrganisationTypeSearch = function (oEvent) {
        var sValue = oEvent.getParameter("value"),
            oFilter = new Filter("ServiceTeamName", sap.ui.model.FilterOperator.Contains, sValue),
            oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([oFilter]);
    };
    /**
     * Apply the tokens in the input based off user selection from the list and close the dialog
     * @name onApplyTokens
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onApplyTokens = function (oEvent) {
        var oVariantFilterModel = this.getModel("VariantFilterModel");
        TokenHelper.onApplyTokens(oEvent, oVariantFilterModel);
        this.onCloseDialog(oEvent);
    };
    /**
     * Closes the dialog
     * @name onCloseDialog
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onCloseDialog = function (oEvent) {
        oEvent.getSource().getParent().close();
    };
    /**
     * Remove selected token from the model
     * @name onTokenDelete
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    ServiceTeamSelect.prototype.onTokenDelete = function (oEvent) {
        var oVariantFilterModel = this.getModel("VariantFilterModel");
        TokenHelper.onTokenDeleteParam(oEvent, oVariantFilterModel, this.getFilterPath());
    };
    /**
     * Add temp tokens to the dialog
     * @name insertServiceTeam
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @param {String} sOrgKey: organization unit key
     * @return {void}
     */
    ServiceTeamSelect.prototype.insertServiceTeam = function (sOrgKey) {
        this._initServiceTeamDialog();
        this._registerFieldInFilterBarModel();

        var tempToken = new sap.m.Token({
            key: sOrgKey,
            text: sOrgKey
        });
        this._oFragment.addToken(tempToken);
        this._refreshTokens();
    };
    /**
     * When search is opened, set dialog as dependant and set TempModel
     * @name _initServiceTeamDialog
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @return {void}
     */
    ServiceTeamSelect.prototype._initServiceTeamDialog = function () {
        var sFragmentId = this.getId() + "--" + "ServiceTeamSelect";

        if (!this._oDialogServiceTeam) {
            this._oDialogServiceTeam = oHelpers.initializeFragmentFromObject({
                oParentController: this,
                sFragment: "sap.coe.capacity.reuselib.controls.ServiceTeamSelect.ServiceTeamSelect",
                sCreateId: sFragmentId
            });

            this.oServiceTeamList = sap.ui.core.Fragment.byId(sFragmentId, "SelectOrganisationList");
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oDialogServiceTeam);
        }
        this._oDialogServiceTeam.setModel(new sap.ui.model.json.JSONModel(), "TempModel");
    };
    /**
     * Set values to be used in the filter model
     * @name _registerFieldInFilterBarModel
     * @function
     * @memberOf ServiceTeamSelectComponent#
     * @return {void}
     */
    ServiceTeamSelect.prototype._registerFieldInFilterBarModel = function () {
        var oFilterModel = this.getModel("VariantFilterModel").getProperty("/"),
            sSearchParameter = this.getFilterPath();

        oFilterModel[sSearchParameter] = oFilterModel[sSearchParameter] || {};
        oFilterModel[sSearchParameter].selected = oFilterModel[sSearchParameter].selected || {};
        oFilterModel[sSearchParameter].tokens = oFilterModel[sSearchParameter].tokens || [];
    };

    return ServiceTeamSelect;

});
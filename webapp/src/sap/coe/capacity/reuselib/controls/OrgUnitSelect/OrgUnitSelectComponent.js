/**
 * @class
 * @name OrgUnitSelectComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/utils/TokenHelper"
], function (BaseFragmentComponent, TokenHelper) {
    "use strict";

    var OrgUnitSelect = BaseFragmentComponent.extend("sap.coe.capacity.reuselib.controls.OrgUnitSelect.OrgUnitSelectComponent", {

        metadata: {
            events: {
                onRetrieveData: {}
            }
        },

        renderer: {},

        /**
         * This function is called when the component is being initialized
         * @name init
         * @function
         * @memberOf StandardNotesListComponent#
         * @return {void}
         */

        init: function () {
            var sSearchParameter;
            this._initFragment(
                "",
                "sap.coe.capacity.reuselib.controls.OrgUnitSelect.OrgUnitSelectMultiInput"
            );
            sSearchParameter = this.getFragmentId().substring(this.getFragmentId().indexOf("For") + 3);
            sSearchParameter = sSearchParameter.split("--")[0];
            this.addValidator(this.getFragment(), sSearchParameter);
        },
        /**
         * This function is called after rendering of the component. In here the model is already bound to the control
         * @name onAfterRendering
         * @function
         * @memberOf StandardNotesListComponent#
         * @return {void}
         */
        onAfterRendering: function () {}

    });
    /**
     * When dialog is opened, set dialog as dependant and set TempModel
     * @name onOrgunitDialogOpen
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    OrgUnitSelect.prototype.onOrgunitDialogOpen = function (oEvent) {
        var _sFragmentId = this.getId() + "--" + "OrgUnitSelect",
            oOrgUnitList = {},
            aData = this.getModel("VariantFilterModel").getProperty("/"),
            aDataCopy = jQuery.extend(true, {}, aData);
        if (!this._oDialogOrgUnit) {
            this._oDialogOrgUnit = sap.ui.xmlfragment(_sFragmentId,
                "sap.coe.capacity.reuselib.controls.OrgUnitSelect.OrgUnitSelect", this);
            this.addDependent(this._oDialogOrgUnit);
        }
        this.oOrgUnitList = sap.ui.core.Fragment.byId(_sFragmentId, "orgUnitList");
        this._oDialogOrgUnit.setModel(new sap.ui.model.json.JSONModel(aDataCopy), "TempModel");
        this.fireOnRetrieveData({
            oFragment: this,
            bNavBack: ""
        });
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oDialogOrgUnit);
        this._oDialogOrgUnit.open();
    };
    /**
     * Navigates to the previous oganization subunit level
     * @name onOrgUnitNavBack
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @return {void}
     */
    OrgUnitSelect.prototype.onOrgUnitNavBack = function () {
        this.oOrgUnitList.setBusy(true);
        this.fireOnRetrieveData({
            oFragment: this,
            bNavBack: true
        });
    };
    /**
     * Sets the data for the list item on the current organization subunit
     * @name _setAggregationOrgUnit
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @param {Object} oList: list object to display the organization unites
     * @param {oModel} data: data to be bound to the list
     * @return {void}
     */
    OrgUnitSelect.prototype._setAggregationOrgUnit = function (oList, data) {
        var sPath;
        var oItemTemplateQualification = new sap.m.StandardListItem({
            title: "{OrgUnitModel>OrgText}",
            description: "{path: 'OrgUnitModel>OrgId'}",
            selected: "{path: 'OrgUnitModel>OrgId', formatter: 'sap.coe.capacity.reuselib.utils.formatter.isSelected'}",
            templateShareable: true,
            type: "{path: 'OrgUnitModel>MangeLevel', formatter: 'sap.coe.capacity.reuselib.utils.formatter.formatMangeLevel'}"
        });
        if (data.hasSubUnit) {
            sPath = "OrgUnitModel>/SubOrgUnitSet/results/";
        } else {
            sPath = "OrgUnitModel>/SubOrgUnitSet";
        }
        oList.bindAggregation("items", {
            path: sPath,
            template: oItemTemplateQualification
        });
        oList.setBusy(false);
    };
    /**
     * Stores the selected organization unit to be used in the multiinput tokens
     * @name onOrgUnitSeclectionChange
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    OrgUnitSelect.prototype.onOrgUnitSeclectionChange = function (oEvent) {
        var oModel = this.getModel("OrgUnitModel"),
            sSelectedPath = oEvent.getParameter("listItem").getBindingContextPath(),
            sProperty = oModel.getProperty(sSelectedPath),
            aItems = ["OrgId", "OrgText", "OrgId"];
        TokenHelper.storeSelectedItems(oEvent.getParameter("listItem").isSelected(),
            this._oDialogOrgUnit.getModel("TempModel").getProperty("/"), sProperty, aItems);
    };
    /**
     * Navigates the sub-layers of organization units
     * @name onOrgUnitNav
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    OrgUnitSelect.prototype.onOrgUnitNav = function (oEvent) {
        var sSelectedPath = oEvent.getParameter("listItem").getBindingContextPath();
        this.oOrgUnitList.setBusy(true);
        this.fireOnRetrieveData({
            oFragment: this,
            bNavBack: false,
            sSelectedPath: sSelectedPath
        });
    };
    /**
     * Closes the dialog
     * @name onCloseDialog
     * @function
     * @memberOf OrgUnitSelectComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    OrgUnitSelect.prototype.onCloseDialog = function (oEvent) {
        oEvent.getSource().getParent().close();
    };

});
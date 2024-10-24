/**
 * @class
 * @name EmployeeSearchComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/formatter"
], function (BaseFragmentComponent, TokenHelper, formatter) {
    "use strict";

    var EmployeeSearch = BaseFragmentComponent.extend("sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearchComponent", {

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
         * @memberOf EmployeeSearchComponent#
         * @return {void}
         */
        init: function () {
            var sSearchParameter;
            this._initFragment(
                "",
                "sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearchMultiInput"
            );
            sSearchParameter = this.getFragmentId().substring(this.getFragmentId().indexOf("For") + 3);
            sSearchParameter = sSearchParameter.split("--")[0];
            this.addValidator(this.getFragment(), sSearchParameter);
        },
        /**
         * This function is called after rendering of the component. In here the model is already bound to the control
         * @name onAfterRendering
         * @function
         * @memberOf EmployeeSearchComponent#
         * @return {void}
         */
        onAfterRendering: function() {}
    });
    /**
     * When search is opened, set dialog as dependant and set TempModel
     * @name onEmployeeSearchOpen
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onEmployeeSearchOpen = function (oEvent) {
        this._sFragmentId = this.getId() + "--" + "EmployeeSearch";
        var aData = this.getModel("VariantFilterModel").getProperty("/", null, true),
            aDataCopy = jQuery.extend(true, {}, aData);
        if (!this._oEmployeeSearch) {
            this._oEmployeeSearch = sap.ui.xmlfragment(this._sFragmentId,
                "sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearch", this);
            this.addDependent(this._oEmployeeSearch);
        }
        this.oEmployeeSearchList = sap.ui.core.Fragment.byId(this._sFragmentId, "employeeSearchList");
        this._oEmployeeSearch.setModel(new sap.ui.model.json.JSONModel(aDataCopy), "TempModel");
        this.oEmployeeSearchList.unbindItems();
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oEmployeeSearch);
        this._oEmployeeSearch.open();
    };
    /**
     * Search employee event used by searchfield/button
     * @name onSearchEmployee
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onSearchEmployee = function (oEvent) {
        var oFirstName = sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldFirstName").getValue(),
            oLastName = sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldLastName").getValue(),
            oEmpId = sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldEmpId").getValue(),
            oEmpListTemplate = {},
            aFilters = [];
        if (oFirstName.trim().length > 0) {
            aFilters.push(new sap.ui.model.Filter("FirstName", sap.ui.model.FilterOperator.Contains, oFirstName.trim()));
        }
        if (oLastName.trim().length > 0) {
            aFilters.push(new sap.ui.model.Filter("LastName", sap.ui.model.FilterOperator.Contains, oLastName.trim()));
        }
        if (oEmpId.trim().length > 0) {
            aFilters.push(new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, oEmpId.trim()));
        }
        if (aFilters.length > 0) {
            aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, new Date()));
            aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, new Date()));
            oEmpListTemplate = new sap.m.StandardListItem({
                title: "{FullName}",
                description: "{path: 'EmpId'}",
                selected: "{path: 'EmpId', formatter: 'sap.coe.capacity.reuselib.utils.formatter.isSelected'}",
                templateShareable: true
            });
            this.oEmployeeSearchList.bindAggregation("items", {
                path: "/ResourceList",
                filters: aFilters,
                template: oEmpListTemplate
            });
        }
    };
    /**
     * Adds the selected employee to the TempModel
     * @name onEmployeeSelectionChange
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onEmployeeSelectionChange = function (oEvent) {
        var oModel = this.getModel(),
            oSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
            sProperty = oModel.getProperty(oSelectedContext.sPath, oSelectedContext),
            aItems = ["EmpId", "FullName", "EmpId"];
        TokenHelper.storeSelectedItems(oEvent.getParameter("listItem").isSelected(), this._oEmployeeSearch.getModel("TempModel").getData(),
            sProperty, aItems);
    };
    /**
     * Closes the dialog and clears the search field values
     * @name onCloseDialog
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onCloseDialog = function (oEvent) {
        oEvent.getSource().getParent().close();
        sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldFirstName").setValue("");
        sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldLastName").setValue("");
        sap.ui.core.Fragment.byId(this._sFragmentId, "searchFieldEmpId").setValue("");
    };

    return EmployeeSearch;

});
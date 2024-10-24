/**
 * @class
 * @name EmployeeSearchComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/coe/capacity/reuselib/utils/formatter"
], function (BaseFragmentComponent, TokenHelper, i18n, formatter) {
    "use strict";

    var EmployeeSearch = BaseFragmentComponent.extend("sap.coe.capacity.reuselib.controls.EmployeeSingleSelect.EmployeeSearchComponent", {

        metadata: {
            events: {
                employeeChanged: {}
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
            this._initFragment(
                "",
                "sap.coe.capacity.reuselib.controls.EmployeeSingleSelect.EmployeeSearchInput"
            );

            var oInputModel = new sap.ui.model.json.JSONModel();
            this.getFragment().setModel(oInputModel, "inputModel");
        },

        /**
         * This function is called before rendering of the component, if employee ID has already been entered, set the input value
         * @name onAfterRendering
         * @function
         * @memberOf EmployeeSearchComponent#
         * @return {void}
         */
        onBeforeRendering: function () {
            if (this.data("employeeID")) {
                this.getFragment().getModel("inputModel").setProperty("/value", this.data("employeeID"));
            }
        },

        /**
         * This function is called after rendering of the component. In here the model is already bound to the control
         * @name onAfterRendering
         * @function
         * @memberOf EmployeeSearchComponent#
         * @return {void}
         */
        onAfterRendering: function () {}

    });
    /**
     * When dialog is opened, set dialog as dependant and reset list binding
     * @name onEmployeeSearchOpen
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onEmployeeSearchOpen = function (oEvent) {
        this._sFragmentId = this.getId() + "--" + "EmployeeSearch";
        if (!this._oEmployeeSearch) {
            this._oEmployeeSearch = sap.ui.xmlfragment(this._sFragmentId,
                "sap.coe.capacity.reuselib.controls.EmployeeSingleSelect.EmployeeSearch", this);
            this.addDependent(this._oEmployeeSearch);
        }
        this._oEmployeeSearchList = sap.ui.core.Fragment.byId(this._sFragmentId, "employeeSearchList");
        this._oEmployeeSearchList.unbindItems();
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
                description: "{EmpId}"
            });
            this._oEmployeeSearchList.bindAggregation("items", {
                path: "/ResourceList",
                filters: aFilters,
                template: oEmpListTemplate,
                templateShareable: true
            });
        }
    };
    /**
     * Adds the selected employee to the InputModel and closes the dialog
     * @name onApplySelection
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onApplySelection = function (oEvent) {
        var oSelectedItem = this._oEmployeeSearchList.getSelectedItem(),
            oEmpInput = this.getFragment(),
            oInputModel = oEmpInput.getModel("inputModel"),
            oEmployeeData;

        // If selected item is null no employee was selected from list
        if (oSelectedItem) {
            oEmployeeData = oSelectedItem.getBindingContext().getObject();
            oEmpInput.setValue(oEmployeeData.EmpId);
            oInputModel.setProperty("/resGuid", oEmployeeData.ResGuid);
            oInputModel.setProperty("/fullName", oEmployeeData.FullName);
            oInputModel.setProperty("/empId", oEmployeeData.EmpId);

            this.fireEmployeeChanged({
                "empId": oEmployeeData.EmpId,
                "resGuid": oEmployeeData.ResGuid
            });

        }
        this.onCloseDialog(oEvent);
    };
    /**
     * Adds the selected employee to the InputModel (if entered directly in the input field)
     * @name onEmployeeChange
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    EmployeeSearch.prototype.onEmployeeChange = function (oEvent) {
        var aFilters = [],
            oEmpInput = oEvent.getSource(),
            oInputModel = oEmpInput.getModel("inputModel"),
            bBusyModel = this.getModel("BusyModel") ? true : false,
            sEmpID = oEmpInput.getValue();

        if (sEmpID === "") {
            return;
        }

        aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, oEmpInput.getValue()));

        // Busy model used to disable action elements until ResourceList request returns with resGuid
        if (bBusyModel) {
            this.getModel("BusyModel").setProperty("/bAssignSaveDisabled", true);
        }

        this.getModel().read("/ResourceList", {
            filters: aFilters,
            success: function (oResponse) {
                if (oResponse.results.length <= 0) {
                    oEmpInput.setValue("");
                    this.displayNotValidEmployeeDialog(sEmpID);
                } else {
                    oEmpInput.setValue(oResponse.results[0].EmpId);
                    oInputModel.setProperty("/resGuid", oResponse.results[0].ResGuid);
                    oInputModel.setProperty("/fullName", oResponse.results[0].FullName);
                    oInputModel.setProperty("/empId", oResponse.results[0].EmpId);

                    this.fireEmployeeChanged({
                        "empId": oResponse.results[0].EmpId,
                        "resGuid": oResponse.results[0].ResGuid
                    });
                }
                if (bBusyModel) {
                    this.getModel("BusyModel").setProperty("/bAssignSaveDisabled", false);
                }
            }.bind(this),
            error: function () {
                this.displayNotValidEmployeeDialog(sEmpID);
                if (bBusyModel) {
                    this.getModel("BusyModel").setProperty("/bAssignSaveDisabled", false);
                }
            }
        });
    };
    /**
     * Displays error message if the employee ID entered is not valie
     * @name displayNotValidEmployeeDialog
     * @function
     * @memberOf EmployeeSearchComponent#
     * @param {String} sEmpID: employee ID string entered in input field
     * @return {void}
     */
    EmployeeSearch.prototype.displayNotValidEmployeeDialog = function (sEmpID) {
        var sErrorText = i18n.getText("EMP_SEARCH_FAILURE_DIALOG_1") + sEmpID + " " + i18n.getText("EMP_SEARCH_FAILURE_DIALOG_2");
        sErrorText += i18n.getText("EMP_SEARCH_FAILURE_DIALOG_3") + i18n.getText("EMP_SEARCH_FAILURE_DIALOG_4");
        sErrorText += i18n.getText("EMP_SEARCH_FAILURE_DIALOG_5") + i18n.getText("EMP_SEARCH_FAILURE_DIALOG_6");
        sErrorText += i18n.getText("EMP_SEARCH_FAILURE_DIALOG_7");
        sap.m.MessageBox.error(sErrorText, {
            title: "Error",
            styleClass: "",
            initialFocus: null,
            textDirection: sap.ui.core.TextDirection.Inherit
        });
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
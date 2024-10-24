sap.ui.define([
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/ui/model/Filter",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/EditServiceOrder.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/HandleTimeAllocation.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/ResourcePlanningCalendarComponent"
], function (i18n, Filter, EditServiceOrder, HandleTimeAllocation, ResourcePlanningCalendarComponent) {
    "use strict";

    var TimeZoneSelect = {};

    /**
     * Gets the Users Time Zone and sets the App
     * @name _setAppSettingButtons
     * @function
     * @param {Object} that: context of where fragment was called from
     * @return {void}
     */
    TimeZoneSelect._setAppSettingButtons = function (that) {
        TimeZoneSelect._getUserTimeZone(that);
        sap.ushell.services.AppConfiguration.addApplicationSettingsButtons([
            new sap.m.Button({
                text: i18n.getText("FRAGMENT_TIMEZONE_SETTINGS_BUTTON_TIMEZONE"),
                press: jQuery.proxy(function () {
                    TimeZoneSelect._showSettingsDialog(that);
                }, that)
            })
        ]);
    };
    /**
     * When search is opened, set dialog as dependant and set TempModel
     * @name _showSettingsDialog
     * @function
     * @param {Object} that: context of where fragment was called from
     * @return {void}
     */
    TimeZoneSelect._showSettingsDialog = function (that) {
        if (!this._oTimeZoneSelect) {
            this._oTimeZoneSelect = sap.ui.xmlfragment(
                "sap.coe.capacity.reuselib.controls.TimeZoneSelect.TimeZoneSelect", this);
            that.oView.addDependent(this._oTimeZoneSelect);
        }
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oTimeZoneSelect);
        this._oTimeZoneSelect.setTitle(i18n.getText("FRAGMENT_SELECT_TIMEZONE_TITLE"));
        this._oTimeZoneSelect.open();
    };
    /**
     * Set the Timezone Model to the view
     * @name _setTimeZoneModelToView
     * @function
     * @param {Object} that: context of where fragment was called from
     * @param {String} sComponent: component name of app function is called
     * @return {void}
     */
    TimeZoneSelect._setTimeZoneModelToView = function (that, sComponent) {
        that.getView().setModel(
            new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath(sComponent) + "/model/TimeZoneModel.json"),
            "TimeZone");
    };
    /**
     * Update TimeZone model with selected value
     * @name handleClose
     * @function
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    TimeZoneSelect.handleClose = function (oEvent) {
        var that = this,
            sPath = oEvent.getParameter("selectedContexts")[0].sPath,
            sValue = oEvent.getSource().getModel("TimeZone").getProperty(sPath).key,
            oRequestBody = {
                "Timezone": sValue
            };
        this._oTimeZoneSelect.getModel().update("/ResTimeZoneSet('')", oRequestBody, {
            success: function (oData, response) {
                that._oTimeZoneSelect.getModel("TimeZone").setProperty("/SelectedTimeZone", sValue);
            }
        });
    };
    /**
     * Filters values when searchbar is used
     * @name handleSearch
     * @function
     * @param {Object} oEvent: object which called the event
     * @return {void}
     */
    TimeZoneSelect.handleSearch = function (oEvent) {
        var sValue = oEvent.getParameter("value"),
            oFilter = new Filter("text", sap.ui.model.FilterOperator.Contains, sValue),
            oBinding = oEvent.getSource().getBinding("items");

        oBinding.filter([oFilter]);
    };
    /**
     * Gets the users selected timezone
     * @name _getUserTimeZone
     * @function
     * @param {Object} that: context of where fragment was called from
     * @return {void}
     */
    TimeZoneSelect._getUserTimeZone = function (that) {
        that.oView.getModel().read("/ResTimeZoneSet('')", {
            success: function (oData, response) {
                that.oView.getModel("TimeZone").setProperty("/SelectedTimeZone", oData.Timezone);
            }
        });
    };

    return TimeZoneSelect;

});
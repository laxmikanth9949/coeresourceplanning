sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/utils/DataManager",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/coe/capacity/reuselib/utils/formatter"
], function(Controller, DataManager, oHelpers, formatterReuse) {

    "use strict";

    return Controller.extend("sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.EditServiceOrder.fragment", {
        formatterReuse: formatterReuse,

        onBeforeOpen: function(oEvent) {
            var oDialog = oEvent.getSource();
            this._oComponentController = oEvent.getSource().getParent().getController();

            oDialog.setModel(new sap.ui.model.json.JSONModel(), "BusyModel");
            oDialog.setModel(new sap.ui.model.json.JSONModel(), "TempModel");

            oDialog.setModel(
                new sap.ui.model.resource.ResourceModel({
                    bundleUrl: jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/i18n.properties"
                }),
                "i18n");
        },

        onEmployeeChanged: function(oEvent) {
            var oTempModel = oEvent.getSource().getModel("TempModel");

            oTempModel.setProperty("/EmpID", oEvent.getParameter("empId"));
            oTempModel.setProperty("/ResGUID", oEvent.getParameter("resGuid"));
        },

        onEditAssignedServiceOrder: function(oEvent) {
            var oDialog = oEvent.getSource().getParent(),
                oModel = oDialog.getModel(),
                oDialogModel = oDialog.getModel("EditSelectedOrderDialogModel"),
                oData = this._updateTime(oDialogModel.getData()[0]),
                oParentController = oHelpers.getParentController(oDialog.getParent()),
                oTempModel = oDialog.getModel("TempModel"),
                sEmpId = oTempModel ? oTempModel.getProperty("/EmpID") : "",
                sResGuid = oTempModel ? oTempModel.getProperty("/ResGUID") : "";

            // if employee id and res guid are stored in temp model update data object with these values
            if (sEmpId && sResGuid) {
                oData.EmpId = sEmpId;
                oData.ResGuid = sResGuid;
            }

            DataManager.onEditAssignment(oParentController, oData, oModel);
            oDialog.close();
        },

        onCloseDialog: function(oEvent) {
            var oParentView = oEvent.getSource().getParent();
            if (oParentView.close) {
                oParentView.close();
            }
        },

        _updateTime: function(oData) {
            oData.BegDate.setHours(oData.StartTime.getHours());
            oData.BegDate.setMinutes(oData.StartTime.getMinutes());
            oData.BegDate.setSeconds(oData.StartTime.getSeconds());

            oData.EndDate.setHours(oData.EndTime.getHours());
            oData.EndDate.setMinutes(oData.EndTime.getMinutes());
            oData.EndDate.setSeconds(oData.EndTime.getSeconds());

            return oData;
        }

    });
});

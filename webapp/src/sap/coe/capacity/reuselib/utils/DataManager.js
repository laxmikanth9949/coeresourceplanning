sap.ui.define([
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/coe/capacity/reuselib/utils/ErrorCodeHelper",
    "sap/m/MessageToast"
], function(Messages, helpers, i18n, ErrorCodeHelper, MessageToast) {
    "use strict";

    var DataManager = {};

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */

    DataManager.onCreateTimeAllocation = function(that, sPath, oCreateRequestBody) {
        //TODO: Add Error handling
        that.getView().getModel().create(sPath, oCreateRequestBody, {
            success: function() {
                DataManager._requestSuccess(that, "Successfully Created.", that._oDialogCreateAllocation);
            },
            error: function(oResponse) {
                DataManager._requestError(oResponse, "Error While creating Time Allocation.");
            }
        });
    };

    DataManager.onDeleteTimeAllocation = function(that, sId, sResourceId, oModel) {
        //TODO: Add Error handling
        oModel.remove("/TimeAllocationList(ID='" + sId + "',ResourceGuid='" + sResourceId + "')", {
            success: function() {
                DataManager._requestSuccess(that, "Successfully Deleted.");
            },
            error: function(oResponse) {
                DataManager._requestError(oResponse, "Error While Deleting Time Allocation.");
            }
        });
    };

    DataManager.onEditTimeAllocation = function(that, sId, sResourceGuid, oUpdateRequestBody, oModel) {
        //TODO: Add Error handling
        oModel.update("/TimeAllocationList(ID='" + sId + "',ResourceGuid='" + sResourceGuid + "')", oUpdateRequestBody, {
            success: function() {
                DataManager._requestSuccess(that, "Successfully Edited.", that._oDialogEditAllocation);
            },
            error: function(oResponse) {
                DataManager._requestError(oResponse, "Error While Editing Time Allocation.");
            }
        });
    };


    //### Assignment API "/AssignmentList" ###

    DataManager.onEditAssignment = function(context, oAssignment, oModel) {
        //TODO: Add Error handling
        oModel.update(DataManager._getUrlForAssignments(oAssignment), DataManager._getObjectRequestForAssignments(oAssignment), {
            success: function() {
                DataManager._requestSuccess(context, "Successfully Edited.");
            },
            error: function(oResponse) {
                DataManager._displayAssignmentFailureDialogOnErrorResponse(oResponse, oAssignment);
            }
        });
    };

    DataManager.onDeleteAssignment = function(context, oAssignment, oModel, fnHandleDelete) {
        //TODO: Add Error handling
        oModel.remove(this._getUrlForAssignments(oAssignment), {
            success: function() {
                fnHandleDelete.call(context, oAssignment.ItemGuid);
                DataManager._requestSuccess(context, "Successfully Deleted.");
            },
            error: function(oResponse) {
                DataManager._displayAssignmentFailureDialogOnErrorResponse(oResponse, oAssignment);
            }
        });
    };

    DataManager._getUrlForAssignments = function(oAssignment) {
        var oRequest = this._getObjectRequestForAssignments(oAssignment);

        return "/AssignmentList(EmpID='" + oRequest.EmpID + "',BegDate=datetime'" + oRequest.BegDate + "',EndDate=datetime'" + oRequest.EndDate + "',AsgnGuid='" + oRequest.AsgnGuid + "')";

    };

    DataManager._getObjectRequestForAssignments = function(oData) {
        var startDateTimeFormatted = sap.coe.capacity.reuselib.utils.formatter.removeTimeOffset(oData.BegDate),
            endDateTimeFormatted = sap.coe.capacity.reuselib.utils.formatter.removeTimeOffset(oData.EndDate);

        return {
            "AsgnGuid": oData.ID,
            "EmpID": oData.EmpId,
            "BegDate": startDateTimeFormatted.toJSON().split(".")[0],
            "EndDate": endDateTimeFormatted.toJSON().split(".")[0],
            "ItemGuid": oData.ItemGuid,
            "ResGuid": oData.ResGuid,
            "BegTstmp": startDateTimeFormatted.toJSON().split(".")[0],
            "EndTstmp": endDateTimeFormatted.toJSON().split(".")[0],
            "Description": oData.ItemDescription
        };
    };


    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    DataManager._requestSuccess = function(that, sMessage, oDialog) {
        var oFilterBar, oController;

        if (that.getFragment) {
            oController = helpers.getParentController(that.getFragment());
            if (oController && !oController.byId) {
                oController = helpers.getParentController(oController.getParent());
            }
            oFilterBar = oController ? oController.byId("filterBar") : undefined;
        } else {
            oFilterBar = that.byId("filterBar");
        }
        if (oFilterBar) {
            oFilterBar.search();
        } else {
            if (that.readData) {
                that.readData();
            } else {
                oController = helpers.getParentController(that.getFragment());
                if (oController && !oController.readData) {
                    oController = helpers.getParentController(oController.getParent());
                }
                oController.readData();
            }
        }
        sap.m.MessageToast.show(sMessage);
        if (oDialog) {
            oDialog.close();
        }
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    DataManager._requestError = function(oResponse, sMessage) {
        sap.m.MessageToast.show(sMessage);
    };

    /**
     * Return error message if staffing failed
     *
     * @param {string} sItemGuid 
     * @param {Object} oAssignment
     * @return {void}
     * @public
     */
    DataManager._displayAssignmentFailureDialog = function(sItemGuid, oAssignment) {
        var sServiceTeam = oAssignment.ServiceTeamName,
            sId = parseInt(oAssignment.DemandId),
            sText = i18n.getText("ASSIGNMENT_FAILURE_DIALOG1") + sId + " " + i18n.getText("ASSIGNMENT_FAILURE_DIALOG2") 
                + sId + " " + i18n.getText("ASSIGNMENT_FAILURE_DIALOG3") + " " + sId 
                + " " + i18n.getText("ASSIGNMENT_FAILURE_DIALOG4") + " " + sServiceTeam + i18n.getText("ASSIGNMENT_FAILURE_DIALOG5");

        sap.m.MessageBox.error(sText, {
            title: "Error",
            styleClass: "",
            initialFocus: null,
            textDirection: sap.ui.core.TextDirection.Inherit
        });
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */

    DataManager.getOrgUnit = function(sEmpId, sOrgUnit, oFragment, that) {

        that.getView().getModel().read("/OrgUnitSet(EmpId='',OrgId='" + sOrgUnit + "')", {
            urlParameters: {
                "$expand": "SubOrgUnitSet",
                "$format": "json"
            },
            success: function(odata) {
                var oOrgUnitModel;
                var oList = oFragment.oOrgUnitList;
                that._orgUnit = odata;
                if (that._oView.getModel("OrgUnitModel")) {
                    oOrgUnitModel = that.getView().getModel("OrgUnitModel");
                } else {
                    oOrgUnitModel = new sap.ui.model.json.JSONModel();
                    that._oView.setModel(oOrgUnitModel, "OrgUnitModel");
                }
                if (odata.SubOrgUnitSet.results.length > 0) {
                    odata.hasSubUnit = true;
                    that._orgUnit.hasSubUnit = true;
                    oOrgUnitModel.setData(odata);
                } else {
                    that._orgUnit.hasSubUnit = false;
                    odata.hasSubUnit = false;
                    odata.SubOrgUnitSet = [{ OrgId: odata.OrgId, OrgText: odata.OrgText }];
                }
                oOrgUnitModel.setData(odata);
                if (!that.oOrgNavigation) {
                    that.oOrgNavigation = [];
                    that.oOrgNavigation.push({ id: that._orgUnit.CurUnit });
                    that.oOrgNavigation.push({ id: that._orgUnit.HigherUnt });
                } else {
                    that.oOrgNavigation.push({ id: that._orgUnit.HigherUnt });
                }
                oFragment._setAggregationOrgUnit(oList, odata);
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };

    DataManager.onRead = function(that, aFilters) {
        that._oPlanningCalendar.setBusy(true);
        that._oView.getModel().read("/ResourceList", {
            urlParameters: {
                "$expand": "RPTASTDataSet,QualificationSet"
            },
            filters: aFilters,
            success: function(odata) {

                if (odata.results.length > 0) {
                    that._oView.setModel(that._oPlanningCalendar.getModel("resourceModel"), "resourceModel");
                    var aCWData = that._oPlanningCalendar.getModel("UIModel").getProperty("/CalendarWeek");

                    odata.results[0].CWData = {
                        "results": aCWData
                    };

                    that._oPlanningCalendar.getModel("resourceModel").setProperty("/", odata.results);
                }
                else{
                    MessageToast.show(i18n.getText("COMPONENT_RESOURCE_PLANNING_CALENDAR_RESOURCES_READ_EMPTY"));
                }
                that._oPlanningCalendar.setBusy(false);
            },
            error: function(response) {
                that._oPlanningCalendar.setBusy(false);
                Messages.showErrorMessage(response);
            }
        });
    };
    //displays prompt message box if user doesnt have a valid service arrangement: ExternalKey = ""
    DataManager.checkServiceArrangementValid = function(oMyStaffingController, oModel, sInumber) {
        oModel.read("/ServiceArrangmentHeaderSet('" + sInumber + "')", {
            success: function(oData) {
                if(oData.ExternalKey === ""){
                    //this refer
                    oMyStaffingController.displayNoServiceArrangementMsgBox();
                }
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };
    //create a service arrangement using oData service ServiceArrangmentHeaderSet
    DataManager.createServiceArrangement = function(oModel, sInumber) {
        var oCreateRequestBody = {
            EmpId : sInumber
        };
        oModel.create("/ServiceArrangmentHeaderSet", oCreateRequestBody, {
            success: function(oData) {
                MessageToast.show(i18n.getText("MSG_TOAST_SERV_ARRANGE_CREATED"));
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };

    DataManager.getUserOrgUnit = function(oControl, sEmpId, fnCallBack, aParameters) {
        oControl.getModel().read("/OrgUnitSet(EmpId='" + sEmpId + "',OrgId='')", {
            urlParameters: {
                "$expand": "SubOrgUnitSet",
                "$format": "json"
            },
            success: function(oData) {
                fnCallBack(oData, aParameters, oControl);
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };
    /**
         * Gets all the necessary params to call the error code helper functions
         *
         * @public
         * @param {string} oResponse - failure response from back-end
         * @returns {void}
         */
        //function duplicate in AssignServiceOrder + AssignWorklistDemand
       DataManager._displayAssignmentFailureDialogOnErrorResponse = function(oResponse, oAssignment){
            var sErrorMsg = JSON.parse(oResponse.responseText),
            	aErrorCodes = sErrorMsg.error.innererror.errordetails,
            	sErrorMsgDisplay = "";

            sErrorMsgDisplay += ErrorCodeHelper.getMessageForErrorCodesFromDataManager(aErrorCodes, oAssignment, oAssignment.ServiceTeamName);
            ErrorCodeHelper.displaySoErrorDialog(sErrorMsgDisplay);
        };

    DataManager.getPublicHolidays = function(that, aFilters) {
        that.getView().getModel().read("/ResPublicHolidaysSet", {
            filters: aFilters,
            success: function(oData, response) {
                var dHolidayDate;
                if (oData.results.length > 0) {
                    for (var i = 0; i < oData.results.length; i++) {
                        dHolidayDate = new sap.ui.unified.DateTypeRange({startDate: oData.results[i].HollidayDate});
                        that._oPlanningCalendar.addSpecialDate(dHolidayDate);
                    }
                } else {
                    return;
                }
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };

    return DataManager;

});
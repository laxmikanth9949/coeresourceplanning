sap.ui.define([
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/coe/capacity/reuselib/utils/helpers"
], function(Messages, helpers) {
    "use strict";

    return {

        //TimeAllocationList

        createTimeAllocation: function(oModel, oAllocation, fSuccess, fError) {
            var that = this;

            oModel.create("/TimeAllocationList", oAllocation, {
                success: function(oData, oResponse) {
                    that.success(oData, oResponse);
                    if (fSuccess) fSuccess(oData, oResponse);
                },
                error: function(oResponse) {
                    that.error(oResponse);
                    if (fError) fError(oResponse);
                }
            });
        },

        /* eslint-disable sap-no-ui5base-prop */
        /* eslint-disable sap-no-event-prop */
        updateTimeAllocation: function(oModel, oParams, fSuccess, fError) {
            var that = this;

            oModel.update("/TimeAllocationList(ID='" + oParams.sId + "',ResourceGuid='" + oParams.sResourceGuid + "')", oParams.oUpdateRequestBody, {
                success: function(oData, oResponse) {
                    that.success(oData, oResponse);
                    oResponse.oDialog = oParams.oDialog;
                    oResponse.sSuccessMessage = oParams.sSuccessMessage;
                    if (fSuccess) fSuccess(oData, oResponse);
                },
                error: function(oResponse) {
                    that.error(oResponse);
                    oResponse.sErrorMessage = oParams.sErrorMessage;
                    if (fError) fError(oResponse);
                }
            });
        },

        //ResourceList

        readResource: function(oModel, aFilters, fSuccess, fError) {
            var that = this;
            oModel.read("/ResourceList", {
                urlParameters: {
                    "$expand": "RPTASTDataSet,QualificationSet"
                },
                filters: aFilters,
                success: function(oData, oResponse) {
                    that.success(oData, oResponse);
                    if (fSuccess) fSuccess(oData, oResponse);
                },
                error: function(oResponse) {
                    that.error(oResponse);
                    if (fError) fError(oResponse);
                }
            });
        },

        success: function(oData, oResponse) {
            //TODO: Handle generic default success behaviour
        },

        error: function(oResponse) {
            Messages.showErrorMessage(oResponse);
        }

    };

});

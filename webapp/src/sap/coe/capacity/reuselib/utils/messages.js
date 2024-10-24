sap.ui.define([], function() {
    "use strict";

    var Messages = {};

    /**
     * Show an error dialog with information from the oData response object.
     *
     * @param {object}
     *            oParameter The object containing error information
     * @return {void}
     * @public
     */
    Messages.showErrorMessage = function(oParameter) {
        var oErrorDetails = this._parseError(oParameter),
            oMsgBox = sap.m.MessageBox.error(oErrorDetails.sDetails, {
                title: oErrorDetails.sMessage
            });
        if (!sap.ui.Device.support.touch) {
            oMsgBox.addStyleClass("sapUiSizeCompact");
        }
    };

    Messages.getErrorContent = function(oParameter) {
        return this._parseError(oParameter).sMessage;
    };

    Messages._parseError = function(oParameter) {
        var sMessage = "",
            sDetails = "",
            oEvent = null,
            oResponse = null,
            oError = {};

        if (oParameter.getParameters()) {
            oEvent = oParameter;
            sMessage = oEvent.getParameter("message");
            sDetails = oEvent.getParameter("responseText");
        } else if (oParameter.response) {
            oResponse = oParameter;
            sMessage = oResponse.message;
            sDetails = oResponse.response.body;
        } else {
            oResponse = oParameter;
            sMessage = oResponse.message;
            sDetails = oResponse.responseText;
        }

        if (jQuery.sap.startsWith(sDetails, "{\"error\":")) {
            var oErrModel = new sap.ui.model.json.JSONModel();
            oErrModel.setJSON(sDetails);
            sMessage = oErrModel.getProperty("/error/message/value");
        }

        oError.sDetails = sDetails;
        oError.sMessage = sMessage;
        return oError;
    };

    /**
     * Retutn the error object from a batch request
     *
     * @param {object}
     *            oParameter The object containing error information
     * @return {object}
     * @public
     */
    Messages.parseBatchError = function(oParameter) {

        var oResponse = oParameter,
            sDetails = oResponse.responseText,
            iFirstIndex = sDetails.indexOf("{"),
            iLastIndex = sDetails.lastIndexOf("}"),
            oError = JSON.parse(sDetails.substring(iFirstIndex, iLastIndex) + "}");
        
        return oError;
    };

    return Messages;

});

jQuery.sap.declare("sap.coe.rpa.util.messages");
jQuery.sap.require("sap/m/MessageBox");

sap.coe.rpa.util.messages = {};

/**
 * Show an error dialog with information from the oData response object.
 *
 * @param {object}
 *            oParameter The object containing error information
 * @return {void}
 * @public
 */
sap.coe.rpa.util.messages.showErrorMessage = function(oParameter) {
	var oErrorDetails = sap.coe.rpa.util.messages._parseError(oParameter),
		oMsgBox = sap.m.MessageBox.error(oErrorDetails.sDetails, {
                            title: oErrorDetails.sMessage,
                            styleClass: "",
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit
                        });
	if (!sap.ui.Device.support.touch) {
		oMsgBox.addStyleClass("sapUiSizeCompact");
	}
};

sap.coe.rpa.util.messages.getErrorContent = function(oParameter) {
	return sap.coe.rpa.util.messages._parseError(oParameter).sMessage;
};

sap.coe.rpa.util.messages._parseError = function(oParameter) {
	var sMessage = "",
		sDetails = "",
		oEvent = null,
		oResponse = null,
		oError = {};

	if (oParameter.getParameters()) {
		oEvent = oParameter;
		sMessage = oEvent.getParameter("message");
		sDetails = oEvent.getParameter("responseText");
	} else {
		oResponse = oParameter;
		sMessage = oResponse.message;
		sDetails = oResponse.response.body;
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
sap.ui.define([
	"sap/coe/capacity/reuselib/utils/i18n",
	"sap/coe/capacity/reuselib/utils/formatter"
], function (i18n, formatterReuse) {
	"use strict";

	var ErrorCodeHelper = {};

	/**
	     * Builds
	     * that to return the corrosponding item in the model
	     *
	     * @public
	     * @param {object} aErrorCodes - array containing error codes
	     * @param {string} sItemGuid - string for item guid of demand
	     * @param {object} oDemand - object which represents the SO 
	     * @param {object} oOrg - object which represents the organisation

	     * @returns {string} - returns string which is used to display error message
	     */

	ErrorCodeHelper.getMessageForErrorCodes = function (aErrorCodes, oDemand, oOrg) {
		var sServiceTeam = oOrg === undefined ? "" : oOrg.ServiceTeamName,
			sId = oDemand.DemandID,
			sItemNo = oDemand.ItemNo.replace(/^0+/, ""),
			sErrorMsgDisplay = i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_INTRO_1"),
			iDuplicateAuthCodeCounter = 0,
			iDuplicateStatusCodeCounter = 0,
			iErrorCodeCounter = 0;

		sErrorMsgDisplay += " " + formatterReuse.toInteger(sId) + " / " + sItemNo + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_INTRO_2");
		//This loop is a work around because Jenkins build fails for JS function array.some
		for (var i = 0; i < aErrorCodes.length; i++) {
			if ((aErrorCodes[i].code === "WFDS_SGE/064" || aErrorCodes[i].code === "WFDS_UI/101") && iDuplicateAuthCodeCounter < 1) { //not authorised
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_NOT_AUTH_1") + " " + sServiceTeam + i18n.getText(
					"ASSIGNMENT_FAILURE_NEW_DIALOG_NOT_AUTH_2");
				iDuplicateAuthCodeCounter++;
				iErrorCodeCounter++;
			}

			if (aErrorCodes[i].code === "CRM_ORDER/013") { //locked by other user
				var sEmpID = aErrorCodes[i].message.split("user ").pop();

				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_2");
				sErrorMsgDisplay += " " + sEmpID + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_3");
				iErrorCodeCounter++;

			}

			if (aErrorCodes[i].code === "ZS00/163") { //Already staffed
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " / " + sItemNo + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_2") + " ";
				sErrorMsgDisplay += oDemand.FirstName + " " + oDemand.LastName + " (" + oDemand.EmpID + ") " + i18n.getText(
					"ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_3");
				iErrorCodeCounter++;

			}

			if (aErrorCodes[i].code === "ZS00/162" && iDuplicateStatusCodeCounter < 1) { //status that doesnt allow further staffing
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_2") + " " + formatterReuse.capitilizeWords(oDemand.HeaderStatusTxt) +
					" ";
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_3");
				iDuplicateStatusCodeCounter++;
				iErrorCodeCounter++;

			}

			//all these string manipulations are not ideal but its a workaround. back end should return the messages to be displayed
			if (aErrorCodes[i].code === "WFDS_SGE/429") {
				var aMessageParts = aErrorCodes[i].message.split(";", 3);
				var sFirstName = aMessageParts[0].split(" ")[1];
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_1") + " " + aMessageParts[1].slice(1, 11);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_2") + " " + aMessageParts[2].slice(1,
					11);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_3") + " " + aMessageParts[0];
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_4") + " " + sFirstName;
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_5");
				iErrorCodeCounter++;

			}
			if (aErrorCodes[i].code === "/SAPAPO/LRP_ERROR/056") {
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_END_DATE_NOT_AFTER_START_DATE_1");
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_END_DATE_NOT_AFTER_START_DATE_2");
				iErrorCodeCounter++;

			}

		}
		if (iErrorCodeCounter === 0) {
			sErrorMsgDisplay += this.getMessageForUnknownError(aErrorCodes);
		}

		return sErrorMsgDisplay;

	};

	ErrorCodeHelper.getMessageForErrorCodesFromDataManager = function (aErrorCodes, oDemand, sServTeam) {
		var sServiceTeam = sServTeam === undefined ? "" : sServTeam,
			sId = oDemand.DemandId,
			sItemNo = oDemand.ItemNo.replace(/^0+/, ""),
			sErrorMsgDisplay = i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_INTRO_1"),
			iDuplicateAuthCodeCounter = 0,
			iDuplicateStatusCodeCounter = 0,
			iErrorCodeCounter = 0;

		sErrorMsgDisplay += " " + formatterReuse.toInteger(sId) + " / " + sItemNo + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_INTRO_2");
		//This loop is a work around because Jenkins build fails for JS function array.some
		for (var i = 0; i < aErrorCodes.length; i++) {
			if ((aErrorCodes[i].code === "WFDS_SGE/064" || aErrorCodes[i].code === "WFDS_UI/101") && iDuplicateAuthCodeCounter < 1) { //not authorised
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_NOT_AUTH_1") + " " + sServiceTeam + i18n.getText(
					"ASSIGNMENT_FAILURE_NEW_DIALOG_NOT_AUTH_2");
				iDuplicateAuthCodeCounter++;
				iErrorCodeCounter++;

			}

			if (aErrorCodes[i].code === "CRM_ORDER/013") { //locked by other user
				var sEmpID = aErrorCodes[i].message.split("user ").pop();

				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_2");
				sErrorMsgDisplay += " " + sEmpID + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_LOCKED_3");
				iErrorCodeCounter++;

			}

			if (aErrorCodes[i].code === "ZS00/163") { //Already staffed
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " / " + sItemNo + " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_2") + " ";
				sErrorMsgDisplay += oDemand.CreateBy + " (" + oDemand.EmpId + ") " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STAFFED_3");
				iErrorCodeCounter++;

			}

			if (aErrorCodes[i].code === "ZS00/162" && iDuplicateStatusCodeCounter < 1) { //status that doesnt allow further staffing
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_1") + " " + formatterReuse.toInteger(sId);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_2") + " " + formatterReuse.capitilizeWords(oDemand.HeaderStatusTxt) +
					" ";
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_STATUS_3");
				iDuplicateStatusCodeCounter++;
				iErrorCodeCounter++;

			}

			//all these string manipulations are not ideal but its a workaround. back end should return more complete messages to be displayed
			if (aErrorCodes[i].code === "WFDS_SGE/429") {
				var aMessageParts = aErrorCodes[i].message.split(";", 3);
				var sFirstName = aMessageParts[0].split(" ")[1];
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_1") + " " + aMessageParts[1].slice(1, 11);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_2") + " " + aMessageParts[2].slice(1,
					11);
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_3") + " " + aMessageParts[0];
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_4") + " " + sFirstName;
				sErrorMsgDisplay += " " + i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_RESOURCE_VALIDITY_DATES_5");
				iErrorCodeCounter++;

			}
			if (aErrorCodes[i].code === "/SAPAPO/LRP_ERROR/056") {
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_END_DATE_NOT_AFTER_START_DATE_1");
				sErrorMsgDisplay += i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_END_DATE_NOT_AFTER_START_DATE_2");
				iErrorCodeCounter++;

			}
		}

		if (iErrorCodeCounter === 0) {
			sErrorMsgDisplay += this.getMessageForUnknownError(aErrorCodes);
		}

		return sErrorMsgDisplay;

	};

	ErrorCodeHelper.getMessageForUnknownError = function (aErrorCodes) {
		var sErrorMsg = "";

		for (var i = 0; i < aErrorCodes.length; i++) {
			if (aErrorCodes[i].severity === "error") {
				sErrorMsg = i18n.getText("ASSIGNMENT_FAILURE_NEW_DIALOG_UNEXPECTED_ERROR_1") + " " + aErrorCodes[i].code + i18n.getText(
					"ASSIGNMENT_FAILURE_NEW_DIALOG_UNEXPECTED_ERROR_2");
				break;
			}
		}
		return sErrorMsg;

	};

	ErrorCodeHelper.displaySoErrorDialog = function (sText) {
		sap.m.MessageBox.error(sText, {
			title: "Error",
			styleClass: "",
			initialFocus: null,
			textDirection: sap.ui.core.TextDirection.Inherit
		});

	};

	return ErrorCodeHelper;

});
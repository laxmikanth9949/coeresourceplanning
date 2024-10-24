jQuery.sap.declare("sap.coe.capacity.reuselib.utils.FormatterBkUp");
jQuery.sap.require("sap.coe.capacity.reuselib.utils.i18n");
/* eslint-disable sap-no-global-variable */
/* eslint-disable no-undef */
var i18n = sap.coe.capacity.reuselib.utils.i18n;

sap.coe.capacity.reuselib.utils.FormatterBkUp = {

	/**
	 * Returns the correct type to set the Planning Calendar
	 * colour
	 * @param {str} Appointment Type string
	 * @return {str} SAPUI5 Appointment Type string
	 * @public
	 */

	setAppointmentType: function (sColorCode) {
		var sType;
		if (sColorCode !== "") {
			sType = "Type0" + sColorCode;
		}
		return sType;
	},

	setBindingTextForDescription: function (sAType, sTAType, sASType) {
		var sCategory;
		var oData = this.getModel("ReuseModel").getData().CodeColour;
		if (sAType && sAType !== "" && sAType === "TAL") {
			sCategory = sTAType;
		} else if (sAType && sAType !== "" && sAType === "ASG") {
			var sItemText = "Item";
			sCategory = sItemText + " " + parseInt(sASType, 10) + " " + sTAType;
		} else {
			sCategory = " ";
		}
		return i18n.getText(sCategory);
	},
	setBindingTextForCategory: function (sAType, sTAType) {
		var sCategory;
		var oData = this.getModel("ReuseModel").getData().CodeColour;
		if (sAType && sAType !== "" && sAType === "TAL" && sTAType !== "") {
			sCategory = sap.coe.capacity.reuselib.utils.FormatterBkUp.convertSubmissionStatus(sTAType);
			sCategory = i18n.getText(sCategory);
		} else if (sAType && sAType !== "" && sAType === "ASG" && sTAType !== "") {
			sCategory = sTAType;
		} else {
			sCategory = " ";
		}
		return i18n.getText(sCategory);
	},

	setAppointmentHeader: function (sType) {
		var sText;
		switch (sType) {
		case "TAL":
			sText = "Time Allocation ";
			break;
		case "ASG":
			sText = "Demand ";
			break;
		case "":
			sText = "Soft Booking";
		}
		return sText + "Detail";
		//return sap.coe.capacity.reuselib.utils.FormatterBkUp._oBundle.getText(sCategory);
	},

	setBindingTextForCreatedBy: function (sAssignmentSet, sTimeAllocationSet) {
		//TODO: Refactor and add SoftBooking functionality
		var sText;
		var oData = this.getModel("ReuseModel").getData().CodeColour;
		if (sAssignmentSet && sAssignmentSet !== "") {
			sText = oData[sAssignmentSet].CreatedBy;
		} else if (sTimeAllocationSet && sTimeAllocationSet !== "") {
			sText = oData[sTimeAllocationSet].CreatedBy;
		} else {
			sText = "Other";
		}
		return sText;
	},

	formatItemType: function (sCatalogType) {
		var sType = "";
		if (sCatalogType && sCatalogType !== "") {
			sType = (sCatalogType === "QK") ? "Navigation" : "Inactive";
		} else {
			sType = "Inactive";
		}
		return sType;
	},

	isSelected: function (sIdValue) {
		var oVariantFilterModelData = this.getModel("TempModel").getData();
		var bIsSelected = false;
		var sQualificationId = sIdValue ? sIdValue + ";0000" : undefined;

		if (sIdValue && oVariantFilterModelData[sIdValue]) {
			bIsSelected = oVariantFilterModelData[sIdValue];
		}

		//Temp fix: Qualification id has ";0000" appended, so we append the same string to check if there are keys in the object with this pattern
		if (sQualificationId && oVariantFilterModelData[sQualificationId]) {
			bIsSelected = oVariantFilterModelData[sQualificationId];
		}
		return bIsSelected;
	},

	isSelectedNew: function (sIdValue) {
		//if the model is empty return
		var oTempModel = this.getModel("TempModel");
		if (!oTempModel.getProperty("/selected") || oTempModel.getProperty("/selected").length < 1) return;
		var oVariantFilterModelData = this.getModel("TempModel").getProperty("/selected");
		var bIsSelected = false;
		var sQualificationId = sIdValue ? sIdValue + ";0000" : undefined;

		if (sIdValue && oVariantFilterModelData[sIdValue]) {
			bIsSelected = oVariantFilterModelData[sIdValue];
		}

		//Temp fix: Qualification id has ";0000" appended, so we append the same string to check if there are keys in the object with this pattern
		if (sQualificationId && oVariantFilterModelData[sQualificationId]) {
			bIsSelected = oVariantFilterModelData[sQualificationId];
		}
		return bIsSelected;
	},

	isTimeZoneSelected: function (sId) {
		var sTimeZone = this.getModel("TimeZone").getProperty("/SelectedTimeZone");
		var bIsSelected = false;
		if (sId && sTimeZone !== "") {
			bIsSelected = (sId === sTimeZone) ? true : false;
		}
		return bIsSelected;
	},

	JSONStringify: function (sJSON) {
		return JSON.parse(sJSON);
	},

	convertSubmissionStatus: function (code) {
		if (code === undefined || code === null) {
			return "";
		}
		return i18n.getText("FRAGMENT_CREATEALLOCATION_CATEGORYLIST_CATEGORYID_" + code);
	},

	/**
	 * Format duration string given in minutes as duration given in days, hours and minutes
	 *
	 * @public
	 * @param {string} sDuration the string in minutes to be formatted
	 * @returns {string} sValue the formatted duration
	 */
	duration: function (sDuration) {
		var iMinutes = Math.floor(parseInt(sDuration) % 60),
			iHours = Math.floor((parseInt(sDuration) / 60) % 24),
			iDays = Math.floor((parseInt(sDuration) / 60) / 24),
			sFormattedDuration = "";

		if (iDays > 0) sFormattedDuration += iDays + " " + i18n.getText("FRAGMENT_SERVICE_DEMAND_DETAILS_DAYS") + " ";
		if (iHours > 0) sFormattedDuration += iHours + " " + i18n.getText("FRAGMENT_SERVICE_DEMAND_DETAILS_HOURS") + " ";
		if (iMinutes > 0) sFormattedDuration += iMinutes + " " + i18n.getText("FRAGMENT_SERVICE_DEMAND_DETAILS_MINUTES") + " ";

		return sFormattedDuration;
	},

	addDaysToDuration: function (sDays) {
		var sText = i18n.getText("VIEW_MYSTAFFING_TABLE_COLUMN_DAYS");
		var iDays = parseInt(sDays, 10);
		var sResult = "";
		if (iDays === undefined || iDays === null || isNaN(iDays) || iDays === 0) {
			sResult = "";
		} else {
			sResult = iDays + " " + sText;
		}
		return sResult;
	},

	getDisplayDate: function (oTimeAllocation, oAssignmentSet, oSoftbooking) {
		var oDate;
		if (oTimeAllocation) {
			oDate = oTimeAllocation;
		} else if (oAssignmentSet) {
			oDate = oAssignmentSet;
		} else {
			oDate = oSoftbooking;
		}
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern: "dd/MM/YYYY h:mm a Z"
		}, new sap.ui.core.Locale("en-US"));
		return oDateFormat.format(oDate);

	},

	getDescription: function (sAType, iColorCode, sQualTxt, sIDesc) {
		if (sAType === "ASG" && iColorCode === 6) {
			return sQualTxt;
		} else {
			return sIDesc;
		}

	},

	getTimeZone: function (oTimeAllocation, oAssignmentSet, oSoftbooking) {
		var oDate;
		var sText = i18n.getText("VIEW_MYSTAFFING_TABLE_UTC");
		if (oTimeAllocation) {
			oDate = oTimeAllocation;
		} else if (oAssignmentSet) {
			oDate = oAssignmentSet;
		} else {
			oDate = oSoftbooking;
		}
		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			pattern: "X"
		}, new sap.ui.core.Locale("en-US"));
		return sText + " " + oDateFormat.format(oDate);

	},

	/**
	 * Format the date as output string
	 *
	 * @public
	 * @param {object} oDate the date to be formatted
	 * @returns {string} sValue the formatted date
	 */
	date: function (oDate) {
		var oDateFormat = DateFormat.getDateInstance({
			pattern: "MMM d,YYYY"
		}, new sap.ui.core.Locale("en-US"));
		return oDateFormat.format(oDate);
	},

	/**
	 * Format the date as output string with the hour and the time zone
	 *
	 * @public
	 * @param {object} oDate the date to be formatted
	 * @returns {string} sValue the formatted date
	 */
	dateTime: function (oDate) {
		if (!oDate) return;
		var oDateFormat = DateFormat.getDateInstance({
			pattern: "dd/MM/YYYY hh:mm a ZZZZ"
		}, new sap.ui.core.Locale("en-US"));
		return oDateFormat.format(oDate);
	},

	/**
	 * Convert number given as string to an integer.
	 * Useful to trim left zeros of numbers or for numbers mixed with strings
	 *
	 * @param {String} sNumber to be converted to string
	 * @return {Integer} The number
	 * @public
	 */
	toInteger: function (sNumber) {
		var iInt = parseInt(sNumber);
		return isNaN(iInt) ? sNumber : iInt;
	},

	/**
	 * Gets the text value to a specific key value out of the UtilsModel.
	 * @public
	 * @param {string} Key value.
	 * @returns {string} Text value
	 */
	staffingLevel: function (sStaffingLevelKey) {
		var aStaffingLevelEntries = this.getView().getModel("UtilsModel").getProperty("/StaffingLevel");

		for (var i = 0; i < aStaffingLevelEntries.length; i++) {
			if (aStaffingLevelEntries[i].key === sStaffingLevelKey) return aStaffingLevelEntries[i].text;
		}

		return "";
	},

	/**
	 * Returns the date object minus the browser timezone offset
	 * @public
	 * @param {object} Date Object.
	 * @returns {object} Date Object.
	 */
	removeTimeOffset: function (oDate) {
		var iOffsetInverse = (-1 * (oDate.getTimezoneOffset() * 60000));
		return new Date(oDate.getTime() + iOffsetInverse);
	},

	/**
	 * Returns the date object instantiated to the last second of the same day.
	 * Useful in date range when you want the last day to be included in the request
	 *
	 * @public
	 * @param {object} Date Object.
	 * @returns {object} Date Object.
	 */
	getDateForLastSecondOfDay: function (oDate) {
		var oLastSecondDayDate = new Date(oDate);

		oLastSecondDayDate.setHours(23);
		oLastSecondDayDate.setMinutes(59);
		oLastSecondDayDate.setSeconds(59);

		return oLastSecondDayDate;
	}

};
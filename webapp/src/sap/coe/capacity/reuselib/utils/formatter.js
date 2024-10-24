sap.ui.define([
	"sap/coe/capacity/reuselib/utils/baseclasses/Formatter",
	"sap/coe/capacity/reuselib/utils/i18n"
], function (FormatterBaseClass, i18n) {
	"use strict";

	var FormatterReuseClass = FormatterBaseClass.extend("sap.coe.capacity.reuselib.utils.formatter", {

		//this function will be moved to the base class once isSelected is formatted
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

			//Temporary fix: Qualification id has ";0000" appended, so we append the same string to check if there are keys in the object with this pattern
			if (sQualificationId && oVariantFilterModelData[sQualificationId]) {
				bIsSelected = oVariantFilterModelData[sQualificationId];
			}
			return bIsSelected;
		},

		/**
		 * Return boolean if time zone is selected
		 * @param {String} sId name of the timezone area
		 * @return {Boolean} true or false
		 * @public
		 */
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

		/**
		 * Returns the correct type to set the Planning Calendar
		 * colour
		 * @param {str} Appointment Type string
		 * @return {str} SAPUI5 Appointment Type string
		 * @public
		 */

		setAppointmentType: function (oAppointment) {
			var sType;
			if (oAppointment.ColorCode !== "") {
				sType = "Type0" + oAppointment.ColorCode;
			}

			if (oAppointment.Type === "TAL") {
				switch (oAppointment.SHPName) {
					//no travel/remote
				case "ZAB":
					sType = "Type01";
					break;
					//trainer
				case "ZTREE":
					sType = "Type03";
					break;
					//office blocked
				case "ZOB":
					sType = "Type07";
					break;
					//office blocked
				case "ZISH":
					sType = "Type08";
					break;
					//absence (user-added)    
				case "ZVAC":
					sType = "Type02";
					break;
					//absence (from IPP)    
				case "ZISV":
					sType = "Type09";
					break;
				}
			}
			return sType;
		},

		/**
		 * Returns the correct text from i18n depending on allocation type
		 * @param {str} Appointment Type string
		 * @return {str} i18n category type
		 * @public
		 */
		setBindingTextForDescription: function (sType, sDemandID, sItemNo, sItemDesc) {
			if (sType === "ASG") {
				return parseInt(sDemandID, 10) + "/" + parseInt(sItemNo, 10) + " " + sItemDesc;
			} else if (sType === "SFT") {
				return parseInt(sDemandID, 10) + ", " + sItemDesc;
			} else {
				return "";
			}
		},

		/**
		 * Returns the visibility value based on the data containing a valid value (ie not blank, null or 0)
		 * @param {var} value - can be multiple types (Dates, strings, int, etc)
		 * @return {boolean} boolean value used for setting visibility
		 * @public
		 */
		setVisibilityOfFields: function (value) {
			if (typeof value === "string" && parseInt(value, 10) === 0) {
				return false;
			} else {
				return !!value;
			}
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
		},

		/**
		 * Counts the number of resources in the oData model for the table
		 *
		 * @public
		 * @param {Array} aResources.
		 * @returns {String} the oModel length and formatted string.
		 */
		countResources: function (aResources) {
			var sResourcesCount = (aResources.length === undefined) ? 0 : aResources.length;
			return i18n.getText("COMPONENT_RESOURCE_PLANNING_CALENDAR_RESOURCES_COUNTER") + " (" + sResourcesCount + ")";
		},

		/**
		 * Displays the users current time zone
		 *
		 * @public
		 * @param {String} sDesc - the string description
		 * @param {String} sTimeZone - the users current time zone
		 * @param {Object} oTimeZones - the model of all TimeZones
		 * @returns {String} the formatted string with the users time zone.
		 */
		displayTimeZone: function (sDesc, sTimeZone, oTimeZones) {
			if ((oTimeZones !== undefined) && (oTimeZones.hasOwnProperty("TimeZones"))) {
				var iTimeZones = oTimeZones.TimeZones.length,
					sTimeZoneText = "";
				for (var i = 0; i < iTimeZones; i++) {
					if (oTimeZones.TimeZones[i].key === sTimeZone) {
						sTimeZoneText = oTimeZones.TimeZones[i].text;
						break;
					}
				}
				return sDesc + ": " + sTimeZoneText;
			}
		},

		/**
		 * Concatenates two values, the second is put into brackets
		 *
		 * @public
		 * @param {String} sValue1 - first value
		 * @param {String} sValue2 - second value
		 * @returns {String} formatted string.
		 */
		concatWithBrackets: function (sValue1, sValue2) {
			return sValue1 + " " + "(" + sValue2 + ")";
		},

		/**
		 * Capitializes word in a string
		 *
		 * @public
		 * @param {String} sValue1 - first value
		 * @returns {String} formatted string.
		 */
		capitilizeWords: function (sValue) {
			if (sValue === undefined) {
				return "";
			}
			var sNewSentence = "";
			sValue.split(" ").forEach(function (word) {
				sNewSentence += word.charAt(0).toUpperCase() + word.slice(1) + " ";

			});

			return sNewSentence;
		},

		/**
		 * Concatenates two values, the second is put into brackets
		 *
		 * @public 
		 * @param {String} sValue1 - first value
		 * @param {String} sValue2 - second value
		 * @returns {String} formatted string.
		 */
		concatValues: function (sValue1, sDays, sValue3) {
			var sText = i18n.getText("VIEW_MYSTAFFING_TABLE_COLUMN_DAYS"),
				iDays = parseFloat(sDays, 10),
				sResult = "";

			if (sValue1 !== "") {
				sResult += sValue1 + " ";
			}
			if (iDays === undefined || iDays === null || isNaN(iDays) || iDays === 0) {
				sResult += "";
			} else {
				sResult += iDays + " " + sText;
			}
			if (sValue3 !== "") {
				sResult += " " + sValue3;
			}
			return sResult;
		},

		/**
		 * Concatenates two values, puts a forward slash between them
		 *
		 * @public
		 * @param {String} sValue1 - first value
		 * @param {String} sValue2 - second value
		 * @returns {String} formatted string.
		 */
		seperateWithSlash: function (sValue1, sValue2) {
			var iValue1 = parseInt(sValue1, 10),
				iValue2 = parseInt(sValue2, 10);
			return (isNaN(iValue1) || isNaN(iValue2)) ? sValue1 + " / " + sValue2 : iValue1 + " / " + iValue2;
		},

		/**
		 * Concatenates values for calendar resource title based of p13n settings
		 *
		 * @public
		 * @param {String} sName
		 * @param {String} sEmpId
		 * @returns {String} formatted string.
		 */
		formatPersTitle: function (sName, sEmpId) {
			if (this.getModel("p13nModel").oData.calPersKey.empId) {
				return sName + " - " + sEmpId;
			} else {
				return sName;
			}
		},

		/**
		 * Concatenates values for calendar resource text based of p13n settings
		 *
		 * @public
		 * @param {String} sCountry
		 * @param {String} sOrgId
		 * @param {String} sOrgTxt
		 * @returns {String} formatted string.
		 */
		formatPersText: function (sCountry, sOrgId, sOrgTxt) {
			var bEmpIDCheckbox = this.getModel("p13nModel").oData.calPersKey.empId,
				bCountryCheckbox = this.getModel("p13nModel").oData.calPersKey.country,
				bOrgTxtCheckbox = this.getModel("p13nModel").oData.calPersKey.orgTxt,
				bOrgIDCheckbox = this.getModel("p13nModel").oData.calPersKey.orgId;

			if (bCountryCheckbox && bOrgTxtCheckbox && bOrgIDCheckbox) {
				return sCountry + ", " + sOrgId + " - " + sOrgTxt;
			} else if (bCountryCheckbox && !bOrgTxtCheckbox && !bOrgIDCheckbox) {
				return sCountry;
			} else if (bCountryCheckbox && bOrgTxtCheckbox && !bOrgIDCheckbox) {
				return sCountry + ", " + sOrgTxt;
			} else if (bCountryCheckbox && !bOrgTxtCheckbox && bOrgIDCheckbox) {
				return sCountry + ", " + sOrgId;
			} else if (!bCountryCheckbox && bOrgTxtCheckbox && bOrgIDCheckbox) {
				return sOrgId + " - " + sOrgTxt;
			} else if (!bCountryCheckbox && !bOrgTxtCheckbox && bOrgIDCheckbox) {
				return sOrgId;
			} else if (!bCountryCheckbox && bOrgTxtCheckbox && !bOrgIDCheckbox) {
				return sOrgTxt;
			}
		}
	});

	sap.coe.capacity.reuselib.utils.formatter = new FormatterReuseClass();
	return sap.coe.capacity.reuselib.utils.formatter;

});
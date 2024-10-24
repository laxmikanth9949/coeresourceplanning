sap.ui.define([
    "sap/ui/base/Object",
    "sap/coe/capacity/reuselib/utils/i18n"
], function(Object, i18n) {

    return Object.extend("sap.coe.capacity.reuselib.utils.baseclasses.Formatter", {

        /**
         * Convert number given as string to an integer.
         * Useful to trim left zeros of numbers or for numbers mixed with strings
         *
         * @param {String} sNumber to be converted to string
         * @return {Integer} The number
         * @public
         */
        toInteger: function(sNumber) {
            var iInt = parseInt(sNumber, 10);
            return isNaN(iInt) ? sNumber : iInt;
        },

        /**
         * Convert number given as string to a float.
         * Useful to trim left zeros of numbers or for numbers mixed with strings
         *
         * @param {String} sNumber to be converted to string
         * @return {Float} The number
         * @public
         */
        toFloat: function(sNumber) {
            var fNum = parseFloat(sNumber, 10);
            return isNaN(fNum) ? sNumber : fNum;
        },

        //this function will be removed and the isSelectedNew function will be called (John will be refactoring this)
        isSelected: function(sIdValue) {
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

        //used for property binding in OrgUnitSelctComponent "0 " = no sub orgs
        formatMangeLevel: function(sValue) {
            return sValue === "0 " ? "Inactive" : "Navigation";
        },


        /**
         * Returns the date object minus the browser timezone offset
         * @public
         * @param {object} Date Object.
         * @return {object} Date Object.
         */
        removeTimeOffset: function(oDate) {
            var iOffsetInverse = (-1 * (oDate.getTimezoneOffset() * 60000));
            return new Date(oDate.getTime() + iOffsetInverse);
        },

        /**
         *Set cateogry text from i18n depending on the type of appointments
         *@public
         *@param {string} sAType appointment type
         *@param {string} sTAType type of allocation
         *@param {Object} oContext context from where formatter was called
         *@return {string} sCategory from i18n
         */
        setBindingTextForCategory: function(sAType, sTAType, oContext) {
            var sCategory;
            if (sAType && sAType !== "" && sAType === "TAL" && sTAType !== "") {
                sCategory = sap.coe.capacity.reuselib.utils.formatter.convertSubmissionStatus(sTAType);
            } else if (sAType && sAType !== "" && sAType === "ASG" && sTAType !== "") {
                sCategory = sTAType;
            } else {
                sCategory = " ";
            }
            return sCategory;
        },

        /**
         *Returns the name of the category allocation name type depending on the SHPName
         *@public
         *@param {string} sSHPName
         *@return {string} cateogry name 
         */
        convertSubmissionStatus: function(sCode) {
            if (sCode === undefined || sCode === null) {
                return "";
            }
            return i18n.getText("FRAGMENT_CREATEALLOCATION_CATEGORYLIST_CATEGORYID_" + sCode);
        },
    
        /**
         *Returns a formatted date for an appointment
         *@public
         *@params {object} oTimeAllocation, oAssignmentSet, oSoftbooking
         *@returns {date} oDateFormat
         */
        getDisplayDate: function(oTimeAllocation, oAssignmentSet, oSoftbooking) {
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

        /**
         * Returns a formatted date for without time zone
         *@public
         *@params {object} oTimeAllocation, oAssignmentSet, oSoftbooking
         *@returns {date} oDateFormat
         */
        getDisplayDateDayTime: function(oTimeAllocation, oAssignmentSet, oSoftbooking) {
            var oDate;
            if (oTimeAllocation) {
                oDate = oTimeAllocation;
            } else if (oAssignmentSet) {
                oDate = oAssignmentSet;
            } else {
                oDate = oSoftbooking;
            }
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                style: "short"
            });
            return oDateFormat.format(oDate);
        },


        /**
         *Returns string to indicate whether the qualification is navigable or not
         *@param {string} sCatalogType
         *@return {string} sType
         *@public
         */
        formatItemType: function(sCatalogType) {
            var sType = "";
            if (sCatalogType && sCatalogType !== "") {
                sType = (sCatalogType === "QK") ? "Navigation" : "Inactive";
            } else {
                sType = "Inactive";
            }
            return sType;
        },

         /**
         * Format duration, is passed as a string and then parsed to an integer 
         * @public
         * @param {string} sDays
         * @returns {string} sResult string days is added iDays
         */
        addDaysToDuration: function(sDays) {
            var sText = i18n.getText("VIEW_MYSTAFFING_TABLE_COLUMN_DAYS");
            var iDays = parseFloat(sDays, 10);
            var sResult = "";
            if (iDays === undefined || iDays === null || isNaN(iDays)) {
                sResult = "";
            } else {
                sResult = iDays + " " + sText;
            }
            return sResult;
        },

        /**
         * Format duration with description, is passed as a string and then parsed to an integer
         * @public
         * @param {string} sDays
         * @param {string} sDescription
         * @returns {string} sResult string days is added iDays with description
         */
        addDaysToDurationWithDescription: function(sDescription, sDays) {
            if(sDescription === "SAP Public Holiday"){
                return "";
            }
            var sText = i18n.getText("VIEW_MYSTAFFING_TABLE_COLUMN_DAYS");
            var iDays = parseFloat(sDays, 10);
            var sResult = "";
            if (iDays === undefined || iDays === null || isNaN(iDays) || iDays === 0) {
                sResult = "";
            } else {
                sResult = sDescription + " " + iDays + " " + sText;
            }
            return sResult;
        },

        /**
         *Set cateogry text from i18n depending on the type of appointments
         *@public
         *@param {string} sAType appointment type
         *@param {string} sTAType type of allocation
         *@param {string} sCustomer customer name
         *@return {string} sCategory from i18n
         */
        setBindingTextForCategoryWithCustomer: function(sAType, sTAType, sCustomer) {
            var sCategory;
            if (sAType && sAType !== "" && sAType === "TAL" && sTAType !== "") {
                sCategory = sap.coe.capacity.reuselib.utils.formatter.convertSubmissionStatus(sTAType);
            } else if (sAType && sAType !== "" && sAType === "ASG" && sTAType !== "") {
                sCategory = sTAType;
            } else {
                sCategory = " ";
            }
            return sCategory + sCustomer;
        },

        /**
         *Concatenates values to be displayed in the calendar tooltip
         *@public
         *@param {Object} oModel the allocation model
         *@return {string} sTooltip tooltip to be displayed
         */
        concatValuesForCalendarTooltip: function(oModel) {
            var sTooltip = sap.coe.capacity.reuselib.utils.formatter.setBindingTextForCategory(oModel.Type, oModel.SHPName, this) + " " + oModel.CustomerName  + "\n";
            sTooltip += sap.coe.capacity.reuselib.utils.formatter.concatValues(oModel.ItemDescription, oModel.Duration, oModel.QualificationTxt);

            if(oModel.DemandId !== ""){
                sTooltip +=  "\n" + parseInt(oModel.DemandId, 10).toString();
            }
            return sTooltip;
        }
    });
});

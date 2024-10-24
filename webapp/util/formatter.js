sap.ui.define([
    "sap/coe/capacity/reuselib/utils/baseclasses/Formatter"
], function(FormatterBaseClass) {


    var FormatterRPA = FormatterBaseClass.extend("sap.coe.rpa.util.Formatter", {

         /**
         *Return a string qualification if the appointment type is equal to ASG and ColorCode is 6 
         *other wise return the description text
         *@public
         *@param {string} allocation type
         *@param {integer} color code 
         *@param {string} qualification text 
         *@param {string} item description
         *@return {string} qualification text / item description
         */
        getDescription: function(sAType, iColorCode, sQualTxt, sIDesc) {
            if (sAType === "ASG" && iColorCode === 6) {
                return sQualTxt;
            } else {
                return sIDesc;
            }

        },

                /**
         * Counts the number of allocations in the Personal Calendar table
         *
         * @public
         * @param {Array} aAllocations.
         * @returns {Boolean}.
         */
        countTableEntries: function(aAllocations) {
            if ((aAllocations !== undefined) && (aAllocations[0] !== undefined)) {
                var aAllocationsData = aAllocations[0].RPTASTDataSet.results,
                    iAllocationsCount = (aAllocationsData.length === undefined) ? 0 : aAllocationsData.length,
                    iCountEditable = 0;
                // check if any of the allocations can be edited
                for (var i = 0; i < iAllocationsCount; i++) {
                    if (aAllocations[0].RPTASTDataSet.results[i].Type === "TAL") {
                        iCountEditable ++;
                    }
                }
                return (iCountEditable > 0) ? true : false;
            }
        },

        /**
         *Formats the date 
         *@public
         *@param {Date} date object to be formatted
         *@return {Object} the formatted date
         */
        formatDate: function (dDate){
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({style: 'short'});
            return oDateFormat.format(dDate);
        }

    });
    sap.coe.rpa.util.formatter = new FormatterRPA();

    return sap.coe.rpa.util.formatter;

});

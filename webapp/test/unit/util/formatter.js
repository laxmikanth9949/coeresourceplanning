sap.ui.define([
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/rpa/util/formatter",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function(oFormatter) {
    "use strict";
    var sandbox = sinon.sandbox.create();

    QUnit.module("Utils - Formatter", {
        afterEach: function() {
            sandbox.restore();
        }
    });

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oFormatter, "Was possible to import the instance");
    });

    QUnit.test("getDescription: Should return a string with qualification text or the item description", function(assert) {
        var sAType = "ASG",
            iColorCode = 6,
            sQualText = "OSD: SAP Fiori",
            sIDesc = "ONSITE TEAM MEMBER";
        var sDesc = oFormatter.getDescription(sAType, iColorCode, sQualText, sIDesc),
            sExpectedResult = "OSD: SAP Fiori";

        assert.strictEqual(sDesc, sExpectedResult, "The function returned the string 'OSD: SAP Fiori'");
    });

    QUnit.test("getDescription: Should return a string with qualification text or the item description", function(assert) {
        var sAType = "ASG",
            iColorCode = 3,
            sQualText = "OSD: SAP Fiori",
            sIDesc = "DEA MISC 1 WEEKEND IRE";
        var sDesc = oFormatter.getDescription(sAType, iColorCode, sQualText, sIDesc),
            sExpectedResult = "DEA MISC 1 WEEKEND IRE";

        assert.strictEqual(sDesc, sExpectedResult, "The function returned the string 'DEA MISC 1 WEEKEND IRE'");
    });

    QUnit.module("Utils - Formatter", {
        afterEach: function() {
            sandbox.restore();
        }
    });

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oFormatter, "Was possible to import the instance");
    });

    QUnit.test("toInteger: Should return an integer if the value is a number parsed from a string", function(assert) {
        var sValue = oFormatter.toInteger("2");
        var iExpectedResult = 2;
        assert.strictEqual(sValue, iExpectedResult, "The function returned the integer value");

    });

    QUnit.test("convertSubmissionStatus: Should return a string value from i18n for allocation category", function(assert){
    	var sSubmissionStatus = oFormatter.convertSubmissionStatus("ZAB"),
    		sExpectedCaregory = "No travel/Remote Only";

    	assert.strictEqual(sSubmissionStatus, sExpectedCaregory, "The function returned the string value 'Only No travel/Remote Service DeliverOnly'");
    });

    QUnit.test("addDaysToDuration: Should return a string value consiting of number of days + string days", function(assert){
    	var sDays = oFormatter.addDaysToDuration("14"),
    		sExpectedResult = "14 Days";

    	assert.strictEqual(sDays, sExpectedResult, "The function returned the string value '14 Days'");
    });

    QUnit.test("getDateForLastSecondOfDay: Should return a date with hours, minutes and seconds", function(assert){
    	var oLastSecondDayDate = new Date(2016,9,21),
    		oDate = oFormatter.getDateForLastSecondOfDay(oLastSecondDayDate),
    		oExpectedDate = new Date(2016,9,21,23,59,59);

    	assert.strictEqual(oDate.toString(), oExpectedDate.toString(), "The function returned expected date 'Fri Oct 21 2016 23:59:59'");
    });

    QUnit.test("formatItemType: Should return an string to check whether the dialog is navigable or not", function(assert){
    	var sType = oFormatter.formatItemType("QK"),
    		sExpectedResult = "Navigation";

    	assert.strictEqual(sType, sExpectedResult, "The function returned the string value 'Navigation'");
    });

    QUnit.test("formatItemType: Should return an string to check whether the dialog is navigable or not", function(assert){
    	var sType = oFormatter.formatItemType("Q"),
    		sExpectedResult = "Inactive";

    	assert.strictEqual(sType, sExpectedResult, "The function returned the string value 'Inactive'");
    });

    QUnit.test("setAppointmentType: Should return a string to set a value for appointment type", function(assert){
    	var sColorCode = oFormatter.setAppointmentType("5"),
    		sExpectedResult = "Type05";

    	assert.strictEqual(sColorCode, sExpectedResult, "The function returned the string value 'Type05'");
    });

    QUnit.test("getDisplayDate: Should return a string formatted to'dd/MM/YYYY h:mm a Z'", function(assert){
		var oDate = new Date(2016,7,20);
			oDate.setHours(11);
			oDate.setMinutes(25);

		var oAppointmentType = oFormatter.getDisplayDate(oDate),
			sExpectedFormat = "20/08/2016 11:25 AM +0100";

		assert.strictEqual(oAppointmentType, sExpectedFormat, "The function returned the string value '20/07/2016 11:25 AM'");
    		
    });

    QUnit.test("removeTimeOffset: Should return a date object minus the browser timezone offset", function(assert){
    	var oDate = new Date(2016,7,20);
    	var	oRemoveOffset = oFormatter.removeTimeOffset(oDate),
    		sExpectedResult = "Sat Aug 20 2016 01:00:00 GMT+0100 (GMT Daylight Time)";

		assert.strictEqual(oRemoveOffset.toString(), sExpectedResult, "The function returned a date value Sat Aug 20 2016 01:00:00 GMT+0100 (GMT Daylight Time)");
    });


});

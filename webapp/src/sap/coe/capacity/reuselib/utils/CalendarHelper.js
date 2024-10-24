sap.ui.define([], function() {
    "use strict";

    var CalendarHelpers = {};


    CalendarHelpers.setCWsForFirstEmployee = function(oEvent, that) {
        var dStartIntervalDate = oEvent.getParameter("intervalDates")[0],
            dEndIntervalDate = oEvent.getParameter("intervalDates")[1],
            iIntervalDuration = new Date(dEndIntervalDate - dStartIntervalDate).getDate() / 7 + new Date(dEndIntervalDate - dStartIntervalDate).getMonth() * 4,
            iStartCW = this.getCWFromDate(dStartIntervalDate),
            iCurrentCW,
            oCWLableModel,
            oCWLableDateStart,
            oCWLableDateEnd,
            iDurationInDays,
            aCWs = [];



        for (var i = 0; i < iIntervalDuration; i++) {
            iCurrentCW = iStartCW++;
            iDurationInDays = i * 7;


            oCWLableDateStart = new Date(dStartIntervalDate.getFullYear(), dStartIntervalDate.getMonth(), (dStartIntervalDate.getDate() + iDurationInDays), 0, 0, 0);
            oCWLableDateEnd = new Date(dStartIntervalDate.getFullYear(), dStartIntervalDate.getMonth(), (dStartIntervalDate.getDate() + iDurationInDays + 7), 0, 0, 0);

            oCWLableModel = {
                title: "CW " + iCurrentCW,
                begin: oCWLableDateStart,
                end: oCWLableDateEnd
            };
            aCWs.push(oCWLableModel);
        }

        that.oCWModel.setData(aCWs);

    };

    /**
     * Get start and end dates for month view
     * 
     * @param {object} 
     * @param {int}  iInterval - Number of days between start and end date.   
     * @return {array} [oStartDate, oEndDate] Start and End date objects
     * @public
     */
    CalendarHelpers.getCalInterval = function(oDate, iInterval) {
        var iDate = 0;
        // If the date's day of week is Mon to Fri set to first day of week,
        // if it is Sat or Sun set to first day of next week
        if (oDate.getDay() < 6) {
            iDate = (oDate.getDate() - (oDate.getDay() - 1));
        } else {
            iDate = (oDate.getDate() + 2);
        }

        var oStartDate = new Date(oDate.getFullYear(), oDate.getMonth(), iDate);
        var oEndDate = new Date(oStartDate.getFullYear(), oStartDate.getMonth(), (oStartDate.getDate() + iInterval), 0, 0, -1);

        return [oStartDate, oEndDate];
    };

    /**
     * Return the calendar week of a date. The ISO 8601 definition for week 01 is the week with the year's first Thursday in it.
     * https://en.wikipedia.org/wiki/ISO_week_date
     *
     * @public
     *
     * @param {Date} oDate The date.
     *
     * @returns {int} iCW The calendar week
     */
    CalendarHelpers.getCWFromDate = function(dDate) {
        var dTime,
            dCheckDate = new Date(dDate.getTime());

        // Find Thursday of this week starting on Monday
        dCheckDate.setDate(dCheckDate.getDate() + 4 - (dCheckDate.getDay() || 7));

        dTime = dCheckDate.getTime();
        dCheckDate.setMonth(0); // Compare with Jan 1
        dCheckDate.setDate(1);
        return (Math.floor(Math.round((dTime - dCheckDate) / 86400000) / 7) + 1);
    };

    /**
     * Gets a calendar week date range from supplied date obj
     *
     * @public
     * @param {object} oDate the date of the CW
     * @returns {array} [start of CW, end of CW]
     */
    CalendarHelpers.getCurrentWeekFromDate = function(oDate) {
        var start = start || 1,
        	today = new Date(oDate.setHours(0, 0, 0, 0)),
        	day = today.getDay() - start,
        	date = today.getDate() - day;

        // Grabbing Start/End Dates
        var StartDate = new Date(today.setDate(date)),
        	EndDate = new Date(StartDate.getFullYear(), StartDate.getMonth(), StartDate.getDate() + 7 - StartDate.getDay());
        //EndDate = new Date(EndDate.setHours(23, 59, 59)); This is done in for every DateRange in VariantFilterHelper.getFiltersSimple
        return [StartDate, EndDate];
    };

    /**
     * Return the date range of a calendar week taking into account the current date
     *
     * @public
     *
     * @param {string} sCW The calendar week
     * @param {Integer} iYear The calendar year
     *
     * @returns {object}    obj.startDate Date object with the first day of the calendar week
     *                      obj.endDate Date object with the last day of the calendar week
     */
    CalendarHelpers.getDateRangeFromCalendarWeek = function(sCW, iYear) {
        var iCW = parseInt(sCW, 10),
            iFirstWeekDayNumberOfYear,
            oFirstDayOfYear,
            iMilisecondsToTheMondayOfCW,
            iCWToCount = iCW;

        iFirstWeekDayNumberOfYear = new Date(iYear, 0, 1).getDay() ? new Date(iYear, 0, 1).getDay() : 7;
        oFirstDayOfYear = new Date("Jan 01, " + iYear + " 00:00:00");
        if(iFirstWeekDayNumberOfYear < 5) {
            // we don't need to calculate a week since the first day is in the first week already
            iCWToCount -= 1;
        }
        iMilisecondsToTheMondayOfCW = oFirstDayOfYear.getTime() - (3600000 * 24 * (iFirstWeekDayNumberOfYear - 1)) + 604800000 * iCWToCount;

        return {
            startDate: new Date(iMilisecondsToTheMondayOfCW),
            endDate: new Date(iMilisecondsToTheMondayOfCW + 518400000)
        };
    };

    /**
     * Return the current calendar week. The ISO 8601 definition for week 01 is the week with the year's first Thursday in it.
     * https://en.wikipedia.org/wiki/ISO_week_date
     *
     * @public
     *
     * @returns {String} sCurrentCW The current calendar week
     */
    CalendarHelpers.getCurrentCalendarWeek = function() {
        return this.getCWFromDate(new Date());
    };


    return CalendarHelpers;
});

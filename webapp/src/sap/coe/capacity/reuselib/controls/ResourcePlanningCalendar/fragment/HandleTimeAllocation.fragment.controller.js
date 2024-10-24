sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/capacity/reuselib/utils/dataManagerNew",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/coe/capacity/reuselib/utils/CalendarHelper",
    "sap/m/MessageBox"
], function(Controller, formatter, DataManager, oHelpers, i18n, helpers, CalendarHelper, MessageBox) {

    "use strict";

    return Controller.extend("sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.HandleTimeAllocation.fragment", {

        _aIdsInputFieldsRecurrence: ["idRecurrenceBegTime", "idRecurrenceEndTime", "idRecurrencyType", "idRecurrencyNumber", "idRecurrenceBegDate", "idRecurrenceEndDate"],
        _aIdsInputFieldsSingleAssignment: ["idEndTime", "idEndDate", "idBegTime", "idBegDate"],
        _aIdsLabelsSingleAssigment: ["idBegDateLabel", "idEndDateLabel"],
        _aIdsLabelsRecurrence: ["idRecurrencyNumberLabel", "idRecurrencyType", "idBegDateRecurrence", "idEndDateRecurrenceLabel"],
        _sFragmentId: "",

        /**
         * Checks whether the dialog is opened in create or edit mode
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onBeforeOpen: function(oEvent) {
            this._oDialog = oEvent.getSource();
            this._oAllocationData = this._oDialog.getModel("CreateAllocation").getProperty("/");

            this._oDialog.setModel(
                new sap.ui.model.resource.ResourceModel({
                    bundleUrl: jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/i18n.properties"
                }),
                "i18n");

            this._sFragmentId = this._oAllocationData.sFragmentId;
            this._singleWeekPanel = sap.ui.core.Fragment.byId(this._sFragmentId, "idSingleWeekForm");
            this._recurrencePanel = sap.ui.core.Fragment.byId(this._sFragmentId, "idRecurrenceForm");
            this._restorePanelAndFields();

            if (this._oAllocationData.EditMode) {
                this._prefillDataInEditMode(this._oAllocationData);
                this._oDialog.setTitle(i18n.getText("FRAGMENT_EDITALLOCATION_TITLE"));
                this._singleWeekPanel.setHeaderText(i18n.getText("FRAGMENT_CREATEALLOCATION_TABLE_COLUMN_SINGLEWEEK_EDIT_TITLE"));
                this._recurrencePanel.setHeaderText(i18n.getText("FRAGMENT_CREATEALLOCATION_TABLE_COLUMN_RECURRENCE_EDIT_TITLE"));
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForIndividualSave").setVisible(false);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForSeriesSave").setVisible(false);
            } else {
                this._prefillDataInCreateMode(this._oAllocationData);
                this._oDialog.setTitle(i18n.getText("FRAGMENT_CREATEALLOCATION_TITLE"));
                this._singleWeekPanel.setHeaderText(i18n.getText("FRAGMENT_CREATEALLOCATION_TABLE_COLUMN_SINGLEWEEK_TITLE"));
                this._recurrencePanel.setHeaderText(i18n.getText("FRAGMENT_CREATEALLOCATION_TABLE_COLUMN_RECURRENCE_TITLE"));
                this._oDialog.getModel("CreateAllocation").refresh();
            }
            this._setAllInputFieldsStateToNormal();
        },

        /**
         * Checks if the mandatory fields are filled in, and if so, creates the time allocation
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @param {Object} that - the current context
         * @returns {void}
         */
        createTimeAllocation: function(oEvent, that) {
            var oDialog = oEvent.getSource().getParent(),
                bDialogInEditMode = oDialog.getModel("CreateAllocation").getProperty("/EditMode"),
                bAreMandatoryInputFieldsFilled = this._checkInputFields(this._aIdsInputFieldsSingleAssignment),
                bAreMandatoryInputFieldsFilledRecurrency = this._checkInputFields(this._aIdsInputFieldsRecurrence),
                oCreateRequestBody;

            if (this._recurrencePanel.getExpanded()) { //It is recurrence
                if (bAreMandatoryInputFieldsFilledRecurrency) {
                    oCreateRequestBody = this._createRequestBodyRecurrence(oEvent);
                } else {
                    this._setMandatoryInputFieldsError(this._aIdsInputFieldsRecurrence);
                    return;
                }
            } else { //It is not recurrence
                if (bAreMandatoryInputFieldsFilled) {
                    oCreateRequestBody = this._createRequestBody(oEvent);
                } else {
                    this._setMandatoryInputFieldsError(this._aIdsInputFieldsSingleAssignment);
                    if (!this._singleWeekPanel.getExpanded()) {
                        this._singleWeekPanel.setExpanded(true);
                    }
                    return;
                }
            }

            if (bDialogInEditMode) {
                oCreateRequestBody.Changeable = true;

                var oSelectedItem = oDialog.getModel("CreateAllocation").getProperty("/oSelectedItem"),
                    id = oSelectedItem.ID,
                    ResGuid = oSelectedItem.ResGuid;

                oCreateRequestBody.ResourceGuid = oSelectedItem.ResGuid;
                oCreateRequestBody.ID = id;

                var oParams = {
                    sId: id,
                    sResourceGuid: ResGuid,
                    oUpdateRequestBody: oCreateRequestBody,
                    oDialog: oDialog,
                    sSuccessMessage: i18n.getText("FRAGMENT_CREATEALLOCATION_MESSAGETOAS_SUCCESS"),
                    sErrorMessage: i18n.getText("FRAGMENT_CREATEALLOCATION_MESSAGETOAS_ERROR")
                };

                DataManager.updateTimeAllocation(oDialog.getModel(), oParams, this.onUpdateTimeAllocationSuccess, this.onUpdateTimeAllocationError);
            } else {
                oDialog.getParent().createTimeAllocation(oDialog.getModel(), oCreateRequestBody);
                oDialog.close();
            }

            this.onCloseDialog(oEvent);
        },

        /**
         * Checks if the mandatory fields are filled in, and if so, creates a time allocation in individual blocks
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @param {Object} that - the current context
         * @returns {void}
         */
        createIndividualRecurringAllocations: function(oEvent, that) {
            var oDialog = oEvent.getSource().getParent(),
                bAreMandatoryInputFieldsFilledRecurrency = this._checkInputFields(this._aIdsInputFieldsRecurrence),
                aRequests = [{}],
                oHelperBody = oEvent.getSource().getModel("CreateAllocation").getData();

            if (bAreMandatoryInputFieldsFilledRecurrency) {
                var oDatesToSave = this._retrieveIndividualRecurringDatesToSave(oEvent);
            } else {
                this._setMandatoryInputFieldsError(this._aIdsInputFieldsRecurrence);
                return;
            }

            for (var i = 0; i < oDatesToSave.length; i++) {
                var Begtimestamp = oHelperBody.RECURRENCE_TYPE === "DAILY" ? this._combineDateTime(oDatesToSave[i], oHelperBody.RecurrenceBegTime) : this._combineDateTime(oDatesToSave[i][0], oHelperBody.RecurrenceBegTime),
                    Endtimestamp = oHelperBody.RECURRENCE_TYPE === "DAILY" ? this._combineDateTime(oDatesToSave[i], oHelperBody.RecurrenceEndTime) : this._combineDateTime(oDatesToSave[i][oDatesToSave[i].length - 1], oHelperBody.RecurrenceEndTime);

                aRequests.push({
                    TimespecType: sap.ui.core.Fragment.byId(this._sFragmentId, "idtimeAllocationCategoryList").getSelectedKey(),
                    EmpID: oHelperBody.EmpID,
                    Description: sap.ui.core.Fragment.byId(this._sFragmentId, "idDescriptionRec").getValue(),
                    BegDate: oHelperBody.RECURRENCE_TYPE === "DAILY" ? oDatesToSave[i] : oDatesToSave[i][0],
                    EndDate: oHelperBody.RECURRENCE_TYPE === "DAILY" ? oDatesToSave[i] : oDatesToSave[i][oDatesToSave[i].length - 1],
                    Begtimestamp: formatter.removeTimeOffset(Begtimestamp),
                    Endtimestamp: formatter.removeTimeOffset(Endtimestamp)
                });
            }

            // delay the backend requests to avoid locking
            (function saveTimeAllocation (j) {
              setTimeout(function () {
                oDialog.getParent().createTimeAllocation(oDialog.getModel(), aRequests[j]);
                if (--j) {
                  saveTimeAllocation(j);
                }
              }, 1000);
            })(aRequests.length);

            this.onCloseDialog(oEvent);
        },

        /**
         * Retrieves the dates that need to be saved as part of the recurring time allocation
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {Array} aFinalRequestArray - an array of dates used for individual recurring time allocations
         */
        _retrieveIndividualRecurringDatesToSave: function(oEvent){
            var oHelperBody = oEvent.getSource().getModel("CreateAllocation").getData(),
                aFinalRequestArray;

            switch (oHelperBody.RECURRENCE_TYPE) {
                case "DAILY":
                    var oStartDateRec = formatter.removeTimeOffset(oHelperBody.RecurrenceFrom),
                    	oEndDateRec = formatter.removeTimeOffset(oHelperBody.RecurrenceTo),
                    	oDatesToSave = [];

                    // get dates that daily recurrence will happen
                    for (var i = oStartDateRec.getTime(); i <= oEndDateRec.getTime(); i += ((1000 * 60 * 60 * 24)) * oHelperBody.RecurrencyNumber) {
                        oDatesToSave.push(new Date(i));
                    }

                    aFinalRequestArray = oDatesToSave;

                    break;

                case "WEEKLY":
                    // get the range of calendar weeks we're using
                    var iCWBegDate = CalendarHelper.getCWFromDate(oHelperBody.RecurrenceFrom),
                        iCWEndDate = CalendarHelper.getCWFromDate(oHelperBody.RecurrenceTo);

                    var iCWBegDateYear = oHelperBody.RecurrenceFrom.getFullYear(),
                        iCWEndDateYear = oHelperBody.RecurrenceTo.getFullYear(),
                        bCWSameYear = iCWBegDateYear === iCWEndDateYear ? true : false,
                        iLastCWOfBegYear = CalendarHelper.getCWFromDate(new Date(iCWBegDateYear, 11, 31)),
                        bTAStartsCW1 = false;

                    if (iLastCWOfBegYear === 1) {
                        if (iCWBegDate === 1) {
                          // even if the date is in current year, it's the first CW of the next year
                          bTAStartsCW1 = true;
                          bCWSameYear = true;
                        }
                        else {
                          iLastCWOfBegYear = CalendarHelper.getCWFromDate(new Date(iCWBegDateYear, 11, 24));
                        }
                    }

                    // get the week numbers we need to use
                    var aWeekSpan = [];
                    if (bCWSameYear || bTAStartsCW1) {
                        for (var i = iCWBegDate; i <= iCWEndDate; i += parseInt(oHelperBody.RecurrencyNumber)) {
                          aWeekSpan.push(i);
                        }
                    }
                    else {
                        for (var i = iCWBegDate; i <= iLastCWOfBegYear; i += parseInt(oHelperBody.RecurrencyNumber)) {
                          aWeekSpan.push(i);
                        }
                        var iCWEndYearDiffRecNum = iLastCWOfBegYear - aWeekSpan[aWeekSpan.length - 1];
                        if (iCWEndYearDiffRecNum > 0) {
                          var iCWRecNumCon = oHelperBody.RecurrencyNumber - iCWEndYearDiffRecNum;
                        }
                        else {
                          var iCWRecNumCon = parseInt(oHelperBody.RecurrencyNumber);
                        }
                        for (var i = iCWRecNumCon; i <= iCWEndDate; i += parseInt(oHelperBody.RecurrencyNumber)) {
                          aWeekSpan.push(i);
                        }
                    }

                    var aCWDateRanges = [],
                        bBegYearUsed = false;

                    aWeekSpan.forEach(function(iCW){
                      if (bCWSameYear || (iCW > iCWBegDate)) {
                        // use the ending year if the TA starts in CW 1
                        if (!bTAStartsCW1) {
                          aCWDateRanges.push(CalendarHelper.getDateRangeFromCalendarWeek(iCW, iCWBegDateYear));
                        }
                        else {
                          aCWDateRanges.push(CalendarHelper.getDateRangeFromCalendarWeek(iCW, iCWEndDateYear));
                        }
                      }
                      // the recurrence starts and ends on the same CW, need to differentiate them
                      else if (iCW === iCWBegDate) {
                        if (!bBegYearUsed) {
                          aCWDateRanges.push(CalendarHelper.getDateRangeFromCalendarWeek(iCW, iCWBegDateYear));
                          bBegYearUsed = true;
                        }
                        else {
                          aCWDateRanges.push(CalendarHelper.getDateRangeFromCalendarWeek(iCW, iCWEndDateYear));
                        }
                      }
                      else {
                          aCWDateRanges.push(CalendarHelper.getDateRangeFromCalendarWeek(iCW, iCWEndDateYear));
                      }
                      if (iCW === iCWBegDate) {
                        aCWDateRanges[0].startDate = oHelperBody.RecurrenceFrom;
                      }
                    });

                    // set the end date to be the end date selected, used when recurring TA ends on a day other than Friday
                    if (aWeekSpan.indexOf(iCWEndDate) >= 0) {
                        aCWDateRanges[aCWDateRanges.length - 1].endDate = oHelperBody.RecurrenceTo;
                    }

                    // create a new array with dates for each day in the weeks selected
                    var aDatesInCWSpan = [];
                    for (var k = 0; k < aCWDateRanges.length; k++) {
                        for (var l = aCWDateRanges[k].startDate.getTime(); l <= aCWDateRanges[k].endDate.getTime(); l += (1000 * 60 * 60 * 24)) {
                            aDatesInCWSpan.push(new Date(l));
                        }
                        // temp bugfix, DST creates issue with last date in aDatesInCWSpan
                        if (aDatesInCWSpan.indexOf(aCWDateRanges[k].endDate) < 0) {
                            aDatesInCWSpan.push(new Date(aCWDateRanges[k].endDate));
                        }
                    }

                    // create an array holding the day values we need to get
                    // Sunday = 0, Saturday = 6
                    var aDaysSelected = [];
                    if (oHelperBody.MONDAY === true) aDaysSelected.push(1);
                    if (oHelperBody.TUESDAY === true) aDaysSelected.push(2);
                    if (oHelperBody.WEDNESDAY === true) aDaysSelected.push(3);
                    if (oHelperBody.THURSDAY === true) aDaysSelected.push(4);
                    if (oHelperBody.FRIDAY === true) aDaysSelected.push(5);
                    if (oHelperBody.SATURDAY === true) aDaysSelected.push(6);
                    if (oHelperBody.SUNDAY === true) aDaysSelected.push(0);

                    var aDatesToSave = [];
                    for (var m = 0; m < aDatesInCWSpan.length; m++) {
                        if (aDaysSelected.indexOf(aDatesInCWSpan[m].getDay()) >= 0) {
                            aDatesToSave.push(aDatesInCWSpan[m]);
                        }
                    }

                    var aSequencesResults = this.checkSequentialDates(aDatesToSave);

                    aFinalRequestArray = aSequencesResults;

                    break;
            }

            return aFinalRequestArray;
        },

        /**
         * Creates an array of sequantial date blocks from a range of dates
         *
         * @public
         * @param {Array} aDatesToCheck - dates we need to check is they're sequantial
         * @returns {Array} aDatesSequences - the dates sorted into sequences
         */
        checkSequentialDates: function (aDatesToCheck) {
            var dLast,
            	aDateSequences = [[]];

              for (var i = 0, l = aDatesToCheck.length; i < l; i++) {
                  var dCurrent = aDatesToCheck[i];
                  dLast = dLast || dCurrent;

                  if (isNewSequence(dCurrent, dLast)) {
                      aDateSequences.push([]);
                  }

                  aDateSequences[aDateSequences.length - 1].push(dCurrent);
                  dLast = dCurrent;
              }

              return aDateSequences;

              function isNewSequence(dFirstDate, dSecondDate) {
                  if (dFirstDate.getTime() - dSecondDate.getTime() > (24 * 60 * 60 * 1000))
                      return true;
                  return false;
              }
          },
        openLeaveRequestApp: function(){
            var sPrefix = "https:";
            window.open(sPrefix + "//fiorilaunchpad.sap.com/sites#leaverequest-create");
        },

        //concats i18n strings to be displayed as message
        buildStringForCreateAbsenceMsg: function(){
            var sText = " ";
            sText += i18n.getText("CREATE_ABSENCE_INFO_MSG_1");
            sText += i18n.getText("CREATE_ABSENCE_INFO_MSG_2");
            sText += i18n.getText("CREATE_ABSENCE_INFO_MSG_3");

            return sText;
        },

        onCreateAbsence : function() {

        var sText = this.buildStringForCreateAbsenceMsg();

            this.oDialog = new sap.m.Dialog({
                title: i18n.getText("CREATE_ABSENCE_DIALOG_TITLE"),
                type: "Message",
                state: sap.ui.core.ValueState.Information,
                content: new sap.m.Text({
                    text: sText
                }),
                buttons: [
                    new sap.m.Button({
                        text: i18n.getText("ABSENCE_OPEN_LEAVE_REQUEST_APP_BUTTON"),
                        press: function () {
                            this.openLeaveRequestApp();
                            this.oDialog.close();
                        }.bind(this)
                    }),
                    new sap.m.Button({
                        text: i18n.getText("FRAGMENT_CREATEALLOCATION_BUTTON_CANCEL"),
                        press: function () {
                            this.oDialog.close();
                        }.bind(this)
                    })
                ]
            });

            this.oDialog.open();
            },

       /**
         * Closes the dialog
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onCloseDialog: function(oEvent) {
            oEvent.getSource().getParent().close();
        },

        /**
         * Enable/Disable the days selection depending on type of recurrence selected
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onSelectionChangeRecurrenceType: function(oEvent) {
            var sSelectedValue = oEvent.getParameter("selectedItem").getProperty("key");
            if (sSelectedValue === "DAILY") {
                this._setEnableValueOfDaysOfWeek(false);
            } else {
                this._setEnableValueOfDaysOfWeek(true);
            }
        },

        onTimeAllocationJamLinkPress : function(oEvent) {
            var sPrefix = "https:";

            window.open(sPrefix + "//jam4.sapjam.com/profile/25ioSUc11JWVInce3Wpuuk/documents/3iOvvwBlAzd6OnmjzXQ8Hb");
        },

        /**
         * Opens info popover for types of time allocations
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onTimeAllocationInfoOpen: function(oEvent) {
            var sFragmentId = this._sFragmentId + "--" + "TimeAllocationInfoPopover";

            if (!this._oTimeAllocationPopover) {
                this._oTimeAllocationPopover = helpers.initializeFragmentFromObject({
                    oParentController: this,
                    sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.TimeAllocationInfoPopover",
                    oModel: this.getView().getModel("resourceModel"),
                    sCreateId: sFragmentId
                });
            }

            this._oTimeAllocationPopover.openBy(oEvent.getSource());
        },

        /**
         * Checks user input when setting a date, enables the end date selection
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onBegDateChange: function(oEvent) {
            var oEndDatePicker = sap.ui.core.Fragment.byId(this._sFragmentId, "idEndDate"),
                dEndDate = oEndDatePicker.getDateValue(),
                oBegDatePicker = oEvent.getSource(),
                dStartDate = new Date(oBegDatePicker.getDateValue());
            if (dEndDate === null || dEndDate.getTime() < dStartDate.getTime()) {
                oEndDatePicker.setMinDate();
                oEndDatePicker.setMaxDate();
                oEndDatePicker.setDateValue(dStartDate);
                oEndDatePicker.setEnabled(true);
            }

            // check if the date selected falls on the weekend
            if (dStartDate.getDay() === 6 || dStartDate.getDay() === 0) {
                this.displayWeekendWarning(dStartDate, oBegDatePicker, oEndDatePicker);
            }

            // end date should only be enabled if a start date has been selected, end date selection can only be within same week
            if (dStartDate === "Thu Jan 01 1970 00:00:00 GMT+0000 (GMT Standard Time)") {
                oBegDatePicker.setValue("");
                oEndDatePicker.setEnabled(false);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idEndTime").setEnabled(false);
                oEndDatePicker.setMinDate();
                oEndDatePicker.setMaxDate();
            }
            else {
                oEndDatePicker.setEnabled(true);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idEndTime").setEnabled(true);
                // limit selection of end date to the same calendar week
                var aCWDates = CalendarHelper.getCurrentWeekFromDate(dStartDate),
                    dEndDate = new Date(oEndDatePicker.getDateValue()),
                    dMinDate = dStartDate,
                    dMaxDate = aCWDates[1];

                oEndDatePicker.setMinDate(dMinDate);
                oEndDatePicker.setMaxDate(dMaxDate);

                // if the end date selected no longer falls between the min/max date then set it to match the BegDate
                if (dEndDate > dMaxDate || dEndDate < dMinDate) {
                    oEndDatePicker.setDateValue(dStartDate);
                }
            }

            // remove warning if a valid date is selected
            if (dStartDate !== null && oBegDatePicker.getValueState() === sap.ui.core.ValueState.Error) {
                oBegDatePicker.setValueState(sap.ui.core.ValueState.None);
            }
        },

        /**
         * Checks user input when setting a date
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onEndDateChange: function(oEvent) {
            var oStartDatePicker = sap.ui.core.Fragment.byId(this._sFragmentId, "idBegDate"),
                dStartDate = oStartDatePicker.getDateValue(),
                oEndDatePicker = oEvent.getSource(),
                dEndDate = new Date(oEndDatePicker.getDateValue());
            if (dStartDate === null || dStartDate.getTime() > dEndDate.getTime()) {
                oStartDatePicker.setDateValue(dEndDate);
            }

            // check if the date selected falls on the weekend
            if (dEndDate.getDay() === 6 || dEndDate.getDay() === 0) {
                this.displayWeekendWarning(dEndDate, oStartDatePicker, oEndDatePicker);
            }

            // remove warning if a valid date is selected
            if (dEndDate !== null && oEndDatePicker.getValueState() === sap.ui.core.ValueState.Error) {
                oEndDatePicker.setValueState(sap.ui.core.ValueState.None);
            }
        },

        /**
         * Checks user input when setting a recurrence date, enables the end date selection
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onRecBegDateChange: function(oEvent) {
            var oEndDatePicker = sap.ui.core.Fragment.byId(this._sFragmentId, "idRecurrenceEndDate"),
                dEndDate = oEndDatePicker.getDateValue(),
                oBegDatePicker = oEvent.getSource(),
                dStartDate = new Date(oBegDatePicker.getDateValue());
            if (dEndDate === null || dEndDate.getTime() < dStartDate.getTime()) {
                oEndDatePicker.setDateValue(dStartDate);
                oEndDatePicker.setEnabled(true);
            }

            // end date should only be enabled if a start date has been selected, end date selection can only be within same week
            if (dStartDate === "Thu Jan 01 1970 00:00:00 GMT+0000 (GMT Standard Time)") {
                oBegDatePicker.setValue("");
                oEndDatePicker.setEnabled(false);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idRecurrenceEndTime").setEnabled(false);
                oEndDatePicker.setMinDate();
                oEndDatePicker.setMaxDate();
            }
            else {
                oEndDatePicker.setEnabled(true);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idRecurrenceEndTime").setEnabled(true);
                // limit selection of end date to the same calendar week
                var aCWDates = CalendarHelper.getCurrentWeekFromDate(dStartDate),
                    dEndDateValue = oEndDatePicker.getDateValue(),
                    dEndDate = new Date((dEndDateValue.getFullYear() + 1), dEndDateValue.getMonth(), dEndDateValue.getDate()),
                    dMinDate = dStartDate,
                    dMaxDate = dEndDate;

                oEndDatePicker.setMinDate(dMinDate);
                oEndDatePicker.setMaxDate(dMaxDate);
                

                // if the end date selected no longer falls between the min/max date then set it to match the BegDate
                //
                if (dEndDateValue > dMaxDate || dEndDateValue < dMinDate) {
                    oEndDatePicker.setDateValue(dStartDate);
                }
            }

            // remove warning if a valid date is selected
            if (dStartDate !== null && oBegDatePicker.getValueState() === sap.ui.core.ValueState.Error) {
                oBegDatePicker.setValueState(sap.ui.core.ValueState.None);
            }
        },

        /**
         * Checks user input when setting a recurrence date
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onRecEndDateChange: function(oEvent) {
            var oStartDatePicker = sap.ui.core.Fragment.byId(this._sFragmentId, "idRecurrenceBegDate"),
                dStartDate = oStartDatePicker.getDateValue(),
                oEndDatePicker = oEvent.getSource(),
                dEndDate = new Date(oEndDatePicker.getDateValue());
            if (dStartDate === null || dStartDate.getTime() > dEndDate.getTime()) {
                oStartDatePicker.setDateValue(dEndDate);
            }

            // remove warning if a valid date is selected
            if (dEndDate !== null && oEndDatePicker.getValueState() === sap.ui.core.ValueState.Error) {
                oEndDatePicker.setValueState(sap.ui.core.ValueState.None);
            }
        },

        /**
         * Display's a warning message is user selected a day on the weekend
         *
         * @public
         * @param {Date} oDateSelected - date the user has selected
         * @param {Object} oDatePicker - datepicker that trigger the warning
         * @param {Object} oDatePickerEnd - optional, the end date picker if the start datepicker has already been passed
         * @returns {void}
         */
        displayWeekendWarning: function(oDateSelected, oDatePicker, oDatePickerEnd) {
            var that = this;
            return sap.m.MessageBox.confirm(i18n.getText("FRAGMENT_WARNING_SINGLEWEEK_WEEKEND_TEXT"), {
                    title: i18n.getText("FRAGMENT_WARNING_SINGLEWEEK_WEEKEND_TITLE"),
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function(oAction) {
                            if (oAction == "NO") {
                                /*if (oDateSelected.getDay() === 6) {
                                    oDatePicker.setDateValue(new Date(oDateSelected.getTime() - (1000*60*60*24)));
                                    if (oDatePickerEnd) {
                                      oDatePickerEnd.setDateValue(new Date(oDateSelected.getTime() - (1000*60*60*24)));
                                    }
                                }
                                else {
                                    oDatePicker.setDateValue(new Date(oDateSelected.getTime() - ((1000*60*60*24) * 2)));
                                    if (oDatePickerEnd) {
                                      oDatePickerEnd.setDateValue(new Date(oDateSelected.getTime() - (1000*60*60*24)));
                                    }
                                }*/
                                // workaround suggested, reset the datepickers
                                oDatePicker.setValue(undefined);
                                oDatePickerEnd.setValue(undefined);
                                oDatePickerEnd.setEnabled(false);
                                oDatePickerEnd.setMinDate();
                                oDatePickerEnd.setMaxDate();
                            }
                        }.bind(that),
                    styleClass: "",
                    initialFocus: null,
                    textDirection: sap.ui.core.TextDirection.Inherit
                });
        },

        /**
         * Displays success message for time allocation creation
         *
         * @public
         * @param {Object} oData - data returned from backend
         * @param {Object} oResponse - response from backend
         * @returns {void}
         */
        onUpdateTimeAllocationSuccess: function(oData, oResponse) {
            var oDialog = oResponse.oDialog,
                sMessage = oResponse.sSuccessMessage,
                that = oHelpers.getParentController(oDialog),
                oParentController = oHelpers.getParentController(oDialog.getParent());

            that._readResources(oParentController);

            sap.m.MessageToast.show(sMessage);
            oDialog.close();
        },

        /**
         * Displays error message for time allocation creation
         *
         * @public
         * @param {Object} oResponse - response from backend
         * @returns {void}
         */
        onUpdateTimeAllocationError: function(oResponse) {
            sap.m.MessageToast.show(oResponse.sErrorMessage);
        },

        /**
         * Show/hide dialog elements when single week allocation has been selected
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onSingleWeekExpandCollapse: function(oEvent) {
            if (this._singleWeekPanel.getExpanded()) {
                this._recurrencePanel.setExpanded(false);
                this._setMandatoryFieldsStatus(false, this._aIdsLabelsRecurrence);
                this._setMandatoryFieldsStatus(true, this._aIdsLabelsSingleAssigment);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForSaveButton").setVisible(true);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForIndividualSave").setVisible(false);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForSeriesSave").setVisible(false);
                if ((sap.ui.core.Fragment.byId(this._sFragmentId, "idBegDate").getDateValue() === null) && (!this._oAllocationData.EditMode)) {
                    sap.ui.core.Fragment.byId(this._sFragmentId, "idEndDate").setEnabled(false);
                    sap.ui.core.Fragment.byId(this._sFragmentId, "idEndTime").setEnabled(false);
                }
            }
        },

        /**
         * Show/hide dialog elements when recurring allocation has been selected
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        onRecurrenceExpandCollapse: function(oEvent) {
            if (this._recurrencePanel.getExpanded()) {
                this._singleWeekPanel.setExpanded(false);
                this._setMandatoryFieldsStatus(false, this._aIdsLabelsSingleAssigment);
                this._setMandatoryFieldsStatus(true, this._aIdsLabelsRecurrence);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForIndividualSave").setVisible(!this._oAllocationData.EditMode);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForSaveButton").setVisible(this._oAllocationData.EditMode);
                sap.ui.core.Fragment.byId(this._sFragmentId, "idForSeriesSave").setVisible(!this._oAllocationData.EditMode);
            }
        },

        //Provisional solution to coupled code: This should trigger an event which is handled by whoever is interested in allocations update
        _readResources: function(oParentController) {
            if (!oParentController) {
                return false;
            } else if (oParentController.byId && oParentController.byId("filterBar")) {
                oParentController.byId("filterBar").search();
                return true;
            } else if (oParentController.readData) {
                oParentController.readData();
                return true;
            }

            return this._readResources(oHelpers.getParentController(oParentController.getParent()));
        },

        /**
         * Prefill default data for a new time allocation request
         *
         * @public
         * @param {Object} oAllocationDate
         * @returns {void}
         */
        _prefillDataInCreateMode: function(oAllocationData) {
            var dPrefillBegTime = new Date();
            dPrefillBegTime.setHours(9);
            dPrefillBegTime.setMinutes(0);
            dPrefillBegTime.setSeconds(0);

            var dPrefillEndTime = new Date();
            dPrefillEndTime.setHours(17);
            dPrefillEndTime.setMinutes(0);
            dPrefillEndTime.setSeconds(0);

            oAllocationData.BegTime = dPrefillBegTime;
            oAllocationData.EndTime = dPrefillEndTime;

            oAllocationData.RecurrenceBegTime = dPrefillBegTime;
            oAllocationData.RecurrenceEndTime = dPrefillEndTime;

            oAllocationData.RecurrencyNumber = 1;
            oAllocationData.RECURRENCE_TYPE = "WEEKLY";

            oAllocationData.MONDAY = true;
            oAllocationData.TUESDAY = true;
            oAllocationData.WEDNESDAY = true;
            oAllocationData.THURSDAY = true;
            oAllocationData.FRIDAY = true;

            this._setEnableValueOfDaysOfWeek(true);
        },

        /**
         * Reset panels and fields when dialog has been closed
         *
         * @public
         * @returns {void}
         */
        _restorePanelAndFields: function(){
            this._singleWeekPanel.setVisible(true);
            this._singleWeekPanel.setExpandable(true);
            this._singleWeekPanel.setExpanded(false);

            this._recurrencePanel.setVisible(true);
            this._recurrencePanel.setExpandable(true);
            this._recurrencePanel.setExpanded(false);
        },

        /**
         * Pre-fill fields with data from existing allocation
         *
         * @public
         * @param {Object} oAllocationDate
         * @returns {void}
         */
        _prefillDataInEditMode: function(oAllocationData) {
            var oSelectedItem = oAllocationData.oSelectedItem,
                sRequest = "/TimeAllocationList(ID='" + oSelectedItem.ID + "',ResourceGuid='" + oSelectedItem.ResGuid + "')",
                that = this;

            this._oDialog.setBusy(true);

            this.getView().getModel().read(sRequest, {
                success: function(oDataResponse, oResponse) {

                    oAllocationData.ID = oSelectedItem.ID;
                    oAllocationData.Description = oSelectedItem.ItemDescription;
                    oAllocationData.SelectedTACategorie = oSelectedItem.SHPName;

                    if (oDataResponse.RECURRENCE_TYPE !== "") {
                        oAllocationData.RecurrenceBegTime = oDataResponse.Begtimestamp;
                        oAllocationData.RecurrenceEndTime = oDataResponse.Endtimestamp;
                        oAllocationData.RECURRENCE_TYPE = oDataResponse.RECURRENCE_TYPE;

                        switch (oAllocationData.RECURRENCE_TYPE) {
                            case "DAILY":
                                oAllocationData.RecurrencyNumber = oDataResponse.DAYS;

                                oAllocationData.RecurrenceFrom = oDataResponse.DAILY_REC_START;
                                oAllocationData.RecurrenceTo = oDataResponse.DAILY_REC_END;

                                that._setEnableValueOfDaysOfWeek(false);
                                break;

                            case "WEEKLY":
                                oAllocationData.RecurrencyNumber = oDataResponse.WEEKS;

                                oAllocationData.RecurrenceFrom = oDataResponse.WEEKLY_REC_START;
                                oAllocationData.RecurrenceTo = oDataResponse.WEEKLY_REC_END;

                                that._converteServerDayValues(oDataResponse, oAllocationData);

                                that._setEnableValueOfDaysOfWeek(true);
                                break;
                        }
                        that._recurrencePanel.setExpanded(true); //Expand Recurrence
                        that._singleWeekPanel.setVisible(false);
                        that._recurrencePanel.setExpandable(false); //Not posible to expand/collapse the pannel on edit mode to avoid confusion


                    } else {
                        oAllocationData.BegDate = oSelectedItem.BegDate;
                        oAllocationData.BegTime = new Date(oSelectedItem.BegDate);

                        oAllocationData.EndDate = oSelectedItem.EndDate;
                        oAllocationData.EndTime = new Date(oSelectedItem.EndDate);

                        // limit selection of end date to the same calendar week
                        var oEndDatePicker = sap.ui.core.Fragment.byId(that._sFragmentId, "idEndDate"),
                            oBegDatePicker = sap.ui.core.Fragment.byId(that._sFragmentId, "idBegDate"),
                            dStartDate = new Date(oAllocationData.BegDate),
                            dEndDate = oAllocationData.EndDate,
                            aCWDates = CalendarHelper.getCurrentWeekFromDate(dStartDate),
                            dMinDate = dStartDate,
                            dMaxDate = aCWDates[1];

                       /* oEndDatePicker.setMinDate(dMinDate);
                        oEndDatePicker.setMaxDate(dMaxDate);
                        */
                       //not to limit pick date from the calendar
                        oEndDatePicker.setMinDate();
                        oEndDatePicker.setMaxDate();

                        // if the end date selected no longer falls between the min/max date then set it to match the BegDate
                       /* if (dEndDate > dMaxDate || dEndDate < dMinDate) {
                            oEndDatePicker.setDateValue(dStartDate);
                        }*/

                        that._recurrencePanel.setVisible(false);
                        that._singleWeekPanel.setExpanded(true);
                        that._singleWeekPanel.setHeaderText("");
                        that._singleWeekPanel.setExpandable(false);
                    }
                    that.getView().getModel("CreateAllocation").refresh();

                    that._oDialog.setBusy(false);
                },
                error: function() {
                    that._oDialog.setBusy(false);
                }
            });
        },

        /**
         * Converts 'X' values returned from backend to booleans used by ui
         *
         * @public
         * @param {Object} oServerModel - object used for request
         * @param {Object} oLocalModel - object of date from ui model
         * @returns {void}
         */
        _converteServerDayValues: function(oServerModel, oLocalModel) {
            if (oServerModel.MONDAY === "X") oLocalModel.MONDAY = true;
            if (oServerModel.TUESDAY === "X") oLocalModel.TUESDAY = true;
            if (oServerModel.WEDNESDAY === "X") oLocalModel.WEDNESDAY = true;
            if (oServerModel.THURSDAY === "X") oLocalModel.THURSDAY = true;
            if (oServerModel.FRIDAY === "X") oLocalModel.FRIDAY = true;
            if (oServerModel.SATURDAY === "X") oLocalModel.SATURDAY = true;
            if (oServerModel.SUNDAY === "X") oLocalModel.SUNDAY = true;
        },

        /**
         * Sets the mandatory fields depending whether single/recurring is selected
         *
         * @public
         * @param {Boolean} bMandatory
         * @param {Array} aLabelsId
         * @returns {void}
         */
        _setMandatoryFieldsStatus: function(bMandatory, aLabelsId) {
            var oLabel;

            for (var i = 0; i < aLabelsId.length; i++) {
                oLabel = sap.ui.core.Fragment.byId(this._sFragmentId, aLabelsId[i]);
                oLabel.setRequired(bMandatory);
            }  
        },

        /**
         * Checks if all mandatory fields are filled, if not set their value states to error
         *
         * @public
         * @param {Array} aInputIds
         * @returns {Boolean} bAllMandatoryInputFieldsEntered
         */
        _setMandatoryInputFieldsError: function(aInputIds) {
            var bAllMandatoryInputFieldsFilled = true,
                oInput;

            // input is seperate from single/recurring so we must add it seperately to the input list
            aInputIds.push("idtimeAllocationCategoryList");

            for (var i = 0; i < aInputIds.length; i++) {
                oInput = sap.ui.core.Fragment.byId(this._sFragmentId, aInputIds[i]);

                if (oInput.getValue().trim() === "") {
                    oInput.setValueState(sap.ui.core.ValueState.Error);
                    bAllMandatoryInputFieldsFilled = false;
                } else {
                    oInput.setValueState(sap.ui.core.ValueState.None);
                }
            }
            return bAllMandatoryInputFieldsFilled;
        },

        /**
         * Checks if the inputs that are required have data entered
         *
         * @public
         * @param {Array} aInputIds
         * @returns {void}
         */
        _checkInputFields: function(aInputIds) {
            var oInput;

            // input is seperate from single/recurring so we must add it seperately to the input list
            aInputIds.push("idtimeAllocationCategoryList");

            for (var i = 0; i < aInputIds.length; i++) {
                oInput = sap.ui.core.Fragment.byId(this._sFragmentId, aInputIds[i]);

                if (oInput.getValue().trim() === "") {
                    return false;
                }
            }
            return true;
        },

        /**
         * Creates the backend request body for a single time allocation
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        _createRequestBody: function(oEvent) {
            var oHelperBody = oEvent.getSource().getModel("CreateAllocation").getData(),
                oFinalRequestBody = {};

            this._addCommonFields(oFinalRequestBody, oHelperBody);

            oFinalRequestBody.Description = sap.ui.core.Fragment.byId(this._sFragmentId, "idDescription").getValue();

            oFinalRequestBody.BegDate = oHelperBody.BegDate;
            oFinalRequestBody.EndDate = oHelperBody.EndDate;

            oFinalRequestBody.Begtimestamp = this._combineDateTime(oHelperBody.BegDate, oHelperBody.BegTime);
            oFinalRequestBody.Endtimestamp = this._combineDateTime(oHelperBody.EndDate, oHelperBody.EndTime);

            oFinalRequestBody.Begtimestamp = formatter.removeTimeOffset(oFinalRequestBody.Begtimestamp);
            oFinalRequestBody.Endtimestamp = formatter.removeTimeOffset(oFinalRequestBody.Endtimestamp);

            return oFinalRequestBody;
        },

        /**
         * Creates the backend request body for a recurring time allocation
         *
         * @public
         * @param {Object} oEvent - event that called the function
         * @returns {void}
         */
        _createRequestBodyRecurrence: function(oEvent) {
            var oHelperBody = oEvent.getSource().getModel("CreateAllocation").getData(),
                oFinalRequestBody = {};

            this._addCommonFields(oFinalRequestBody, oHelperBody);

            oFinalRequestBody.RECURRENCE_TYPE = oHelperBody.RECURRENCE_TYPE;

            oFinalRequestBody.Description = sap.ui.core.Fragment.byId(this._sFragmentId, "idDescriptionRec").getValue();

            oFinalRequestBody.BegDate = oHelperBody.RecurrenceFrom;
            oFinalRequestBody.EndDate = oHelperBody.RecurrenceTo;

            oFinalRequestBody.Begtimestamp = this._combineDateTime(oHelperBody.RecurrenceFrom, oHelperBody.RecurrenceBegTime);
            oFinalRequestBody.Endtimestamp = this._combineDateTime(oHelperBody.RecurrenceTo, oHelperBody.RecurrenceEndTime);

            oFinalRequestBody.Begtimestamp = formatter.removeTimeOffset(oFinalRequestBody.Begtimestamp);
            oFinalRequestBody.Endtimestamp = formatter.removeTimeOffset(oFinalRequestBody.Endtimestamp);

            switch (oHelperBody.RECURRENCE_TYPE) {
                case "DAILY":
                    oFinalRequestBody.DAYS = oHelperBody.RecurrencyNumber;
                    oFinalRequestBody.DAILY_REC_START = formatter.removeTimeOffset(oHelperBody.RecurrenceFrom);
                    oFinalRequestBody.DAILY_REC_END = formatter.removeTimeOffset(oHelperBody.RecurrenceTo);

                    oFinalRequestBody.DAILY_REC_END.setHours(23);
                    oFinalRequestBody.DAILY_REC_END.setMinutes(59);

                    break;

                case "WEEKLY":
                    oFinalRequestBody.WEEKS = parseInt(oHelperBody.RecurrencyNumber);
                    oFinalRequestBody.WEEKLY_REC_START = oHelperBody.RecurrenceFrom;
                    oFinalRequestBody.WEEKLY_REC_END = oHelperBody.RecurrenceTo;

                    oFinalRequestBody.WEEKLY_REC_END.setHours(23);
                    oFinalRequestBody.WEEKLY_REC_END.setMinutes(59);

                    this._converteLocalDayValues(oFinalRequestBody, oHelperBody);
                    break;
            }
            return oFinalRequestBody;
        },

        /**
         * Converts boolean values from input to 'X' used by backend
         *
         * @public
         * @param {Object} oServerModel - object used for request
         * @param {Object} oLocalModel - object of date from ui model
         * @returns {void}
         */
        _converteLocalDayValues: function(oServerModel, oLocalModel) {
            if (oLocalModel.MONDAY === true) oServerModel.MONDAY = "X";
            if (oLocalModel.TUESDAY === true) oServerModel.TUESDAY = "X";
            if (oLocalModel.WEDNESDAY === true) oServerModel.WEDNESDAY = "X";
            if (oLocalModel.THURSDAY === true) oServerModel.THURSDAY = "X";
            if (oLocalModel.FRIDAY === true) oServerModel.FRIDAY = "X";
            if (oLocalModel.SATURDAY === true) oServerModel.SATURDAY = "X";
            if (oLocalModel.SUNDAY === true) oServerModel.SUNDAY = "X";
        },

        /**
         * Set the common fields between the request bodies for single/recurrance
         *
         * @public
         * @param {Object} oRequestBody - object used for request
         * @param {Object} oHelperBody - object of date from ui model
         * @returns {void}
         */
        _addCommonFields: function(oRequestBody, oHelperBody) {
            oRequestBody.TimespecType = sap.ui.core.Fragment.byId(this._sFragmentId, "idtimeAllocationCategoryList").getSelectedKey();
            oRequestBody.EmpID = oHelperBody.EmpID;
        },

        /**
         * Create a new date object using a date value and time value
         *
         * @public
         * @param {Date} dDate
         * @param {Date} dTime
         * @returns {Date} - the newly created date
         */
        _combineDateTime: function(dDate, dTime) {
            return new Date(dDate.getFullYear(),
                dDate.getMonth(),
                dDate.getDate(),
                dTime.getHours(),
                dTime.getMinutes());
        },

        /**
         * Enable/Disable the days selection depending on type of recurrence selected
         *
         * @public
         * @param {Boolean} bEnabledValue - enable the days inputs
         * @returns {void}
         */
        _setEnableValueOfDaysOfWeek: function(bEnabledValue) {
            var oCurrentDayCheckbox;

            for (var i = 1; i < 8; i++) {
                oCurrentDayCheckbox = sap.ui.core.Fragment.byId(this._sFragmentId, "DaysOfTheWeekPicker" + i);
                oCurrentDayCheckbox.setEnabled(bEnabledValue);

                if (!bEnabledValue) {
                    oCurrentDayCheckbox.setSelected(false);
                }
            }
        },

        /**
         * Reset all the input fields value state to none
         *
         * @public
         * @returns {void}
         */
        _setAllInputFieldsStateToNormal: function() {
            var allInputFields = this._aIdsInputFieldsRecurrence.concat(this._aIdsInputFieldsSingleAssignment),
                oInput;

            for (var i = 0; i < allInputFields.length; i++) {
                oInput = sap.ui.core.Fragment.byId(this._sFragmentId, allInputFields[i]);
                oInput.setValueState(sap.ui.core.ValueState.None);
                oInput.setEnabled(true);
            }
        }
    });

});

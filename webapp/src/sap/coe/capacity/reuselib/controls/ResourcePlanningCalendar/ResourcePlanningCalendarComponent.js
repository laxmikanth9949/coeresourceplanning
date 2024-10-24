sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/EditServiceOrder.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/HandleTimeAllocation.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/ColleagueDetailPopover.fragment.controller",
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/capacity/reuselib/utils/DataManager",
    "sap/coe/capacity/reuselib/utils/dataManagerNew",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/coe/capacity/reuselib/utils/CalendarHelper",
    "sap/ui/model/Filter",
    "sap/m/ToggleButton",
    "sap/coe/capacity/reuselib/utils/P13nHelper",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/coe/capacity/reuselib/controls/TimeZoneSelect/TimeZoneSettings"
], function(BaseFragmentComponent, EditServiceOrder, HandleTimeAllocation, ColleagueDetailPopover, formatter, DataManager,
    dataManagerNew, TokenHelper, helpers, i18n, oCalendarHelper, Filter, ToggleButton, P13nHelper, MessageBox, Button, Dialog,Text, TimeZoneSettings) {
    "use strict";

    var resourcePlanningCalendarComponentInstance;

    var ResourcePlanningCalendar = BaseFragmentComponent.extend(
        "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.ResourcePlanningCalendarComponent", {
            metadata: {
                properties: {
                    fullScreen: {
                        type: "boolean",
                        defaultValue: false
                    },
                    showRowHeader: {
                        type: "boolean",
                        defaultValue: false
                    },
                    assignmentsEditable: {
                        type: "boolean",
                        defaultValue: false
                    },
                    showCreateTimeAllocation: {
                        type: "boolean",
                        defaultValue: false
                    },
                    selected: {
                        type: "boolean",
                        defaultValue: false
                    }
                },
                events: {
                    onStartDateChangeComplete: {
                        parameters: {
                            intervalDates: {
                                type: "object"
                            },
                            viewKey: {
                                type: "string"
                            },
                            preventSearch : {
                                type: "boolean"
                            },
                            preventP13Update : {
                                type: "boolean"
                            }
                        }
                    },
                    onCreateDialogConfirm: {},
                    allocationCreated: {
                        parameters: {
                            allocation: {
                                type: "object"
                            }
                        }
                    },
                    assignmentDeleted: {
                        parameters: {
                            itemGuid: {
                                type: "string"
                            }
                        }
                    }
                }
            },

            renderer: {},
            formatter: formatter,
            componentInitialised: false,

            /**
             * This function is called when the component is being initialized
             * @name init
             * @function
             * @memberOf StandardNotesListComponent#
             * @return {void}
             */
            init: function() {
                resourcePlanningCalendarComponentInstance = this;
                //Instanciate fragment controller and fragment
                this._initFragment(
                    "ResourcePlanningCalendar",
                    "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.ResourcePlanningCalendar"
                );
                this.setModel(
                    new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/model/utilsModel.json"),
                    "UtilsModel");
                this.setModel(
                    new sap.ui.model.json.JSONModel({}),
                    "resourceModel");
                this._oPlanningCalendar = this.getFragment();
                this._oPlanningCalendar._oTodayButton.setVisible(false);
                this.setModel(new sap.ui.model.json.JSONModel({createTimeAllocationButtonVisibility: true}), "UIModel");
                this.oUIModel = this.getModel("UIModel");
                this.setModel(new sap.ui.model.json.JSONModel({}), "CalendarNavModel");
                this.oNavModel = this.getModel("CalendarNavModel");
                //this gives us access to the component of the calling application, used for p13n
                this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this));

                //we have to add the title control programmatically because we cannot bind i18n or model to text property.
                //we then run into xml not localized error, which is handled at the check- tool level not project level
                this._oPlanningCalendar.addToolbarContent(new sap.m.Title({text: i18n.getText("PC_HEADER_TITLE")}));

            },

            /**
             * This function is called after rendering of the component. In here the model is already bound to the control
             * @name onAfterRendering
             * @function
             * @memberOf StandardNotesListComponent#
             * @return {void}
             */
            onAfterRendering: function() {
                var bFullScreen = this.getFullScreen();
                if (sap.ui.core.Fragment.byId(this._sFragmentId, "idFullScreen")) {
                    sap.ui.core.Fragment.byId(this._sFragmentId, "idFullScreen").setVisible(bFullScreen);
                }
                //function call here not in onInit because if we nav personal cal -> team calendar this component is already initialized and func will not be called
                this.prepareSortUIModel();


                this._oPlanningCalendar.getBinding("rows").attachChange(function() {
                    //we cant bind to title control text property so instead we update the title manually everytime the binding on pc rows changes
                    var sNumRows = this._oPlanningCalendar.getRows().length;
                    var oToolbarTitle = sap.ui.core.Fragment.byId(this._sFragmentId, "PC1-Header-Title");
                    oToolbarTitle.setProperty("text", i18n.getText("PC_HEADER_TITLE_WITH_NUM_RESOURCES",[sNumRows]));
                }.bind(this));

            }
        });
    //publishes the event to channel where any controller/component that wishes to be aware of calendar row selection
    // can subscribe. when we select row we want to make sure their is an SO to be assigned in list so we can enable the
    // assign button. but we dont want to make this "reuse" component dependent on the list
    ResourcePlanningCalendar.prototype.publishRowselectionToEventBus = function() {
        var oEventBus = sap.ui.getCore().getEventBus();
        var bSelected = this._oPlanningCalendar.getSelectedRows().length > 0;
        oEventBus.publish("GlobalChannel", "RowSelected", { selected: bSelected});
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.setShowRowHeader = function(bShowRowHeader) {
        if (bShowRowHeader) {
            this._oPlanningCalendar.insertToolbarContent(
                new ToggleButton("idShowHidePerson", {
                    icon: "sap-icon://person-placeholder",
                    tooltip: "Show Header",
                    pressed: true,
                    press: this.onShowRowHeaders
                }), 5);
        }
    };

    /**
     * improvement NGIPIRELAND05-473 - if person button is not required, then we are not in personal calendar,
     * therefore remove Create Time Allocation button
     * @param oEvent
     */
    ResourcePlanningCalendar.prototype.setShowCreateTimeAllocation = function(oEvent) {
        this.oUIModel.setProperty("/createTimeAllocationButtonVisibility", false);
    };

    /**
     * Used to set the view key based on data from personalization services.
     * Triggered from success function of p13n data read, which is requested in control init

     * If not called before onBeforeRendering function triggers the fireViewChange
     * fireViewChange needs to be retriggered after view key is set
     *
     * @param {string} sViewKey view key retrieved from p13n
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.setViewKeyFromP13n = function(sViewKey) {
        // Set planning calendar view key
        this.getFragment().setViewKey(sViewKey);
        // Fire viewChange event of planning calendar
        // bPreventP13Update determines if call to save p13n is needed
        this.getFragment().fireViewChange({bPreventP13Update: true});
    };

    /**
     *Setter for Property assignmentEditible
     *
     * @param {boolean} 
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.setAssignmentsEditable = function(bAssignmentsEditable, bOldAbsenceAllocation) {
        this.getModel("UIModel").setProperty("/assignmentEditable", bAssignmentsEditable);
        // hide the 'edit' button for the older 'ZVAC' absences
        if (bOldAbsenceAllocation !== null) {
            this.getModel("UIModel").setProperty("/oldAbsenceAllocation", bOldAbsenceAllocation);
        }
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
     ResourcePlanningCalendar.prototype.updateNavModel = function(oEvent) {
        var iViewKey = parseInt(oEvent.getSource().getProperty("viewKey")),
            aItems = [];

        var aTempArray = [
            {
                "key" : "1",
                "text" : i18n.getText("CALENDAR_NAV_MODEL_1WEEK") 
            },
            {
                "key" : "2",
                "text" : i18n.getText("CALENDAR_NAV_MODEL_2WEEKS")
            },
            {
                "key" : "4",
                "text" : i18n.getText("CALENDAR_NAV_MODEL_4WEEKS")
            },
            {
                "key" : "6",
                "text" : i18n.getText("CALENDAR_NAV_MODEL_6WEEKS")
            }];

        for (var key in aTempArray) {
            if (aTempArray.hasOwnProperty(key)) {
                if(aTempArray[key].key <= iViewKey){
                    aItems.push(aTempArray[key]);
                }
            }
        }

        this.oNavModel.setProperty("/", aItems);
        //if a view key has been chosen that is smaller than the current selected step value
        //set the last item in the list to selected (will always match the current view key) and update the key value
        if(this.oCalendarStepList && this.iCurrentIntervalNum > aItems[aItems.length - 1].key ){
            this.oCalendarStepList.getItems()[aItems.length - 1].setSelected(true);
            this.iCurrentIntervalNum = aItems[aItems.length - 1].key;
        }

    };

    ResourcePlanningCalendar.prototype.onCalendarChange = function(oEvent) {
        var sViewKey = oEvent.getSource().getViewKey(),
            oView = this._getViewByKey(oEvent.getSource().getViews(), sViewKey),
            oCalendarStartDate = oEvent.getSource().getStartDate(),
            iInterval = oView.getIntervalsM(),
            aIntervalDates,
            iWeeksStep = this.iCurrentIntervalNum ? this.iCurrentIntervalNum : sViewKey,
            iDaysStep = iWeeksStep * 7;

        if(oEvent.getId() === "startDateChange"){
            var bNavigateForward = this.navigationStartDate.getTime() < oCalendarStartDate.getTime();
            aIntervalDates = this.navigateCalendar(oCalendarStartDate, iInterval, iDaysStep, bNavigateForward);
        }
        else {
            this.updateNavModel(oEvent);
            aIntervalDates = this.navigateCalendar(oCalendarStartDate, iInterval);
        }

        // Only set Calendar StartDate if it has changed
        if (oCalendarStartDate.getTime() !== aIntervalDates[0].getTime()) {
            oEvent.getSource().setStartDate(aIntervalDates[0]);
        }

        //Reset front end filters
        this.onReset();
        this.navigationStartDate = oCalendarStartDate;
        this.fireOnStartDateChangeComplete({
            intervalDates: aIntervalDates,
            viewKey: sViewKey,
            preventP13Update: oEvent.getParameter("bPreventP13Update")
        });
    };

    /**
     * Get start and end dates for month view
     *
     * @param {object}
     * @param {int}  iInterval - Number of days between start and end date.
     * @return {array} [oStartDate, oEndDate] Start and End date objects
     * @public
     */
    ResourcePlanningCalendar.prototype.navigateCalendar = function(oDate, iInterval, iDays, bNavigateForward) {
        var iDate = 0;
        // set the date to the first day of week,
        // if the date falls on a sunday, set the date to the monday before
        if (oDate.getDay() === 0) {
            iDate = (oDate.getDate() - 6);
        }
        else {
            iDate = (oDate.getDate() - (oDate.getDay() - 1));
        }

        if(bNavigateForward){
            iDate = iDate - (iInterval - iDays);

        }
        else if(bNavigateForward === false){
            iDate = iDate + (iInterval - iDays);
        }

        var oStartDate = new Date(oDate.getFullYear(), oDate.getMonth(), iDate),
            oEndDate = new Date(oStartDate.getFullYear(), oStartDate.getMonth(), (oStartDate.getDate() + iInterval), 0, 0, -1);

        return [oStartDate, oEndDate];
    };

     ResourcePlanningCalendar.prototype.onCalendarStepDialogPress = function () {

        if (!this.oStepSelectDialog) {
            var oListItemTemplate = new sap.m.StandardListItem({
                title: "{text}"
            });
            this.oCalendarStepList = new sap.m.List({mode: "SingleSelect"});

            this.oCalendarStepList.bindAggregation("items", {
                path: "/",
                template: oListItemTemplate,
                templateShareable: true
            });

            this.oStepSelectDialog = new sap.m.Dialog({
                title: i18n.getText("STEP_SELECT_DIALOG_TITLE"),
                content: this.oCalendarStepList,
                beginButton: new sap.m.Button({
                    text: i18n.getText("STEP_SELECT_DIALOG_OK_BUTTON"),
                    press: function () {
                        this.oStepSelectDialog.close();
                        this.iCurrentIntervalNum = this.oNavModel.getProperty(this.oCalendarStepList.getSelectedItem().getBindingContext().getPath()).key;
                    }.bind(this)
                })
            });
            this.oStepSelectDialog.setModel(this.getModel("CalendarNavModel"));
        }
        this.oStepSelectDialog.open();

        if(!this.iCurrentIntervalNum){
            this.oCalendarStepList.getItems()[this.oCalendarStepList.getItems().length - 1].setSelected(true);
        }
    };

    ResourcePlanningCalendar.prototype.onOpenColorLegend = function(oEvent) {
        var sFragmentId = this._sFragmentId + "--" + "ColorLegendPopover";
        if (!this._oColorLegendPopover) {
            this._oColorLegendPopover = helpers.initializeFragmentFromObject({
                oParentController: this,
                sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.ColorLegendPopover",
                oModel: this.getModel("resourceModel"),
                sCreateId: sFragmentId
            });
        }
            this._oColorLegendPopover.openBy(oEvent.getSource());
    };

    /**
     * Get the Calendar View by Key
     *
     * @param {array} An array of View objects
     * @param {str}  the key to check
     * @return {object} the matched view object
     * @private
     */
    ResourcePlanningCalendar.prototype._getViewByKey = function(aViews, sViewKey) {
        for (var oView in aViews) {
            if (aViews[oView].getKey() === sViewKey)
                return aViews[oView];
        }
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.openCreateDialog = function(oEvent) {
        var oFragment = this.getFragment(),
            oSelectedUser = oFragment.getRows()[0].getBindingContext("resourceModel").oModel.oData[0];

        this.onOpenEditTimeAllocation(false, oSelectedUser);
    };

    ResourcePlanningCalendar.prototype.onOpenEditDialog = function(oEvent) {
        var that = resourcePlanningCalendarComponentInstance,
            oPopover = oEvent.getSource().getParent().getParent(),
            sPath = oPopover.getBindingContext().getPath(),
            oModel = oPopover.getBindingContext().getModel(),
            oResource = oModel.getProperty(sPath);

        switch (oResource.Type) {
            case "ASG":
                that._onOpenEditAssigment(oResource);
                oPopover.close();
                break;
            case "TAL":
                that.onOpenEditTimeAllocation(true, {
                    EmpId: oResource.EmpId,
                    FullName: oResource.ConsultantName
                }, oResource);
                oPopover.close();
                break;
            default:
                return;
        }
    };

    ResourcePlanningCalendar.prototype._onOpenEditAssigment = function(oResource) {
        var that = resourcePlanningCalendarComponentInstance;

        if (!that._editServiceOrder) {
            that._editServiceOrder = helpers.initializeFragmentFromObject({
                oParentController: that,
                sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.EditServiceOrder",
                ControllerClass: EditServiceOrder,
                sCreateId: that.getId() + "--" + "EditServiceOrder"
            });
            that._editServiceOrder.setModel(new sap.ui.model.json.JSONModel([{}]), "EditSelectedOrderDialogModel");
        }

        oResource.StartTime = new Date(oResource.BegDate);
        oResource.EndTime = new Date(oResource.EndDate);
        that._editServiceOrder.getModel("EditSelectedOrderDialogModel").setProperty("/", [oResource]);

        that._editServiceOrder.open();
    };

    ResourcePlanningCalendar.prototype.onOpenEditTimeAllocation = function(bEditMode, oSelectedUser, oSelectedItem) {
        var that = resourcePlanningCalendarComponentInstance,
            oAllocationData, sFragmentId;
        var sCurrentUserEmpId = this.getModel("praUserContext").getProperty("/EmpId");


        if (!oSelectedUser.EmpId) {
            sap.m.MessageBox.error("Employee ID not assigned to Employee '" + oSelectedUser.FullName + "'.");
            return;
        }

        sFragmentId = that.getId() + "--" + "CreateAllocation";
        if (!that._oHandleTimeAllocation) {
            that._oHandleTimeAllocation = helpers.initializeFragmentFromObject({
                oParentController: that,
                sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.CreateAllocation",
                ControllerClass: HandleTimeAllocation,
                sCreateId: sFragmentId
            });

            that._oHandleTimeAllocation.setModel(new sap.ui.model.json.JSONModel({}), "CreateAllocation");
        } else {
            that._oHandleTimeAllocation.getModel("CreateAllocation").setProperty("/", {});
        }
        //isUsersResource is a boolean represents if the selected resource in calendar matches
        //the current user. used in team calendar to hide create absence button via property binding
        oAllocationData = that._oHandleTimeAllocation.getModel("CreateAllocation").getProperty("/");
        oAllocationData.sFragmentId = sFragmentId;
        oAllocationData.EmpID = oSelectedUser.EmpId;
        oAllocationData.FullName = oSelectedUser.FullName;
        oAllocationData.EditMode = bEditMode;
        oAllocationData.oSelectedItem = oSelectedItem;
        oAllocationData.bIsUsersResource = oSelectedUser.EmpId.toLowerCase() === sCurrentUserEmpId.toLowerCase();

        that._oHandleTimeAllocation.open();
    };

    ResourcePlanningCalendar.prototype.onDeleteCalendarEntry = function(oEvent) {
        var oPopover = oEvent.getSource().getParent().getParent(),
            sPath = oPopover.getBindingContext().getPath(),
            oModel = oPopover.getBindingContext().getModel(),
            oResource = oModel.getProperty(sPath);

        switch (oResource.Type) {
            case "ASG":
                this._onDeleteAssignment(oResource);
                oPopover.close();
                break;
            case "TAL":
                this._onDeleteTimeAllocation();
                oPopover.close();
                break;
            default:
                return;
        }

    };

    ResourcePlanningCalendar.prototype.onItemDescriptionLinkPress = function(oEvent) {
        var oPopoverContext = oEvent.getSource().getBindingContext(),
            oData = this.getModel("resourceModel").getProperty(oPopoverContext.sPath),
            sBaseURL = this.getModel("praUserContext").getProperty("/BaseURLCRM"),
            sLinkPrefixToCRMItem = sBaseURL +
            "sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&sap-client=001&sap-language=EN&crm-object-type=ZSU_TBUI4&crm-object-action=B&crm-object-value=";

        window.open(sLinkPrefixToCRMItem + oData.HeaderGuid);
    };

    ResourcePlanningCalendar.prototype._onDeleteTimeAllocation = function() {
        var that = this,
            oProperty = this._getAppointmentPropery();

        sap.m.MessageBox.confirm(this._getDeleteMsg(oProperty), {
            onClose: function(oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                    DataManager.onDeleteTimeAllocation(that, oProperty.ID, oProperty.ResGuid, that.getModel());
                }
            }
        });

    };

    ResourcePlanningCalendar.prototype._onDeleteAssignment = function(oAssignment) {
        var that = this;

        sap.m.MessageBox.confirm(this._getDeleteMsg(oAssignment), {
            onClose: function(oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                    DataManager.onDeleteAssignment(that, oAssignment, that.getModel(), that._handleAssignmentDelete);
                }
            }
        });

    };

    ResourcePlanningCalendar.prototype._getAppointmentPropery = function() {
        var oModel = this.getModel("resourceModel");
        var oContext = this.oSelectedAppointment.getBindingContext("resourceModel");
        var oProperty = oModel.getProperty(oContext.sPath);
        return oProperty;
    };

    ResourcePlanningCalendar.prototype._getDeleteMsg = function(oAllocation) {
        var sText = i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX_SELECTED") + " ";

        if (oAllocation.Type === "ASG") {
            sText += parseInt(oAllocation.DemandId, 10) + " - " + parseInt(oAllocation.ItemNo, 10) + ", " + oAllocation.SHPName;
        } else if (oAllocation.Type === "TAL") {
            sText += formatter.convertSubmissionStatus(oAllocation.SHPName);
        }

        sText += " " + i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX_FOR") + " " + formatter.getDisplayDateDayTime(oAllocation.BegDate) +
            " - " + formatter.getDisplayDateDayTime(oAllocation.EndDate) + ". ";

        sText += i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX");
        return sText;
    };

    ResourcePlanningCalendar.prototype.onOpenEditDelete = function(oEvent) {
        var sText = " ";

        sText += i18n.getText("EDIT_ABSENCE_INFO_MSG_1");
        sText += i18n.getText("EDIT_ABSENCE_INFO_MSG_2");

        this.oDialog = new Dialog({
            title: i18n.getText("EDIT_ABSENCE_DIALOG_TITLE"),
            type: "Message",
            state: sap.ui.core.ValueState.Information,
            content: new Text({
                text: sText
            }),
            buttons: [
                new Button({
                    text: i18n.getText("ABSENCE_OPEN_LEAVE_REQUEST_APP_BUTTON"),
                    press: function () {
                        this.onNavigateToLeaveRequestApp();
                        this.oDialog.close();
                    }.bind(this)
                }),
                new Button({
                    text: i18n.getText("FRAGMENT_CREATEALLOCATION_BUTTON_CANCEL"),
                    press: function () {
                        this.oDialog.close();
                    }.bind(this)
                })
            ]
        });

        this.oDialog.open();
    };

    ResourcePlanningCalendar.prototype.onNavigateToLeaveRequestApp = function(oEvent) {
        var sPrefix = "https:";
        window.open(sPrefix + "//fiorilaunchpad.sap.com/sites#leaverequest-create");
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.appointmentDetailPopoverPress = function(oEvent) {
        //iS SCOPING TO CONTROLLER neccessary, leaving it for now
        this.oSelectedAppointment = oEvent.getParameter("appointment");
        var sPath = this.oSelectedAppointment.getBindingContext("resourceModel").getPath();
        if (this._oAppHoverPopover) jQuery.sap.clearDelayedCall(this._oAppHoverPopover.iOpenDelayedCallId); //Cancel tooltip if any

        //some appointments use different popovers, this function determines the correct popover to display
        if(this.oSelectedAppointment.getType() === "Type09"){
            this.displayAbsencePopover(sPath, this.oSelectedAppointment );
        }
        else{
            this._createAppointmentFragment(sPath, this.oSelectedAppointment);
        }
    };

    //displays popover related to absence appointment, has no edit/delete button like other TAL appointment, instead button to nav
    //to My leave Request app where absences are now solely maintained
    //NOTE: this function and _createAppointmentFragment can be refactored to remove duplicate code but with zero testing + mature project im
    //leaving it for now rather than change anything and risk breaking
    ResourcePlanningCalendar.prototype.displayAbsencePopover = function(sPath, oAppointment) {
        var _sFragmentId = "",
            sCurrentUserEmpId = this.getModel("praUserContext").getProperty("/EmpId"),
            sSelectedUserEmpId = this.getModel("resourceModel").getProperty(sPath).EmpId;

        if (!this._oAbsencePopover) {
            _sFragmentId = this.getId() + "--" + "Absences";
            this._oAbsencePopover = sap.ui.xmlfragment(_sFragmentId,
                "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.AbsenceTalPopover", this);
            this.addDependent(this._oAbsencePopover);
        }
        this._oAbsencePopover.setModel(this.getModel("resourceModel"));
        this._oAbsencePopover.bindElement(sPath);

        jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this._oAbsencePopover);

        //close popover if its open and we have already selected that appointment
        if(this._oAbsencePopover.isOpen() && !this.oSelectedAppointment.getProperty("selected")){
            this._oAbsencePopover.close();
        }
        else{
            this.setAssignmentsEditable(sCurrentUserEmpId.toLowerCase() === sSelectedUserEmpId.toLowerCase());
            this._oAbsencePopover.openBy(oAppointment);
        }
    };

    /**
     *
     *
     * @param {sPath,oEvent} Event object
     * @return {void}
     * @private
     */
    ResourcePlanningCalendar.prototype._createAppointmentFragment = function(sPath, oAppointment) {
        var _sFragmentId = "";
        if (!this._oAllocationDetailPopover) {
            _sFragmentId = this.getId() + "--" + "Appointments";
            this._oAllocationDetailPopover = sap.ui.xmlfragment(_sFragmentId,
                "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.allocationDetailPopoverPress", this);
            this.addDependent(this._oAllocationDetailPopover);
        }
        this._oAllocationDetailPopover.setModel(this.getModel("resourceModel"));
        this._oAllocationDetailPopover.bindElement(sPath);
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this._oAllocationDetailPopover);

        //close popover if its open and we have already selected that appointment
        if(this._oAllocationDetailPopover.isOpen() && !this.oSelectedAppointment.getProperty("selected")){
            this._oAllocationDetailPopover.close();
        }
        else{
            this.checkIfTalShouldBeEditable(oAppointment);
            this._oAllocationDetailPopover.openBy(oAppointment);
        }
    };

    ResourcePlanningCalendar.prototype.checkIfTalShouldBeEditable = function(oAppointment) {
        var sType = oAppointment.getProperty("type");
        //if the type is NOT 08(public holiday) then set assignment editable, otherwise have editing disabled
        this.setAssignmentsEditable( sType !== "Type08", sType !== "Type02");
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onRowHeaderClick = function(oEvent) {
        var _sFragmentId = this.getId() + "--" + "ColleagueDetails",
            oSelectedRow = oEvent.getParameters("rows").row,
            sBindingContextPath = oSelectedRow.getBindingContext("resourceModel").getPath(),
            // temp workaround to keep functionality the same as it was
            oRowTitle = oSelectedRow.getParent().getAggregation("table").getAggregation("items")[parseInt(sBindingContextPath.split("/").pop())].getAggregation("cells")[0],
            sEmpIdBindingPath = "/EmpId",
            //empId of the resource selected in PC
            sResourceEmpId =  this.getModel("resourceModel").getProperty(sBindingContextPath + sEmpIdBindingPath),
            sCurrentUserEmpId = this.getModel("praUserContext").getProperty("/EmpId"),
            //is selected row the current users resource
            bIsUsersResource = sCurrentUserEmpId.toLowerCase() === sResourceEmpId.toLowerCase();

            this.getModel("resourceModel").setProperty("/bIsSelectedCurrentUser", bIsUsersResource);
        if (!this._oColleageDetailsPopover) {
            this._oColleageDetailsPopover = helpers.initializeFragmentFromObject({
                oParentController: this,
                ControllerClass: ColleagueDetailPopover,
                sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.colleagueDetailPopover",
                oModel: this.getModel("resourceModel"),
                sElementPath: sBindingContextPath,
                sCreateId: _sFragmentId
            });
            this._oColleageDetailsPopover.setModel(this.getModel("i18n"), "i18n");


        }
        this._oColleageDetailsPopover.bindElement(sBindingContextPath);
        this._oColleageDetailsPopover.openBy(oRowTitle);
        this.publishRowselectionToEventBus();
    };
    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onRowSelectionChange = function(oEvent) {
        this.publishRowselectionToEventBus();
    };

    ResourcePlanningCalendar.prototype.onOpenCalendarSettings = function() {
        var _sFragmentId = "";
        if (!this._oCalendarSettings) {
            _sFragmentId = this.getId() + "--" + "CalendarFilter";
            this._oCalendarSettings = sap.ui.xmlfragment(_sFragmentId,
                "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.CalendarFilter", this);
            this.addDependent(this._oCalendarSettings);
        }
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this._oCalendarSettings);
        this._oCalendarSettings.open();
    };

    //reads the p13n and if it exists updates our (default) UI model, then it iterates through through UI
    //model sort options and sets selected the appropriate item
    ResourcePlanningCalendar.prototype.prepareSortUIModel = function() {
        var aSortItems,
        sDefaultSortItemKey;

        P13nHelper.readData(this._oComponent._calSortP13n, function(oSortOptionData) {
            // if oSortOptionData is defined then we have p13n sort settings saved
            if (oSortOptionData) { 
                sDefaultSortItemKey = oSortOptionData.sortItem;
                //update our values in UI model to match saved p13n values
                this.getModel("UtilsModel").setProperty("/PCalendarSortUIModel/Descending", oSortOptionData.sortDescending);
                this.getModel("UtilsModel").setProperty("/PCalendarSortUIModel/DefaultSortItemKey", oSortOptionData.sortItem);
            }
            // if we have p13n saved set it to the default option defined in the UI model
            else{
                sDefaultSortItemKey = this.getModel("UtilsModel").getProperty("/PCalendarSortUIModel/DefaultSortItemKey");
            }

            //array of sort items defined in the ui model
            aSortItems = this.getModel("UtilsModel").getProperty("/PCalendarSortUIModel/SortItems");        
            //loops through the model and sets selected to true, defines which item is selcted when we open the sort dialog
            for (var key in aSortItems) {
                if (aSortItems.hasOwnProperty(key)) {
                    if(aSortItems[key].key === sDefaultSortItemKey){
                            aSortItems[key].selected = true;
                            break;
                    }
                }
            }
        }.bind(this));
        
    };   

    ResourcePlanningCalendar.prototype.onSortCalendarPress = function(oEvent) {
        if (!this._oCalendarSort) {
            this._oCalendarSort = helpers.initializeFragmentFromObject({
                oParentController: this,
                sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.sortCalendarResources", //TODO update fragment file name to Xxxx like other files 
                sCreateId: this._sFragmentId + "--" + "sortCalendarResources",
                oModel: this.getModel("UtilsModel") //not ideal! we shouldnt pass model to controller! TODO figure out syntax for this binding!
            });
        }
        this._oCalendarSort.open();
    };

    ResourcePlanningCalendar.prototype.onPersonalizeCalendarPress = function() {
        var _sFragmentId = "";
        if (!this._oCalendarPers) {
            _sFragmentId = this.getId() + "--" + "CalendarPers";
            this._oCalendarPers = sap.ui.xmlfragment(_sFragmentId,
                "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.persCalendarResourcesView", this);
            this.addDependent(this._oCalendarPers);
        }
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this._oCalendarPers);
        this._oCalendarPers.open();
    };

    ResourcePlanningCalendar.prototype.onShowRowHeaders = function(oEvent) {
        var bPressed = oEvent.getParameter("pressed");
        oEvent.getSource().getParent().getParent().setShowRowHeaders(bPressed);
    };

    /**
     * Returns an array of Filter Params
     * 
     * @param {Array} Filter Items
     * @return {Array}
     * @private
     */
    ResourcePlanningCalendar.prototype._getFilterParamFromString = function(aFilterItems) {
        var aFilters = [];
        for (var i = 0; i < aFilterItems.length; i++) {
            if (aFilterItems[i].getParent().getKey() !== "AvailableResource") {
                var aSplitItem = aFilterItems[i].getKey().split("___");
                var aSplitPath = aSplitItem[0].split("/");
                aFilters.push({
                    operator: aSplitItem[1],
                    value1: aSplitItem[2],
                    value2: aSplitItem[3],
                    field: aSplitItem[4],
                    set: aSplitPath[0]
                });
            }
        }
        return aFilters;
    };

    /**
     * Retruns an array with the number of appointments in each row
     * 
     * @param {oEvent} Event object
     * @param {oEvent} Event object
     * @return {Array}
     * @private
     */

    ResourcePlanningCalendar.prototype._getNumberOfAppointmentsPerRow = function(aResourceList, sSet) {
            var aNumberOfAppointments = [];
            var iAppointmentPerResource = 0;
            //Loop through each resource
            for (var i = 0; i < aResourceList.length; i++) {
                iAppointmentPerResource = this.getNumOfApptsExcludingPublicHols(aResourceList[i][sSet]);
                aNumberOfAppointments.push(iAppointmentPerResource);
            }
            return aNumberOfAppointments;
        };

    /**
     * Crates an Array of filters from string params
     * 
     * @param {Object} Filter Object
     * @param {int} Max number of filters
     * @param {Array} Array to return
     * @return {Array}
     * @private
     */
    ResourcePlanningCalendar.prototype._createFilters = function(oFilterItem, iMaxFiltersPerRow, aFilters) {
        for (var i = 0; i < iMaxFiltersPerRow; i++) {
            var sCombinedPath = oFilterItem.set + "/results/" + i.toString() + oFilterItem.field;
            aFilters.push(new Filter(
                sCombinedPath, oFilterItem.operator, oFilterItem.value1, oFilterItem.value2
            ));
        }
        return aFilters;
    };

    /**
     * Creates an Array of unique strings for the visible calendar days
     * 
     * @param {Array} Array 
     * @param {Array} Number of days in the PlanningCalendar
     * @param {Object} Calendar start date
     * @param {boolean} Exclude weekends 
     * @return {Array} Has open days
     * @private
     */
    ResourcePlanningCalendar.prototype._getDaysCoveredByRange = function(oStartDate, iDays, bRemoveWeekend) {
        var aDaysInCalendar = [];
        var iWeekEnd = 4;
        var oDate, sDay;
        for (var i = 0; i < iDays; i++) {
            oDate = new Date(oStartDate.getFullYear(), oStartDate.getMonth(), (oStartDate.getDate() + i));
            sDay = oDate.getMonth().toString() + "." + oDate.getDate().toString();
            if (aDaysInCalendar.indexOf(sDay) < 0) {
                aDaysInCalendar.push(sDay);
            }
            if (bRemoveWeekend && (i === iWeekEnd)) {
                i += 2;
                iWeekEnd += 7;
            }
        }
        return aDaysInCalendar;
    };

    /**
     * Gets the date ranage covered by calendar
     * 
     * @return {Array}
     * @public
     */
    ResourcePlanningCalendar.prototype.getDateRangeOfCalendar = function() {
        var oFragment = this.getFragment();
        var oStartDate = oFragment.getStartDate();
        var iCalendarViewInterval = this._getCalendarView().getIntervalsM();
        var oEndDate = new Date(oStartDate.getFullYear(), oStartDate.getMonth(), (oStartDate.getDate() + iCalendarViewInterval), 0, 0, -1);
        return [oStartDate, oEndDate];
    };

    /**
     * Gets the current calendar view
     * 
     * @return {Object}
     * @public sap.ui.
     */
    ResourcePlanningCalendar.prototype._getCalendarView = function() {
        var oFragment = this.getFragment();
        var sViewKey = oFragment.getViewKey();
        var aViews = oFragment.getViews();
        for (var i = 0; i < aViews.length; i++) {
            if (aViews[i].getProperty("key") === sViewKey) {
                return aViews[i];
            }
        }
    };

    /**
     * Checks if the array of applicable days from the calendar   
     * are covered by the days which occur in the individual appointments
     * 
     * @param {Array} Array of Appointmemts
     * @param {Array} Array of dates which are valid for filter
     * @param {Object} Calendar start date
     * @param {int} Number of days in the PlanningCalendar* 
     * @return {boolean} Has open days
     * @private
     */
    ResourcePlanningCalendar.prototype._resourceHasOpenDays = function(aAppointments, aApplicableDates, iInterval) {
        var aCalendarDateRange = this.getDateRangeOfCalendar(); //this.getCalInterval(oCalStartDate, iInterval);
        var aDaysCoveredByAppointments = [];
        var bAppointmentConsumesCapacity;
        var oStartDate, oEndDate, iDaysInRange, bHasOpenDays, aDaysInAppointment;
        var sAppType = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/PublicHoliday");
        //Filters the applicable days against the unique days across the Appointment(s)
        var fnFilterApplicableDays = function(item) {
            var aDays = aDaysCoveredByAppointments;
            return !(aDays.indexOf(item) > -1);
        };
        // Number of days covered by the date range
        var fnGetNumberOfDaysInRange = function(first, second) {
            return Math.ceil((second - first) / (1000 * 60 * 60 * 24));
        };

        for (var i = 0; i < aAppointments.length; i++) {
            //we want a public holiday to behave as if it consumes capacity for "open days" filter (1 bh and 4 staffed days = no open days)
            bAppointmentConsumesCapacity = aAppointments[i].SHPName === sAppType ? true : this.checkIfAppointmentConsumesCapacity(aAppointments[i]);
            // If the Appointment start date is before Calendar Start date use Calendar Start date
            oStartDate = aAppointments[i].BegDate >= aCalendarDateRange[0] ? aAppointments[i].BegDate : aCalendarDateRange[0];
            // If the Appointment end date is after Calendar End date use Calendar end date
            oEndDate = aCalendarDateRange[1] > aAppointments[i].EndDate ? aAppointments[i].EndDate : aCalendarDateRange[1];
            // Number of days covered by appointment
            iDaysInRange = fnGetNumberOfDaysInRange(oStartDate, oEndDate);
            //List of days covered by an appointment
            aDaysInAppointment = this._getDaysCoveredByRange(oStartDate, iDaysInRange, false);

            // If current appointment covers from Monday to last Friday of range: no open days. (current app must also consume capacity!)
            if (oStartDate.getDay() === 1 && iDaysInRange >= (iInterval - 2) && bAppointmentConsumesCapacity )  {
                bHasOpenDays = false;
                return bHasOpenDays;
            }
            //only if the appointment consumes capacity should we "block/cover the days"
            if(bAppointmentConsumesCapacity){
                // Push the new occurances of a date on to aDaysInAppointment
                for (var j = 0; j < aDaysInAppointment.length; j++) {
                    if (aDaysCoveredByAppointments.indexOf(aDaysInAppointment[j]) < 0) {
                        aDaysCoveredByAppointments.push(aDaysInAppointment[j]);
                    }
                }
            }
        }
        // If the applicable Dates is filtered to 0 then there are no open days
        bHasOpenDays = aApplicableDates.filter(fnFilterApplicableDays).length !== 0;
        return bHasOpenDays;
    };

    /**
     * Handles the Frontend Filter Conditons
     * 
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.handleConfirm = function(oEvent) {
        var aFilterItems = oEvent.getParameter("filterItems");
        var oFilterKeys = oEvent.getParameter("filterKeys");
        var oFilterCompounds = oEvent.getParameter("filterCompoundKeys");
        var oBinding = this._oPlanningCalendar.getBinding("rows");
        var aAppPerRow = this._getNumberOfAppointmentsPerRow(oBinding.oList, "RPTASTDataSet");
        var aFilters = [];
        var aFilterParams, iMaxFiltersPerRow, oSubmitFilter, iNumberOfCalendarDays, aApplicableDates, oCalendarStartDate;
        var fnOpenDays, fnNoAppointments;
        if (Object.keys(oFilterKeys).length === 0 || oBinding.length === 0) {
            this.onReset();
            return;
        }
        var sAbsencePcCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/AbsenceFromPC");

        // TimeAllocation Filters || Location Filters
        if (oFilterCompounds.TA || oFilterCompounds.LOC) {
            aFilterParams = this._getFilterParamFromString(aFilterItems);
            iMaxFiltersPerRow = aAppPerRow ? Math.max.apply(Math, aAppPerRow) : 0;

            for (var i = 0; i < aFilterParams.length; i++) {
                //we now have 2 different absence types in the project, but we will only have 1 "absence" filter type
                //if we have absence filter selected we want to create another filter to pick up the 2nd absence types
                if(aFilterParams[i].value1 === sAbsencePcCode){
                    this.createSiblingAbsenceFilter(aFilterParams, aFilterParams[i]);
                }
                this._createFilters(aFilterParams[i], iMaxFiltersPerRow, aFilters);
            }
        }

        if (oFilterCompounds.STA) {
            aFilterParams = this._getFilterParamFromString(aFilterItems);
            aFilters.push(new Filter(
                "Staffer", aFilterParams[0].operator, aFilterParams[0].value1, aFilterParams[0].value2
            ));
        }

        // Availability Filters - No Allocations
        if (oFilterCompounds.AVL && Object.keys(oFilterCompounds.AVL)[0] === "0") {
            // Number of appointments is 0
            fnNoAppointments = function(oAppointments) {
                var iNumAppointmentsPerResource = this.getNumOfApptsExcludingPublicHols(oAppointments);
                return iNumAppointmentsPerResource === 0;
            }.bind(this);

            if ((aAppPerRow.indexOf(0) > -1)) {
                aFilters.push(new Filter("RPTASTDataSet", fnNoAppointments));
            }
        }
        // Availability Filters - Open Days
        if (oFilterCompounds.AVL && Object.keys(oFilterCompounds.AVL)[0] === "1") {
            // Filters if resource has appointment(s) which cover the applicable dates
            fnOpenDays = function(aResources) {
                var that = resourcePlanningCalendarComponentInstance;
                return that._resourceHasOpenDays(aResources.results, aApplicableDates, iNumberOfCalendarDays);
            };

            iNumberOfCalendarDays = this._getCalendarView().getIntervalsM();
            oCalendarStartDate = this._oPlanningCalendar.getStartDate();
            aApplicableDates = this._getDaysCoveredByRange(oCalendarStartDate, iNumberOfCalendarDays, true);

            aFilters.push(new Filter("RPTASTDataSet", fnOpenDays));
        }
        oSubmitFilter = new Filter({
            filters: aFilters,
            and: false
        });
        oBinding.filter(oSubmitFilter);
    };


    ResourcePlanningCalendar.prototype.checkIfAppointmentConsumesCapacity = function(oAppointment) {
        var sPublicHolidayCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/PublicHoliday");
        var sOfficeBlockedCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/OfficeBlocked");
        var sTentativeServiceCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/TentativeService");
        var sRemoteOnlyCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/RemoteOnly");
        var sRealTimeEnterpriseCode = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/RealTimeExpertise");

        var sAppType = oAppointment.SHPName;

        // returns true if app type doesnt match any of the above code e.g the appointment DOES consume capacity
        return sAppType !== sPublicHolidayCode && sAppType !== sOfficeBlockedCode && sAppType !== sTentativeServiceCode && sAppType !== sRemoteOnlyCode && sAppType !== sRealTimeEnterpriseCode;
    };

    ResourcePlanningCalendar.prototype.getNumOfApptsExcludingPublicHols = function(oAppointments) {
        var iNumAppointmentsPerResource = 0;

        if (oAppointments.results) {
            //loop through each appointment in the array
            for (var i = 0; i < oAppointments.results.length; i++) {
                if(this.checkIfAppointmentConsumesCapacity(oAppointments.results[i])){
                    iNumAppointmentsPerResource++;
                }
            }
        }
        return iNumAppointmentsPerResource;
    };

    //Method for duplication absence filterparam object to accomodate new absence app type
    //creates the new filter by deep copy of existing filter pushes it to the existing filters array
    ResourcePlanningCalendar.prototype.createSiblingAbsenceFilter = function(aFilters ,  aFilterParam) {
        var oTempFilterParam = JSON.parse(JSON.stringify(aFilterParam));
        oTempFilterParam.value1 = this.getModel("UtilsModel").getProperty("/TimeAllocationCodes/AbsenceFromIPP");
        aFilters.push(oTempFilterParam);
    };

    ResourcePlanningCalendar.prototype.onReset = function() {
        // resetting the value of Combobox and initial state of the table
        var oBinding = this._oPlanningCalendar.getBinding("rows");
        oBinding.filter([]);

    };
    //when we confirm sort selection, sort table and update p13n settings
    ResourcePlanningCalendar.prototype.onSortResources = function(oEvent) {
        var mParams = oEvent.getParameters(),
            sSortItemKey = mParams.sortItem.getKey(),
            bDescending = mParams.sortDescending;

        this.sortPlanningCalendar(sSortItemKey, bDescending);
        this._oComponent.updateP13n("_calSortP13n", {sortItem: sSortItemKey, sortDescending: bDescending});

    };
    //sorts the planning calendar given a key and descending value
    ResourcePlanningCalendar.prototype.sortPlanningCalendar = function(sSortItemKey, bDescending) {
        var oPlanningCalendarRowBinding = this._oPlanningCalendar.getBinding("rows"),
            oSorter = new sap.ui.model.Sorter(sSortItemKey, bDescending);

        this._handleModelOperationsInClient(oPlanningCalendarRowBinding, true);
        oPlanningCalendarRowBinding.sort(oSorter);
        this._handleModelOperationsInClient(oPlanningCalendarRowBinding, false);
    };

    ResourcePlanningCalendar.prototype._handleModelOperationsInClient = function(oDataModel, bPerformInClient) {
        if (bPerformInClient) {
            oDataModel.bClientOperation = true;
            oDataModel.aAllKeys = true;
            oDataModel.sOperationMode = "Client";
        } else {
            oDataModel.bClientOperation = false;
            oDataModel.aAllKeys = null;
            oDataModel.sOperationMode = "Server";
        }
    };

    ResourcePlanningCalendar.prototype.onBeforeOpenPers = function(oEvent) {
        var oEmpIDCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "EmpId"),
            oCountryCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "COUNTRY"),
            oOrgTxtCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "OrgTxt"),
            oOrgIDCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "OrgId");

            oEmpIDCheckbox.setSelected(this.getModel("p13nModel").oData.calPersKey.empId);
            oCountryCheckbox.setSelected(this.getModel("p13nModel").oData.calPersKey.country);
            oOrgTxtCheckbox.setSelected(this.getModel("p13nModel").oData.calPersKey.orgTxt);
            oOrgIDCheckbox.setSelected(this.getModel("p13nModel").oData.calPersKey.orgId);
    };

    ResourcePlanningCalendar.prototype.onSetResourcePers = function(oEvent) {
    	var bEmpIDCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "EmpId").getSelected(),
            bCountryCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "COUNTRY").getSelected(),
            bOrgTxtCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "OrgTxt").getSelected(),
            bOrgIDCheckbox = sap.ui.core.Fragment.byId(this._oPlanningCalendar.getParent().getId() + "--CalendarPers", "OrgId").getSelected(),
            oRowBinding = this._oPlanningCalendar.getRows()[0].clone();

        if (bEmpIDCheckbox) {
            oRowBinding.bindProperty("title", {parts: [{path: "resourceModel>FullName"}, {path: "resourceModel>EmpId"}], formatter: function(sFullName, sEmpId){return sFullName + " - " + sEmpId;}});
        }
        else {
            oRowBinding.bindProperty("title", "resourceModel>FullName");
        }
        //All 3 selected
        if (bCountryCheckbox && bOrgTxtCheckbox && bOrgIDCheckbox) {
            oRowBinding.bindProperty("text", {parts: [{path: "resourceModel>COUNTRY"}, {path: "resourceModel>OrgTxt"}, {path: "resourceModel>OrgId"}], formatter: function(sCountry, sOrgId, sOrgTxt){return sCountry + ", " + sOrgId + " - " + sOrgTxt;}});
        }
        //Country & OrgTxt selected
        else if (bCountryCheckbox && bOrgTxtCheckbox && !bOrgIDCheckbox) {
            oRowBinding.bindProperty("text", {parts: [{path: "resourceModel>COUNTRY"}, {path: "resourceModel>OrgTxt"}], formatter: function(sCountry, sOrgTxt){return sCountry + ", " + sOrgTxt;}});
        }
        //Country & OrgId selected
        else if (bCountryCheckbox  && bOrgIDCheckbox && !bOrgTxtCheckbox) {
            oRowBinding.bindProperty("text", {parts: [{path: "resourceModel>COUNTRY"}, {path: "resourceModel>OrgId"}], formatter: function(sCountry, sOrgId){return sCountry + ", " + sOrgId;}});
        }
        //OrgTxt & OrgId selected
        else if (bOrgTxtCheckbox && bOrgIDCheckbox && !bCountryCheckbox ) {
            oRowBinding.bindProperty("text", {parts: [{path: "resourceModel>OrgId"}, {path: "resourceModel>OrgTxt"}], formatter: function(sOrgId, sOrgTxt){return sOrgId + " - " + sOrgTxt;}});
        }
        //Only country selected
        else if (bCountryCheckbox  && !bOrgIDCheckbox && !bOrgTxtCheckbox) {
            oRowBinding.bindProperty("text", "resourceModel>COUNTRY");
        }
        //Only OrgId selected
        else if (bOrgIDCheckbox && !bCountryCheckbox && !bOrgTxtCheckbox ) {
            oRowBinding.bindProperty("text", "resourceModel>OrgId");
        }
        //Only OrgTxt selected
        else if (!bCountryCheckbox && bOrgTxtCheckbox && !bOrgIDCheckbox) {
            oRowBinding.bindProperty("text", "resourceModel>OrgTxt");
        }
        else{
            oRowBinding.bindProperty("text", "");
        }

        this._oPlanningCalendar.bindAggregation("rows", {path: "resourceModel>/", template: oRowBinding});
        
        //save the p13n settings 
        this._oComponent.updateP13n("_calPersP13n", {empId: bEmpIDCheckbox, country: bCountryCheckbox, orgTxt: bOrgTxtCheckbox, orgId: bOrgIDCheckbox});
        this.getModel("p13nModel").setProperty("/calPersKey", {empId: bEmpIDCheckbox, country: bCountryCheckbox, orgTxt: bOrgTxtCheckbox, orgId: bOrgIDCheckbox});

        //defining  vars here because function is so long
        //get sort values from UI model, this model has been syncronised with P13n is the preparemodel function in oninit
        var bDescending = this.getModel("UtilsModel").getProperty("/PCalendarSortUIModel/Descending");
        var sSortItemKey = this.getModel("UtilsModel").getProperty("/PCalendarSortUIModel/DefaultSortItemKey");
        
        //the binding resets the sort so we must apply sort again
        this.sortPlanningCalendar(sSortItemKey, bDescending);
        oEvent.getSource().getParent().close();
        
        sap.git.usage.MobileUsageReporting.postEvent("Personal Calendar - p13n settings updated", this._oComponent);
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {object}
     * @public
     */
    ResourcePlanningCalendar.prototype.onEnterFullScreen = function(oEvent) {
        //TODO: Better create a component event and fire it in this method
        var oParentController = helpers.getParentController(this.getParent());

        if (oParentController && oParentController.onEnterFullScreen) {
            oParentController.onEnterFullScreen(oEvent);
        }
    };

    /**
     *
     *
     * @param {oEvent} Event object
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onCloseDialog = function(oEvent) {
        oEvent.getSource().getParent().close();
    };

    /**
     *  Create a new allocation
     *
     * @param {sap.ui.model.odata.v2.ODataModel} oModel Model where to trigger the create
     * @param {Object} oAllocation Allocation to be created
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.createTimeAllocation = function(oModel, oAllocation) {
        dataManagerNew.createTimeAllocation(oModel, oAllocation, this.onCreateTimeAllocationSuccess);
    };

    /**
     *  Success callback for creating a new allocation
     *
     * @param {Object} oData The data included in the response
     * @param {Object} oResponse The response of the server
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onCreateTimeAllocationSuccess = function(oData, oResponse) {
        var that = resourcePlanningCalendarComponentInstance;

        that.fireAllocationCreated({
            allocation: oData
        });

        sap.m.MessageToast.show(i18n.getText("COMPONENT_RESOURCE_PLANNING_CALENDAR_ALLOCATION_CREATE_SUCCESS"));
    };

    /**
     *  Read the resources to be displayed in the planning calendar
     *
     * @param {Array} sFilters The filters to be applied
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.readResources = function(aFilters) {
        var oFragment = this.getFragment(),
            oModel = oFragment.getModel();

        oFragment.setBusy(true);
        dataManagerNew.readResource(oModel, aFilters, this.onReadResourceSuccess, this.onReadResourceFail);
    };

    /**
     * Success callback for reading resources
     *
     * @param {Object} oData The data included in the response
     * @param {Object} oResponse The response of the server
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onReadResourceSuccess = function(oData) {
        var that = resourcePlanningCalendarComponentInstance,
            oFragment = that.getFragment();

        if (oData.results.length > 0) {
            var aCWData = that.oUIModel.getProperty("/CalendarWeek");

            oData.results[0].CWData = {
                "results": aCWData
            };

            oFragment.getModel("resourceModel").setData(oData.results);
        } else {
            sap.m.MessageToast.show(i18n.getText("COMPONENT_RESOURCE_PLANNING_CALENDAR_RESOURCES_READ_EMPTY"));
        }
        oFragment.setBusy(false);
    };

    /**
     * Fail callback for reading resources
     *
     * @param {Object} oResponse The response of the server
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.onReadResourceFail = function() {
        var that = resourcePlanningCalendarComponentInstance,
            oFragment = that.getFragment();

        oFragment.setBusy(false);

        MessageBox.error(i18n.getText("MANAGEVARIANTS_DIALOG_SERVICE_ERROR"), {
            title: i18n.getText("MANAGEVARIANTS_DIALOG_SERVICE_ERROR_TITLE"),
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function(oAction) {
                    if (oAction === "OK") {
                        window.history.go(-1);
                    }
                }.bind(that),
                styleClass: "",
                initialFocus: null,
                textDirection: sap.ui.core.TextDirection.Inherit
        });
    };

    /**
     * Update the interval date of the planning calendar
     *
     * @param {Date} dStartIntervalDate Start date
     * @param {Date} dEndIntervalDate End date
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype.setDateRange = function(dStartIntervalDate, dEndIntervalDate) {
        var iIntervalDuration = new Date(dEndIntervalDate - dStartIntervalDate).getDate() / 7 + new Date(dEndIntervalDate - dStartIntervalDate).getMonth() * 4,
            iCurrentCW,
            oCWLableModel,
            dCWLableDateStart,
            dCWLableDateEnd,
            iDurationInDays,
            aCWs = [];

        for (var i = 0; i < iIntervalDuration; i++) {
            iDurationInDays = i * 7;

            dCWLableDateStart = new Date(dStartIntervalDate.getFullYear(), dStartIntervalDate.getMonth(), (dStartIntervalDate.getDate() + iDurationInDays), 0, 0, 0);
            dCWLableDateEnd = new Date(dStartIntervalDate.getFullYear(), dStartIntervalDate.getMonth(), (dStartIntervalDate.getDate() + iDurationInDays + 7), 0, 0, 0);
            iCurrentCW = oCalendarHelper.getCWFromDate(dCWLableDateStart);

            oCWLableModel = {
                title: "CW " + iCurrentCW,
                begin: dCWLableDateStart,
                end: dCWLableDateEnd
            };
            aCWs.push(oCWLableModel);
        }

        this.oUIModel.setProperty("/CalendarWeek", aCWs);
    };

    /**
     * Fire assignmentDeleted event of component
     *
     * @param {string} sItemGuid - id of resource demand/assignment that was deleted
     * @return {void}
     * @public
     */
    ResourcePlanningCalendar.prototype._handleAssignmentDelete = function(sItemGuid) {
        this.fireAssignmentDeleted({
            itemGuid: sItemGuid
        });
    };
    ResourcePlanningCalendar.prototype._TimezoneSettingsDialog = function(that){
      //  TimeZoneSettings._getUserTimeZone(this);
    //  var oTimezones = this.getModel("TimeZone").getData();
        if (!this._oTimeZoneSelect) {
            this._oTimeZoneSelect = sap.ui.xmlfragment(
                "sap.coe.capacity.reuselib.controls.TimeZoneSelect.TimeZoneSelect", this);
            that.oView.addDependent(this._oTimeZoneSelect);
        }
        jQuery.sap.syncStyleClass("sapUiSizeCompact", that.oView, this._oTimeZoneSelect);
        this._oTimeZoneSelect.setTitle(i18n.getText("FRAGMENT_SELECT_TIMEZONE_TITLE"));
       // this._oTimeZoneSelect.open();
    };
    ResourcePlanningCalendar.prototype._showSettingsDialog = function(){
        this._oTimeZoneSelect.open();
    };
    ResourcePlanningCalendar.prototype.handleClose = function (oEvent) {
        var that = this,
            sPath = oEvent.getParameter("selectedContexts")[0].sPath,
            sValue = oEvent.getSource().getModel("TimeZone").getProperty(sPath).key,
            oRequestBody = {
                "Timezone": sValue
            };
            resourcePlanningCalendarComponentInstance.getModel().update("/ResTimeZoneSet('')", oRequestBody, {
            success: function (oData, response) {
                that._oTimeZoneSelect.getModel("TimeZone").setProperty("/SelectedTimeZone", sValue);
                resourcePlanningCalendarComponentInstance.getModel("TimeZone").setProperty("/SelectedTimeZone", sValue);
            }
        });
    };
    ResourcePlanningCalendar.prototype.handleSearch = function (oEvent) {
        var sValue = oEvent.getParameter("value"),
            oFilter = new Filter("text", sap.ui.model.FilterOperator.Contains, sValue),
            oBinding = oEvent.getSource().getBinding("items");

        oBinding.filter([oFilter]);
    };
    ResourcePlanningCalendar.prototype._setTimeZoneModelToView = function (that, sComponent) {
        that.getView().setModel(
            new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath(sComponent) + "/model/TimeZoneModel.json"),
            "TimeZone");
    };
    ResourcePlanningCalendar.prototype._getUserTimeZone = function (that) {
        that.oView.getModel().read("/ResTimeZoneSet('')", {
            success: function (oData, response) {
                that.oView.getModel("TimeZone").setProperty("/SelectedTimeZone", oData.Timezone);
            }
        });
    };
    return ResourcePlanningCalendar;

});

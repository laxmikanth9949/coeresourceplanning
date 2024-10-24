sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/utils/CalendarHelper",
    "sap/coe/rpa/util/formatter",
    "sap/coe/capacity/reuselib/utils/DataManager",
    "sap/m/MessageBox",
    "sap/coe/rpa/util/helpers",
    "sap/coe/rpa/util/i18n",
    "sap/coe/rpa/fragment/popover/ActionSheet.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/EditServiceOrder.fragment.controller",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/fragment/HandleTimeAllocation.fragment.controller",
    "sap/coe/capacity/reuselib/utils/P13nHelper"
], function(Controller, CalendarHelper, formatter, DataManager, MessageBox, helpers, i18n, ActionSheetController, EditServiceOrder, HandleTimeAllocation, P13nHelper) {
    "use strict";

    var oController;

    return Controller.extend("sap.coe.rpa.view.MyStaffing", {
        _oCatalog: null,
        _oResourceBundle: null,
        formatter: formatter,

        onInit: function() {
            oController = this;
            this._oView = this.getView();
            this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView()));
            this._oRouter = this._oComponent.getRouter();
            this._oRouter.getRoute("myStaffing").attachMatched(this._handleRouteMatched, this);
            this._oPlanningCalendar = this.byId("resourcePlanningCalendarId").getFragment();
            //To Remove CWModel from here
            this.oCWModel = new sap.ui.model.json.JSONModel();
            this._oView.setModel(this.oCWModel, "CWModel");
            this._oTimeAllocationsTable = this.byId("timeAllocationsTable");
            this._setUtilsModelToView();
        },

        onAfterRendering: function(){
            helpers.checkAuthorization("calendar", this.getView(), this._oComponent);
        },

        _setUtilsModelToView: function() {
            this._oView.setModel(
                new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/model/utilsModel.json"),
                "ReuseModel");
        },

        _getFilters: function(that) {
            var aFilters = [
                new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, that._oBegDate),
                new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, that._oEndDate),
                new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, that._sUser)
            ];
            return aFilters;
        },

        _handleRouteMatched: function(oEvent) {
            this._readP13n();
        },

        readData: function() {
            DataManager.onRead(this, this.aFilters);
        },

        getPublicHolidays: function() {
            DataManager.getPublicHolidays(this, this.aFilters);
        },

        onAllocationCreated: function(oEvent) {
            var that = oController,
                oPlanningCalendarComponent = that.byId("resourcePlanningCalendarId"),
                aFilters = [];

            aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, that._oBegDate));
            aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, that._oEndDate));
            aFilters.push(new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, that._sUser));

            oPlanningCalendarComponent.readResources(aFilters);
            
            sap.git.usage.MobileUsageReporting.postEvent("Personal Calendar - Allocation Created", that.getOwnerComponent());
        },

        onBeforeRendering: function() {
            var aCalendarInterval,
                oUserContexModel;

            this._oPlanningCalendar._oTodayButton.setVisible(false);

            oUserContexModel = this._oView.getModel("praUserContext");
            this._sUser = oUserContexModel.getProperty("/EmpId");

            aCalendarInterval = CalendarHelper.getCalInterval(this._oPlanningCalendar.getStartDate(), 7);
            this._oBegDate = aCalendarInterval[0];
            this._oEndDate = aCalendarInterval[1];

            if (this._sUser) {
                this.aFilters = this._getFilters(this);
                this.readData();
                this.getPublicHolidays();
            } else {
                oUserContexModel.attachPropertyChange(this.setUser);
            }
        },
        doCreateServiceArrangement: function(){
            DataManager.createServiceArrangement(this.getView().getModel(), this._sUser);
        },
        displayNoServiceArrangementMsgBox: function(){
            MessageBox.warning( i18n.getText("MESSAGEBOX_SERV_ARRANGE_WARNING_MSG"), {
                title: i18n.getText("MESSAGEBOX_SERV_ARRANGE_WARNING_TITLE"),
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) {
                    if (oAction === "YES") {
                        this.doCreateServiceArrangement();
                    }
                }.bind(this),
                styleClass: "",
                initialFocus: null,
                textDirection: sap.ui.core.TextDirection.Inherit
            });
        },

        doServiceArrangementCheck: function() {
            DataManager.checkServiceArrangementValid(this, this.getView().getModel(), this._sUser);
        },

        setUser: function(oEvent) {
            var that = oController;
            that._sUser = that._oComponent.getModel("praUserContext").getProperty("/EmpId");
            if (that._sUser) {
                that.aFilters = that._getFilters(that);
                that.readData();
                that.getPublicHolidays();
                that.doServiceArrangementCheck();
            }
        },

        /**
         * Navigates to the Team Calendar view
         * @function
         * @return {void}
         */
        onNavTeamCalendar: function() {
            this._oRouter.navTo("teamCalendar", {}, false);
        },

        openEditDialog: function(oEvent) {
            var that = oController,
                sContextPath = that._oTimeAllocationsTable.getSelectedItems()[0].getBindingContextPath(),
                oResource = that.getView().getModel("resourceModel").getProperty(sContextPath);

            switch (oResource.Type) {
                case "ASG":
                    that._onOpenEditAssigment(oResource);
                    break;
                case "TAL":
                    that._onOpenEditTimeAllocation(oResource, true, { EmpId: oResource.EmpId, FullName: oResource.ConsultantName });
                    break;
                default:
                    return;
            }

        },

        /**
         * Links to SO line item in CRM
         * @function
         * @param {object} oEvent - event that called the function
         * @return {void}
         */
        onItemDescriptionLinkPress: function(oEvent) {
            var oPopoverContext = oEvent.getSource().getBindingContext("resourceModel"),
                oData = this.oView.getModel("resourceModel").getProperty(oPopoverContext.sPath),
                sBaseURL = this.oView.getModel("praUserContext").getProperty("/BaseURLCRM"),
                sLinkPrefixToCRMItem = sBaseURL + "sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&sap-client=001&sap-language=EN&crm-object-type=ZSU_TBUI4&crm-object-action=B&crm-object-value=";

            window.open(sLinkPrefixToCRMItem + oData.HeaderGuid);
        },  

        _onOpenEditAssigment: function(oResource) {
            var that = oController;

            if (!that._editServiceOrder) {
                that._editServiceOrder = helpers.initializeFragmentFromObject({
                    oParentController: that,
                    sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.EditServiceOrder",
                    ControllerClass: EditServiceOrder,
                    sCreateId: that.createId("EditServiceOrder")
                });
                that._editServiceOrder.setModel(new sap.ui.model.json.JSONModel([{}]), "EditSelectedOrderDialogModel");
            }
            oResource.StartTime = new Date(oResource.BegDate);
            oResource.EndTime = new Date(oResource.EndDate);
            that._editServiceOrder.getModel("EditSelectedOrderDialogModel").setProperty("/", [oResource]);
            that._editServiceOrder.open();
        },

        _onOpenEditTimeAllocation: function(oSelectedItem, bEditMode, oSelectedUser) {
            var that = oController,
                oAllocationData;

            if (!that._oHandleTimeAllocation) {
                that._oHandleTimeAllocation = helpers.initializeFragmentFromObject({
                    oParentController: that,
                    sFragment: "sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.CreateAllocation",
                    ControllerClass: HandleTimeAllocation,
                    sCreateId: that.createId("CreateAllocation")
                });

                that._oHandleTimeAllocation.setModel(new sap.ui.model.json.JSONModel({ sFragmentId: that.createId("CreateAllocation") }), "CreateAllocation");
            }

            oAllocationData = that._oHandleTimeAllocation.getModel("CreateAllocation").getProperty("/");
            oAllocationData.EmpID = oSelectedUser.EmpId;
            oAllocationData.FullName = oSelectedUser.FullName;
            oAllocationData.EditMode = bEditMode;
            oAllocationData.oSelectedItem = oSelectedItem;
            that._oHandleTimeAllocation.open();
        },

        onCloseDialog: function(oEvent) {
            oEvent.getSource().getParent().close();
        },

        onLineItemPress: function(oEvent) {
            var oContextPath = this._oTimeAllocationsTable.getSelectedItems()[0].getBindingContextPath(),
                sType = this.getView().getModel("resourceModel").getProperty(oContextPath).Type,
                bIsEditable = sType === "TAL";
            if (this._oTimeAllocationsTable.getSelectedItems().length > 0 && bIsEditable) {
                this.byId("idForBttnAllocationEdit").setEnabled(true);
                this.byId("idForBttnAllocationDelete").setEnabled(true);
            } else {
                this.byId("idForBttnAllocationEdit").setEnabled(false);
                this.byId("idForBttnAllocationDelete").setEnabled(false);
            }
        },

        onActionSheetPress: function(oEvent) {
            var oActionButton = oEvent.getSource();

            if (!this._actionSheet) {
                this._actionSheet = helpers.initializeFragment(this, "sap.coe.rpa.fragment.popover.ActionSheet", ActionSheetController);
            }
            this._actionSheet.openBy(oActionButton);
        },

        createTimeAllocation: function(oEvent) {
            var oCreateRequestBody = oEvent.getParameter("CreateRequestBody");
            DataManager.onCreateTimeAllocation(this, "/TimeAllocationList", oCreateRequestBody);
        },

        onTimeAllocationCategoryListChanged: function(oEvent) {
            this.byId("CreateAllocation--linkForISP").setEnabled(oEvent.getSource().getSelectedKey() === "ZVAC");
        },

        onEditTimeAllocation: function(oEvent) {
            var oModel = this.getView().getModel("resourceModel"),
                oContextPath = this._oTimeAllocationsTable.getSelectedItems()[0].getBindingContextPath(),
                oProperty = oModel.getProperty(oContextPath, null, true),
                oRowContext = this._oPlanningCalendar.getSelectedRows()[0].getBindingContext("resourceModel"),
                sResourceGuid = oModel.getProperty(oRowContext.sPath).ResGuid,
                oUpdateRequestBody = {
                    BegDate: oProperty.BegDate,
                    Begtimestamp: oProperty.BegDate,
                    EndDate: oProperty.EndDate,
                    Endtimestamp: oProperty.EndDate,
                    EmpID: oProperty.EmpId,
                    ID: oProperty.ID,
                    TimespecType: oProperty.SHPName,
                    Description: oProperty.ItemDescription,
                    ResourceGuid: sResourceGuid,
                    Changeable: true,
                    HrStatus: "",
                    HrStatusText: "Not HR Relevant",
                    IsAvailable: false,
                    Priority: 5,
                    Duration: 0
                };
            DataManager.onEditTimeAllocation(this, oProperty.ID, sResourceGuid, oUpdateRequestBody, this.getView().getModel());
        },

        deleteTimeAllocation: function() {
            var oModel = this.getView().getModel("resourceModel"),
                sAllocationPath = this._oTimeAllocationsTable.getSelectedItems()[0].getBindingContextPath(),
                sResourcePath = this._oPlanningCalendar.getSelectedRows()[0].getBindingContext("resourceModel").sPath,
                oAllocation = oModel.getProperty(sAllocationPath),
                oResource = oModel.getProperty(sResourcePath);

            switch (oAllocation.Type) {
                case "ASG":
                    this._onDeleteAssignment(oAllocation);
                    break;
                case "TAL":
                    this._onDeleteTimeAllocation(oAllocation, oResource.ResGuid);
                    break;
                default:
                    return;
            }
        },

        /**
         * Selects the first item in the time allocations table (if there are any)
         * @function
         * @return {void}
         */
        selectFirstTableItem: function() {
            var oFirstItem = this._oTimeAllocationsTable.getItems()[0];
            if (oFirstItem) {
                this._oTimeAllocationsTable.setSelectedItem(oFirstItem);
                this._oTimeAllocationsTable.fireSelectionChange();
            }
        },

        _onDeleteTimeAllocation: function(oAllocation, sResourceGuid) {
            var that = this;
            sap.m.MessageBox.confirm(this._getDeleteMsg(oAllocation), {
                onClose: function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        DataManager.onDeleteTimeAllocation(that, oAllocation.ID, sResourceGuid, that.getView().getModel());
                    }
                }
            });
        },

        _onDeleteAssignment: function(oAssignment) {
            var that = this;

            sap.m.MessageBox.confirm(this._getDeleteMsg(oAssignment), {
                onClose: function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        DataManager.onDeleteAssignment(that, oAssignment, that.getView().getModel());
                    }
                }
            });

        },

        /**
         * Creates the delete message for dialogs
         * @function
         * @param {object} oAllocation - the allocation type being deleted
         * @return {String} sText - the formatted delete message
         */
        _getDeleteMsg: function(oAllocation) {
            var sText = i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX_SELECTED") + " ";

            if (oAllocation.Type === "ASG") {
                sText += parseInt(oAllocation.DemandId, 10) + " - " + parseInt(oAllocation.ItemNo, 10) + ", " + oAllocation.SHPName;
            } else if (oAllocation.Type === "TAL") {
                sText += formatter.convertSubmissionStatus(oAllocation.SHPName);
            }

            sText += " " + i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX_FOR") + " " + formatter.getDisplayDateDayTime(oAllocation.BegDate) + " - " + formatter.getDisplayDateDayTime(oAllocation.EndDate) + ". ";

            sText += i18n.getText("FRAGMENT_DELETEALLOCATION_MESSAGEBOX");
            return sText;
        },

        onCalendarIntervalChange: function(oEvent) {
            CalendarHelper.onCalendarIntervalChange(oEvent, this);
        },

        /**
         * Changes the date range displayed in the calendar
         * @function
         * @param {object} oEvent - event that called the function
         * @return {void}
         */
        onStartDateChange: function(oEvent) {
            var aIntervalDates = oEvent.getParameter("intervalDates"),
                sViewKey = oEvent.getParameter("viewKey");

            this._oBegDate = aIntervalDates[0];
            this._oEndDate = aIntervalDates[1];

            if (this._sUser) {
                this.aFilters = this._getFilters(this);
                this.readData();
                this.getPublicHolidays();
            }

            this.byId("resourcePlanningCalendarId").setDateRange(aIntervalDates[0], aIntervalDates[1]);
            //To remove
            CalendarHelper.setCWsForFirstEmployee(oEvent, this);

            // Update p13n
            if (!oEvent.getParameter("preventP13Update")) {
                this.getOwnerComponent().updateP13n("_calViewP13n", sViewKey);
            }
        },

        /**
         * Check p13n client model for a value. If none present requests data from p13n service.
         * If no data returned viewChange event of calendar is fired to trigger data read with default view key.
         * If data return setViewKeyFromP13n method of component is called which updates view key property and fires viewChange
         *
         * @private
         * @returns {void}
         */
        _readP13n: function() {
            // check p13nModel for viewKey value
            var sViewKey = this.getOwnerComponent().getModel("p13nModel").getProperty("/viewKey"),
            bViewKey = P13nHelper.validateViewKey(sViewKey);
            // if valid use component setViewKeyFromP13n method to update calendar viewKey and trigger search
            if (bViewKey) {
                this.byId("resourcePlanningCalendarId").setViewKeyFromP13n(sViewKey);
            } else {
                // if no value read p13n from service, use fireViewChange event to trigger search with default value
                this._oPlanningCalendar.fireViewChange({bPreventP13Update: true});
            }
        }
    });

});

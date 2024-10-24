sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/utils/CalendarHelper",
    "sap/coe/capacity/reuselib/utils/DataManager",
    "sap/coe/capacity/reuselib/controls/CustomVariantManager/CustomVariantManagerComponent",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/model/Filter",
    "sap/coe/rpa/util/helpers",
    "sap/coe/rpa/fragment/popover/ActionSheet.fragment.controller",
    "sap/coe/capacity/reuselib/fragment/Organisation.fragment.controller",
    "sap/coe/capacity/reuselib/utils/VariantFilterHelper",
    "sap/coe/capacity/reuselib/utils/P13nHelper",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/ResourcePlanningCalendarComponent",
    "sap/coe/capacity/reuselib/utils/i18n"
], function(Controller, CalendarHelper, DataManager, CustomVariantManager, FilterBar, Filter, helpers, ActionSheetController, ServiceTeamController, VariantHelper, P13nHelper, ResourcePlanningCalendarComponent) {

    var oController;

    return Controller.extend("sap.coe.rpa.view.TeamCalendar", {
        _oCatalog: null,
        _oResourceBundle: null,
        VariantHelper: VariantHelper,
        bFilterBarInitialised: false,

        onInit: function() {
            oController = this;
            this._oView = this.getView();
            this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
            this._oRouter = this._oComponent.getRouter();
            this._oRouter.getRoute("teamCalendar").attachMatched(this._handleRouteMatched, this);
            this._oPlanningCalendar = this.byId("resourcePlanningCalendarId").getFragment();
            //To Remove CWModel from here
            this.oCWModel = new sap.ui.model.json.JSONModel();
            this._oView.setModel(this.oCWModel, "CWModel");
            this._setUtilsModelToView();
            VariantHelper.setVariantFilterModel(this._oView);
        },

        onAfterRendering: function() {
            this._oPlanningCalendar.getModel("resourceModel").setSizeLimit(500);
            helpers.checkAuthorization("calendar", this.getView(), this._oComponent);
        },

        onOpenResourceDemandList: function() {
            // var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"),
            //     sHash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternalAsync({
            //         target: {
            //             semanticObject: "planningcalendar",
            //             action: "Display"
            //         }
            //     })) || "";
            // oCrossAppNavigator.toExternal({
            //     target: {
            //         shellHash: sHash
            //     }
            // });

            if (window.parent) {
                window.parent.postMessage(
                    JSON.stringify({
                        type: 'request',
                        service: 'sap.ushell.services.CrossApplicationNavigation.toExternal',
                        body: {
                            oArgs: {
                                target: {
                                    semanticObject: "planningcalendar",
                                    action: "Display"
                                }
                            }
                        }
                    }),
                    '*'
                )
            }
        },

        _handleRouteMatched: function(oEvent) {
            this._readP13n();
            this._readp13nSortCal();
        },

        onStartDateChange: function(oEvent) {
            var aIntervalDates = oEvent.getParameter("intervalDates");
            var sViewKey = oEvent.getParameter("viewKey");
            var oFilterBar = this.byId("filterBar");
            var oDateRangeControl = this.byId("idDateRange");
            var bSearch = false;
            if (oDateRangeControl) {
                bSearch = oDateRangeControl.getDateValue() !== null;
                oDateRangeControl.setDateValue(aIntervalDates[0]);
                oDateRangeControl.setSecondDateValue(aIntervalDates[1]);
                if (bSearch && this._isOneFilterFieldsFilled()) {
                    oFilterBar.search();
                    this.getPublicHolidays(this._sUser, aIntervalDates[0], aIntervalDates[1]);
                }
            } else if (this._sUser) {
                this.readData(this._sUser, aIntervalDates[0], aIntervalDates[1], this.aVariantFilters);
            }
            this.byId("resourcePlanningCalendarId").setDateRange(aIntervalDates[0], aIntervalDates[1]);
            CalendarHelper.setCWsForFirstEmployee(oEvent, this);

            // Update p13n
            if (!oEvent.getParameter("preventP13Update")) {
                this.getOwnerComponent().updateP13n("_calViewP13n", sViewKey);
            }
        },

        onServiceTeamRequest: function(oEvent) {
            if (!this._oDialogOrganisationType) {
                this._oDialogOrganisationType = helpers.initializeFragmentFromObject({
                    oParentController: this,
                    sFragment: "sap.coe.capacity.reuselib.fragment.Organisation",
                    ControllerClass: ServiceTeamController,
                    sCreateId: this.getView().createId("idForOrganization")
                });
            }
            this._oDialogOrganisationType.sSourcefieldId = oEvent.getSource().getId().substring(this.getView().getId().length + 2);
            this._oDialogOrganisationType.setModel(helpers.copyModel(this.getView().getModel("VariantFilterModel")), "TempModel");
            this._oDialogOrganisationType.open();
        },

        createTimeAllocation: function(oEvent) {
            var oCreateRequestBody = oEvent.getParameter("CreateRequestBody");
            DataManager.onCreateTimeAllocation(this, "/TimeAllocationList", oCreateRequestBody);
        },

        onOrCheckBoxSelect: function() {
            this.oVariantFilterModel.setProperty("orCheckBox1", true);
        },

        _isOneFilterFieldsFilled: function() {
            var aInputFieldsFromReuse = ["idForOrgId", "idForQualificationid", "idForEmpId"],
                aInputFieldsFromTeamCalendar = ["idForServArea", "idServiceTeamForOrgId"],
                aInputField;

            for (var i = 0; i < aInputFieldsFromReuse.length; i++) {
                aInputField = this.byId(aInputFieldsFromReuse[i]).getDependents()[0];

                if (aInputField.getTokens().length > 0) {
                    return true;
                }
            }

            for (var j = 0; j < aInputFieldsFromTeamCalendar.length; j++) {
                aInputField = this.byId(aInputFieldsFromTeamCalendar[j]);

                if (aInputField.getTokens !== undefined && aInputField.getTokens().length > 0) {
                    return true;
                }

                if (aInputField.getSelectedItems !== undefined && aInputField.getSelectedItems().length > 0) {
                    return true;
                }
            }

            return false;
        },

        _setUtilsModelToView: function() {
            this._oView.setModel(
                new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("sap.coe.capacity.reuselib") + "/model/utilsModel.json"),
                "ReuseModel");
        },

        retrieveOrgUnit: function(oEvent) {
            var oFragment = oEvent.getParameter("oFragment");
            var orgUnit = "";
            var bNavBack = oEvent.getParameter("bNavBack");
            if (bNavBack) {
                orgUnit = this.oOrgNavigation[this.oOrgNavigation.length - 1].id;
            } else if (bNavBack === false) {
                var sSelectedPath = oEvent.getParameter("sSelectedPath");
                orgUnit = this._oView.getModel("OrgUnitModel").getProperty(sSelectedPath).OrgId;
                this.oOrgNavigation.pop();
            } else {
                orgUnit = this._oView.getModel("praUserContext").getProperty("/HigherUnt");
            }
            DataManager.getOrgUnit(this._sUser, orgUnit, oFragment, this);
        },

        readData: function(aFilters) {
            var aContent = this.byId("myStaffingPage").getAggregation("content");
            for (var i in aContent) {
                aContent[i].setBusy(true);
            }
            DataManager.onRead(this, aFilters);
        },

        getPublicHolidays: function(sUserId, oStartDate, oEndDate) {
            this.PHFilters = [
                new Filter("BegDate", sap.ui.model.FilterOperator.EQ, oStartDate),
                new Filter("EndDate", sap.ui.model.FilterOperator.EQ, oEndDate),
                new Filter("EmpId", sap.ui.model.FilterOperator.EQ, sUserId)
            ];
            DataManager.getPublicHolidays(this, this.PHFilters);
        },

        onBeforeRendering: function() {
            var aCalendarInterval = CalendarHelper.getCalInterval(this._oPlanningCalendar.getStartDate(), 7),
                oUserContexModel = this._oView.getModel("praUserContext");

            this._sUser = oUserContexModel.getProperty("/EmpId");

            if (!this.bFilterBarInitialised) {
                this.byId("filterBar").fireInitialise();
                this.bFilterBarInitialised = true;
            }

            if (!this._oCurrentDate && !this._oEndDate) {
                this._oCurrentDate = aCalendarInterval[0];
                this._oEndDate = aCalendarInterval[1];
            }

            if (this._sUser) {
                this.getPublicHolidays(this._sUser, this._oCurrentDate, this._oEndDate);

                // check if the current user is a staffer
                var aFilters = [],
                    that = this;

                aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, aCalendarInterval[0]));
                aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, aCalendarInterval[1]));
                aFilters.push(new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, this._sUser));

                this._oView.getModel().read("/ResourceList", {
                    urlParameters: {
                        "$expand": "RPTASTDataSet,QualificationSet"
                    },
                    filters: aFilters,
                    success: function(odata) {
                        if (odata.results.length > 0) {
                            if (odata.results[0].Staffer === "X") {
                                that._oPlanningCalendar.getModel("UIModel").setProperty("/staffingAuthorized", true);
                            }
                            else {
                                that._oPlanningCalendar.getModel("UIModel").setProperty("/staffingAuthorized", false);
                            }
                        }
                    }
                });
            } else {
                oUserContexModel.attachPropertyChange(this.setUser);
            }
        },

        setUser: function(oEvent) {
            var that = oController;
            that._sUser = that._oView.getModel("praUserContext").getProperty("/EmpId");
            if (that._sUser) {
                that.getPublicHolidays(that._sUser, that._oCurrentDate, that._oEndDate);

                // check if the current user is a staffer
                var aCalendarInterval = CalendarHelper.getCalInterval(that._oPlanningCalendar.getStartDate(), 7),
                    aFilters = [];

                aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, aCalendarInterval[0]));
                aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, aCalendarInterval[1]));
                aFilters.push(new sap.ui.model.Filter("EmpId", sap.ui.model.FilterOperator.EQ, that._sUser));

                that._oView.getModel().read("/ResourceList", {
                    urlParameters: {
                        "$expand": "RPTASTDataSet,QualificationSet"
                    },
                    filters: aFilters,
                    success: function(odata) {
                        if (odata.results.length > 0) {
                            if (odata.results[0].Staffer === "X") {
                                that._oPlanningCalendar.getModel("UIModel").setProperty("/staffingAuthorized", true);
                            }
                            else {
                                that._oPlanningCalendar.getModel("UIModel").setProperty("/staffingAuthorized", false);
                            }
                        }
                    }
                });
            }
        },

        onInitialiseFilterBar: function(oEvent) {
            var that = oController,
                oFilterBar = oEvent.getSource();

            if (oFilterBar.customVariantManager === undefined){
                oFilterBar.customVariantManager = new CustomVariantManager({
                    appId: "SAP.COE.RPAPilot03",
                    variantSet: "TEAM_CALPilot03",
                    defaultVariant: that.getDefaultVariant,
                    filterBar: oFilterBar,
                    parentControllerContext: this
                });
            }
        },

        getDefaultVariant: function() {
            var that = oController,
                oFilterBar = that.byId("filterBar"),
                oDefaultVariant = {};

            that.getView().getModel().read("/OrgUnitSet(EmpId='',OrgId='')", {
                urlParameters: {
                    "$expand": "SubOrgUnitSet",
                    "$format": "json"
                },
                success: function(oData) {
                    oDefaultVariant.OrgId = [{
                        id: oData.OrgId,
                        name: oData.OrgText
                    }];
                    oFilterBar.customVariantManager.createDefaultVariant(oDefaultVariant);
                }
            });
        },

        openCalendarSettings: function() {
            if (!this._oCalendarSettings) {
                this._oCalendarSettings = sap.ui.xmlfragment(this._oView.createId("CalednarSettings"),
                    "sap.coe.rpa.fragment.dialog.CalendarFilter", this);
                this._oView.addDependent(this._oCalendarSettings);
            }
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this._oView, this._oCalendarSettings);
            this._oCalendarSettings.open();
        },

        onReset: function() {
            // resetting the value of Combobox and initial state of the table
            var oBinding = this._oPlanningCalendar.getBinding("rows");
            oBinding.filter([]);
        },

        onCreateTimeAllocation: function(oEvent) {
            var oCreateRequestBody = oEvent.getSource().getModel("CreateAllocation").getData();
            oCreateRequestBody.TimespecType = this.byId("CreateAllocation--idtimeAllocationCategoryList").getSelectedKey();
            oCreateRequestBody.Begtimestamp = oCreateRequestBody.BegDate;
            oCreateRequestBody.EndDate = new Date(oCreateRequestBody.EndDate.getFullYear(), oCreateRequestBody.EndDate.getMonth(),
                (oCreateRequestBody.EndDate.getDate() + 1));
            oCreateRequestBody.Endtimestamp = oCreateRequestBody.EndDate;
            DataManager.onCreateTimeAllocation(this, "/TimeAllocationList", oCreateRequestBody);
        },

        onTimeAllocationCategoryListChanged: function(oEvent) {
            this.byId("CreateAllocation--linkForISP").setEnabled(oEvent.getSource().getSelectedKey() === "ZVAC");
        },

        //use search
        onFilterBarSearchButtonPressed: function(oEvent) {
            this.aFilters = VariantHelper.getFilters(oEvent);
            // adding filters startdate and enddate
            for(var i=0;i<this.aFilters[0].aFilters.length;i++){
                if(this.aFilters[0].aFilters[i].aFilters.length===0){
                    this.aFilters[0].aFilters.splice(i,i); 
                }
            }
            this.oFilterStartDate = this._oPlanningCalendar.mAggregations.header._oCalendar.getSelectedDates()[0].getStartDate();
            this.oFilterEndDate = this._oPlanningCalendar.mAggregations.header._oCalendar.getSelectedDates()[0].getEndDate();
            var oDates = new sap.ui.model.Filter({filters:[new sap.ui.model.Filter({filters:[new sap.ui.model.Filter(this.PHFilters[0].sPath,sap.ui.model.FilterOperator.EQ,this.oFilterStartDate)]}),new sap.ui.model.Filter({filters:[new sap.ui.model.Filter(this.PHFilters[1].sPath,sap.ui.model.FilterOperator.EQ,this.oFilterEndDate)]})],and:true});
            
           // var oDates = new sap.ui.model.Filter({filters:[new sap.ui.model.Filter({filters:[new sap.ui.model.Filter(this.PHFilters[0].sPath,sap.ui.model.FilterOperator.EQ,this.PHFilters[0].oValue1)]}),new sap.ui.model.Filter({filters:[new sap.ui.model.Filter(this.PHFilters[1].sPath,sap.ui.model.FilterOperator.EQ,this.PHFilters[1].oValue1)]})],and:true});
            this.aFilters[0].aFilters.push(oDates);
            if (this.aFilters === undefined) {
                return;
            }
            DataManager.onRead(this, this.aFilters);
        },


        onAllocationCreated: function() {
            var that = oController,
                oPlanningCalendarComponent = that.byId("resourcePlanningCalendarId");

            oPlanningCalendarComponent.readResources(that.aFilters);
            
            sap.git.usage.MobileUsageReporting.postEvent("Team Calendar - Allocation Created", that.getOwnerComponent());
        },

        onActionSheetPress: function(oEvent) {
            var oActionButton = oEvent.getSource();

            if (!this._actionSheet) {
                this._actionSheet = helpers.initializeFragment(this, "sap.coe.rpa.fragment.popover.ActionSheet", ActionSheetController);
            }
            this._actionSheet.openBy(oActionButton);
        },

        handleConfirm: function(oEvent) {

            var mParams = oEvent.getParameters();
            var oBinding = this._oPlanningCalendar.getBinding("rows");

            var aFilters = [];
            var oItem = mParams.filterItems[0];
            var aSplit = oItem.getKey().split("___");
            var sPath = aSplit[0];
            var sOperator = aSplit[1];
            var sValue1 = aSplit[2];
            var sValue2 = aSplit[3];
            var sField = aSplit[4];

            var aSplitPath = sPath.split("/");
            var sSet = aSplitPath[0];

            var aArray = [];
            for (var i = 0; i < oBinding.oList.length; i++) {
                var iSetLength = oBinding.oList[i][sSet].results.length;
                aArray.push(iSetLength);
            }
            var iHighest = 0;
            for (var a in aArray) {
                if (aArray[a] > iHighest) {
                    iHighest = aArray[a];
                }
            }

            for (var j = 0; j < iHighest; j++) {
                var sCombinedPath = sPath + j.toString() + sField;
                var oFilter = new Filter(sCombinedPath, sOperator, sValue1, sValue2);
                aFilters.push(oFilter);
            }

            var myFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oBinding.filter(myFilter);
        },

        onCloseDialog: function(oEvent) {
            oEvent.getSource().getParent().close();
        },

        /**
         * Check p13n client model for a value. If none present requests data from p13n service.
         * If no data returned viewChange event of calendar is fired to trigger data read with default view key
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
        },

        /**
         * Check p13n client model for a value. If none present requests data from p13n service.
         * 
         * @private
         * @returns {void}
         */
         //This is called when route matched, if user has saved calendar sort p13n settings then sort the PC
         //otherwise simply do nothing and let the PC be displayed without sorting applied
         //this code is repeated throughout the app. can it be moved ?
        _readp13nSortCal: function() {
            P13nHelper.readData(this.getOwnerComponent()._calSortP13n, function(oSortOptionData) {
                if (oSortOptionData) {
                    var oSorter = new sap.ui.model.Sorter(oSortOptionData.sortItem, oSortOptionData.sortDescending),
                        oPCRowBinding = this._oPlanningCalendar.getBinding("rows");

                    // sorting must be done on client side
                    oPCRowBinding.bClientOperation = true;
                    oPCRowBinding.aAllKeys = true;
                    oPCRowBinding.sOperationMode = "Client";
                    oPCRowBinding.sort(oSorter);
                    oPCRowBinding.bClientOperation = false;
                    oPCRowBinding.aAllKeys = null;
                    oPCRowBinding.sOperationMode = "Server";

                    //this._oComponent.getModel("p13nModel").setProperty("/calSortKey", oSortOptionData);
                }
            }.bind(this));
        },
        _TimezoneSettingsDialog: function(that){
            //  TimeZoneSettings._getUserTimeZone(this);
          //  var oTimezones = this.getModel("TimeZone").getData();
              if (!this._oTimeZoneSelect) {
                  this._oTimeZoneSelect = sap.ui.xmlfragment(
                      "sap.coe.capacity.reuselib.controls.TimeZoneSelect.TimeZoneSelect", this);
                  this.getView().addDependent(this._oTimeZoneSelect);
              }
              jQuery.sap.syncStyleClass("sapUiSizeCompact", that.oView, this._oTimeZoneSelect);
              this._oTimeZoneSelect.setTitle(i18n.getText("FRAGMENT_SELECT_TIMEZONE_TITLE"));
             // this._oTimeZoneSelect.open();
          },
          _showSettingsDialog: function(){
            this._getUserTimeZone(this);
            if (!this._oTimeZoneSelect) {
                this._oTimeZoneSelect = sap.ui.xmlfragment(
                    "sap.coe.capacity.reuselib.controls.TimeZoneSelect.TimeZoneSelect", this);
                this.oView.addDependent(this._oTimeZoneSelect);
            }
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.oView, this._oTimeZoneSelect);
            this._oTimeZoneSelect.setTitle(i18n.getText("FRAGMENT_SELECT_TIMEZONE_TITLE"));
            this._oTimeZoneSelect.open();
          },
          handleClose: function (oEvent) {
              var that = this,
                  sPath = oEvent.getParameter("selectedContexts")[0].sPath,
                  sValue = oEvent.getSource().getModel("TimeZone").getProperty(sPath).key,
                  oRequestBody = {
                      "Timezone": sValue
                  };
                  this.getView().getModel().update("/ResTimeZoneSet('')", oRequestBody, {
                  success: function (oData, response) {
                      that._oTimeZoneSelect.getModel("TimeZone").setProperty("/SelectedTimeZone", sValue);
                      resourcePlanningCalendarComponentInstance.getModel("TimeZone").setProperty("/SelectedTimeZone", sValue);
                  }
              });
          },
          handleSearch: function (oEvent) {
              var sValue = oEvent.getParameter("value"),
                  oFilter = new Filter("text", sap.ui.model.FilterOperator.Contains, sValue),
                  oBinding = oEvent.getSource().getBinding("items");
      
              oBinding.filter([oFilter]);
          },
          _setTimeZoneModelToView: function (that, sComponent) {
              that.getView().setModel(
                  new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath(sComponent) + "/model/TimeZoneModel.json"),
                  "TimeZone");
          },
          _getUserTimeZone: function (that) {
              that.oView.getModel().read("/ResTimeZoneSet('')", {
                  success: function (oData, response) {
                      that.oView.getModel("TimeZone").setProperty("/SelectedTimeZone", oData.Timezone);
                  }
              });
          }
    });
});

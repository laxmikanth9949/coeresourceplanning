sap.ui.define([
    "sap/ui/core/util/MockServer",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/ResourcePlanningCalendarComponent",
    "sap/coe/capacity/reuselib/controls/QualificationSelect/QualificationSelectComponent",
    "sap/coe/capacity/reuselib/controls/EmployeeSelect/EmployeeSearchComponent",
    "sap/m/List",
    "sap/ui/thirdparty/sinon"
], function(MockServer) {
    "use strict";
    return {
        init: function() {
            // create
            /* eslint-disable sap-no-hardcoded-url */
            var oHost = "https://",
                oMockServer = new MockServer({
                rootUri: oHost + "pgtmain.wdf.sap.corp/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/"
            });
            /* eslint-enable sap-no-hardcoded-url */
            var oUriParameters = jQuery.sap.getUriParameters();
            // configure
            MockServer.config({
                autoRespond: true,
                autoRespondAfter: oUriParameters.get("serverDelay") || 1000
            });
            // simulate
            var sPath = jQuery.sap.getModulePath("sap.coe.rpa.localService");
            oMockServer.simulate(sPath + "/metadata.xml", {
                sMockdataBaseUrl: sPath + "/mockdata",
                aEntitySetsNames: ["OrgUnitSet", "SubOrgUnitSet", "QualificationList",
                    "ResDemandSet", "ResourceList", "ResPublicHolidaysSet", "RPTASTDataSet",
                    "ResServiceTeamSet", "ResTimeZoneSet", "SearchVariants", "VariantDetails"
                ]
            });

            this._mockTime();
            this._mockOrganisationUnitRequest();
            this._mockVariantCreateRequest();

            // start
            oMockServer.start();
        },

        _mockTime: function() {
            sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.ResourcePlanningCalendarComponent.prototype._initOriginal = sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.ResourcePlanningCalendarComponent.prototype.init;
            sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.ResourcePlanningCalendarComponent.prototype.init = function() {
                var clock = sinon.useFakeTimers(new Date(2016, 6, 27).getTime()); //Mock all the calls to Date() returning 27/07/2016 in _init method (The initialization of the Planning Calendar Component)
                var returnValue = this._initOriginal.apply(this, arguments);
                clock.restore();
                return returnValue;
            };

            sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectComponent.prototype._createFiltersOriginal = sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectComponent.prototype._createFilters;
            sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectComponent.prototype._createFilters = function() {
                var clock = sinon.useFakeTimers(new Date("Mon Jul 25 2016 09:00:00 GMT+0100 (GMT Daylight Time)").getTime()); //Mock all the calls to Date() returning 25/07/2016 at 9 am in _createFilters method
                //var returnValue = this._createFiltersOriginal.apply(this, arguments);
                clock.restore();
                //return returnValue;  //Filters don't work well in Qualification Component. Return empty filters in Mockserver temporarily.
                return [];
            };

            sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearchComponent.prototype._onSearchEmployeeOriginal = sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearchComponent.prototype.onSearchEmployee;
            sap.coe.capacity.reuselib.controls.EmployeeSelect.EmployeeSearchComponent.prototype.onSearchEmployee = function() {
                var mockedDate = new Date("Mon Jul 25 2016 01:00:00 GMT+0100 (GMT Daylight Time)"),
                    clock = sinon.useFakeTimers(mockedDate.getTime()), //Mock all the calls to Date() returning 25/07/2016 in onSearchEmployee method
                    returnValue;

                sap.m.List.prototype._bindAggregationOriginal = sap.m.List.prototype.bindAggregation;
                sap.m.List.prototype.bindAggregation = function() {
                    clock.restore(); //Restore the clock just before the binding otherwise the mockserver will not work
                    return sap.m.List.prototype._bindAggregationOriginal.apply(this, arguments);
                };

                returnValue = this._onSearchEmployeeOriginal.apply(this, arguments);
                clock.restore();

                sap.m.List.prototype.bindAggregation = sap.m.List.prototype._bindAggregationOriginal; //Restore the original binding behaviour after search

                return returnValue;
            };
        },

        _mockOrganisationUnitRequest: function() {
            sap.ui.model.odata.v2.ODataModel.prototype._readOriginal = sap.ui.model.odata.v2.ODataModel.prototype.read;
            sap.ui.model.odata.v2.ODataModel.prototype.read = function() {

                if (arguments[0].indexOf("OrgUnitSet") !== -1) {
                    var sQuery = arguments[0];
                    var sEmpId = sQuery.split("/OrgUnitSet(EmpId='")[1].split("'")[0];
                    var sOrgId = sQuery.split("/OrgUnitSet(EmpId='")[1].split("',OrgId='")[1].split("'")[0];

                    if (sEmpId === "") {
                        sEmpId = "I327678";
                    }

                    if (sOrgId === "") {
                        sOrgId = "30015950";
                    }

                    arguments[0] = "/OrgUnitSet(EmpId='" + sEmpId + "',OrgId='" + sOrgId + "')";


                    var successOriginal = arguments[1].success;

                    arguments[1].success = function(odata, response) {
                        var odata2 = odata[0];
                        successOriginal(odata2, response);
                    };
                }

                return this._readOriginal.apply(this, arguments);
            };
        },

        _mockVariantCreateRequest: function() {
            sap.ui.model.odata.v2.ODataModel.prototype._createBeforeMockVariant = sap.ui.model.odata.v2.ODataModel.prototype.create;
            sap.ui.model.odata.v2.ODataModel.prototype.create = function() {

                if (arguments[0].indexOf("SearchVariants") !== -1) {
                    var oRequestCopy = JSON.parse(JSON.stringify(arguments[1]));

                    var successOriginal = arguments[2].success;

                    arguments[2].success = function(odata, response) {
                        odata.VariantDetails.results = oRequestCopy.VariantDetails;
                        if (!odata.VariantDetails.results[odata.VariantDetails.results.length - 1].VariantId) { //SaveAs
                            odata.VariantDetails.results[odata.VariantDetails.results.length - 1].VariantId = "newVariantID";
                        }
                        successOriginal(odata, response);
                    };
                }

                return this._createBeforeMockVariant.apply(this, arguments);
            };
        }
    };
});

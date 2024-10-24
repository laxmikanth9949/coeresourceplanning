sap.ui.define([
    "sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/ResourcePlanningCalendarComponent",
    "sap/coe/capacity/reuselib/utils/dataManagerNew",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function(ResourcePlanningCalendarComponent, oDataManager) {
    "use strict";
    var sandbox = sinon.sandbox.create();

    var oTestHelper = {};

    oTestHelper.vars = {};

    oTestHelper.setupFakeEnvironment = function(oComponent) {
        var oFakeModel = new sap.ui.model.odata.v2.ODataModel(""),
            oComponentFireAllocationCreatedStub = sandbox.stub(oComponent, "fireAllocationCreated"),
            oMessageShowStub = sandbox.stub(sap.m.MessageToast, "show"),
            oFakeFragment = { getModel: function() {}, setBusy: function() {}, getAggregation: function() {} },
            oFakeRowsAggregation = [{ setSelected: function() {} }],
            oDataManagerReadResourceStub = sandbox.stub(oDataManager, "readResource"),
            oComponentGetFragmentStub = sandbox.stub(oComponent, "getFragment"),
            oFragmentGetModelStub = sandbox.stub(oFakeFragment, "getModel"),
            oFragmentSetBusyStub = sandbox.stub(oFakeFragment, "setBusy"),
            oFragmentGetAggregationStub = sandbox.stub(oFakeFragment, "getAggregation");

        oComponentGetFragmentStub.returns(oFakeFragment);
        oFragmentGetModelStub.returns(oFakeModel);
        oFragmentGetAggregationStub.withArgs("rows").returns(oFakeRowsAggregation);

        oTestHelper.vars.oFakeModel = oFakeModel;
        oTestHelper.vars.oMessageShowStub = oMessageShowStub;
        oTestHelper.vars.oComponentFireAllocationCreatedStub = oComponentFireAllocationCreatedStub;
        oTestHelper.vars.oFakeFragment = oFakeFragment;
        oTestHelper.vars.oDataManagerReadResourceStub = oDataManagerReadResourceStub;
        oTestHelper.vars.oComponentGetFragmentStub = oComponentGetFragmentStub;
        oTestHelper.vars.oFragmentGetModelStub = oFragmentGetModelStub;
        oTestHelper.vars.oFragmentSetBusyStub = oFragmentSetBusyStub;
    };

    oTestHelper.cleanFakeEnvironment = function() {
        oTestHelper.vars.oFakeModel.destroy();
    };

    QUnit.module("Controls - Resource Planning Calendar Component", {
        beforeEach: function() {
            this.oComponent = new ResourcePlanningCalendarComponent();
            oTestHelper.setupFakeEnvironment(this.oComponent);
        },
        afterEach: function() {
            this.oComponent.destroy();
            sandbox.restore();
            oTestHelper.cleanFakeEnvironment();
        }
    });

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(this.oComponent, "Was possible to create the instance");
    });

    QUnit.test("createTimeAllocation: Should create a new allocation", function(assert) {
        var oFakeModel = oTestHelper.vars.oFakeModel,
            oRequestBody = {
                TimespecType: "ZVAC",
                EmpID: "I300679",
                BegDate: new Date("2016-08-30T23:00:00.000Z"),
                EndDate: new Date("2016-08-31T00:00:00.000Z"),
                Begtimestamp: new Date("2016-08-31T09:00:00.000Z"),
                Endtimestamp: new Date("2016-08-31T17:00:00.000Z")
            },
            oDataManagerCreateStub = sandbox.stub(oDataManager, "createTimeAllocation");

        this.oComponent.createTimeAllocation(oFakeModel, oRequestBody);

        assert.ok(oDataManagerCreateStub.called, "The create allocation was called");
        assert.strictEqual(oDataManagerCreateStub.args[0][0], oFakeModel, "The expected model was used");
        assert.strictEqual(oDataManagerCreateStub.args[0][1], oRequestBody, "The expected allocation was created");
        assert.strictEqual(oDataManagerCreateStub.args[0][2], this.oComponent.onCreateTimeAllocationSuccess, "The expected callback was used");
    });

    QUnit.test("onCreateTimeAllocationSuccess: Should trigger the allocation created event", function(assert) {
        var oComponentFireAllocationCreatedStub = oTestHelper.vars.oComponentFireAllocationCreatedStub,
            oFakeData = {},
            oFakeResponse = {};

        this.oComponent.onCreateTimeAllocationSuccess(oFakeData, oFakeResponse);

        assert.ok(oComponentFireAllocationCreatedStub.called, "The create allocation was called");
        assert.strictEqual(oComponentFireAllocationCreatedStub.args[0][0].allocation, oFakeData, "The correct data was sent in the event");
    });

    QUnit.test("onCreateTimeAllocationSuccess: Should display a success message", function(assert) {
        var oMessageShowStub = oTestHelper.vars.oMessageShowStub,
            oExpectedMessage = "Allocation Created",
            oFakeData = {},
            oFakeResponse = {};

        this.oComponent.onCreateTimeAllocationSuccess(oFakeData, oFakeResponse);

        assert.ok(oMessageShowStub.calledWith(oExpectedMessage), "The correct message was displayed");
    });

    QUnit.test("readResources: Should read from the resource list service", function(assert) {
        var oFakeModel = oTestHelper.vars.oFakeModel,
            oFakeFilters = [],
            oDataManagerReadResourceStub = oTestHelper.vars.oDataManagerReadResourceStub;

        this.oComponent.readResources(oFakeFilters);

        assert.ok(oDataManagerReadResourceStub.called, "The read resource was called");
        assert.strictEqual(oDataManagerReadResourceStub.args[0][0], oFakeModel, "The expected model was used");
        assert.strictEqual(oDataManagerReadResourceStub.args[0][1], oFakeFilters, "The expected filters were used");
        assert.strictEqual(oDataManagerReadResourceStub.args[0][2], this.oComponent.onReadResourceSuccess, "The expected callback was used");
        assert.strictEqual(oDataManagerReadResourceStub.args[0][3], this.oComponent.onReadResourceFail, "The expected fail callback was used");
    });

    QUnit.test("readResources: Should set the busy mode", function(assert) {
        var oFragmentSetBusyStub = oTestHelper.vars.oFragmentSetBusyStub,
            oFakeFilters = [];

        this.oComponent.readResources(oFakeFilters);

        assert.ok(oFragmentSetBusyStub.calledWith(true), "The busy mode was set");
    });

    QUnit.test("onReadResourceSuccess: Should display a message when no results", function(assert) {
        var oMessageShowStub = oTestHelper.vars.oMessageShowStub,
            oExpectedMessage = "No results for this search criteria",
            oFakeData = {},
            oFakeResponse = {};

        oFakeData.results = [];
        this.oComponent.onReadResourceSuccess(oFakeData, oFakeResponse);

        assert.ok(oMessageShowStub.calledWith(oExpectedMessage), "The correct message was displayed");
    });

    QUnit.test("onReadResourceSuccess: Should disable busy mode", function(assert) {
        var oFragmentSetBusyStub = oTestHelper.vars.oFragmentSetBusyStub,
            oFakeData = {},
            oFakeResponse = {};

        oFakeData.results = [];
        this.oComponent.onReadResourceSuccess(oFakeData, oFakeResponse);

        assert.ok(oFragmentSetBusyStub.calledWith(false), "The busy mode was disabled");
    });

    QUnit.test("onReadResourceFail: Should disable busy mode", function(assert) {
        var oFragmentSetBusyStub = oTestHelper.vars.oFragmentSetBusyStub,
            oFakeResponse = {};

        this.oComponent.onReadResourceFail(oFakeResponse);

        assert.ok(oFragmentSetBusyStub.calledWith(false), "The busy mode was disabled");
    });

});
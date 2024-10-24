sap.ui.define([
    "sap/coe/capacity/reuselib/utils/dataManagerNew",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function(oDataManager) {
    "use strict";
    var sandbox = sinon.sandbox.create();

    QUnit.module("Utils - Data Manager", {
        afterEach: function() {
            sandbox.restore();
        }
    });

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oDataManager, "Was possible to import the instance");
    });

    QUnit.test("createTimeAllocation: Should create an allocation with the right service", function(assert) {
        var oFakeModel = new sap.ui.model.odata.v2.ODataModel(""),
            oFakeModelCreateStub = sandbox.stub(oFakeModel, "create"),
            oRequestBody = {
                TimespecType: "ZVAC",
                EmpID: "I300679",
                BegDate: new Date("2016-08-30T23:00:00.000Z"),
                EndDate: new Date("2016-08-31T00:00:00.000Z"),
                Begtimestamp: new Date("2016-08-31T09:00:00.000Z"),
                Endtimestamp: new Date("2016-08-31T17:00:00.000Z")
            };

        oDataManager.createTimeAllocation(oFakeModel, oRequestBody);

        assert.ok(oFakeModelCreateStub.called, "It was called the 'create' of the model");
        assert.strictEqual(oFakeModelCreateStub.args[0][0], "/TimeAllocationList", "It was called using the right service");
        assert.strictEqual(oFakeModelCreateStub.args[0][1], oRequestBody, "It was called with the expected allocation");
    });

    QUnit.test("readResource: Should read the resources from the right service", function(assert) {
        var oFakeModel = new sap.ui.model.odata.v2.ODataModel(""),
            oFakeModelCreateStub = sandbox.stub(oFakeModel, "read"),
            aFakeFilters = [],
            oExpectedURLParams = {
                $expand: "RPTASTDataSet,QualificationSet"
            },
            readParameters;

        oDataManager.readResource(oFakeModel, aFakeFilters);
        readParameters = oFakeModelCreateStub.args[0][1];
        assert.ok(oFakeModelCreateStub.called, "It was called the 'read' of the model");
        assert.strictEqual(oFakeModelCreateStub.args[0][0], "/ResourceList", "It was called using the right service");
        assert.strictEqual(readParameters.filters, aFakeFilters, "It was called with the expected filters");
        assert.strictEqual(readParameters.urlParameters.$expand, oExpectedURLParams.$expand, "The RPTASTDataSet and QualificationSet asociation was expanded");
    });

});
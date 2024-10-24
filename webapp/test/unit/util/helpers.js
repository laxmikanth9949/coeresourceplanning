sap.ui.define([
    "sap/coe/rpa/util/helpers"
], function(oHelpers) {
    "use strict";

    QUnit.module("Util - helpers");

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oHelpers, "Was possible to import the instance");
    });

});

sap.ui.define([
    "sap/coe/rpa/util/helpers",
    "sap/coe/capacity/reuselib/utils/helpers",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function(oHelpers) {
    "use strict";
    QUnit.module("Util - helpers");
    var sandbox = sinon.sandbox.create();
    var testHelper = {};

    testHelper.initializeFragmentVars = {};
    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oHelpers, "Was possible to import the instance");
    });

    testHelper.getParamsForInitializeFragmentMethod = function(bParentComponent) {
        var oFakeController = new sap.ui.core.mvc.Controller(),
            oFakeControllerClass = sap.ui.core.mvc.Controller.extend("specific.fragment.controller", {}),
            oFakeElementComponent = new sap.ui.core.Element(),
            oFakeModel = new sap.ui.model.json.JSONModel([{ testProperty: "Model" }]),
            oFakeFragmentReturn = {
                setModel: function() {},
                bindElement: function() {}
            },
            oFakeGetView, oStubParentControllerViewAddDependent,
            oStubParentControllerGetView = sandbox.stub(oFakeController, "getView"),
            oStubElementComponentAddDependent = sandbox.stub(oFakeElementComponent, "addDependent"),
            oStubFragmentSetModel = sandbox.stub(oFakeFragmentReturn, "setModel"),
            oStubFragmentBindElement = sandbox.stub(oFakeFragmentReturn, "bindElement"),
            oXmlfragmentStub = sandbox.stub(sap.ui, "xmlfragment");

        oFakeGetView = function() {
            return this.addDependent;
        };
        oFakeGetView.addDependent = function() {};
        oStubParentControllerViewAddDependent = sandbox.stub(oFakeGetView, "addDependent");

        oXmlfragmentStub.returns(oFakeFragmentReturn);
        oStubParentControllerGetView.returns(oFakeGetView);

        //Shared Variables for test
        testHelper.initializeFragmentVars.oStubParentControllerGetView = oStubParentControllerGetView;
        testHelper.initializeFragmentVars.oStubParentControllerViewAddDependent = oStubParentControllerViewAddDependent;
        testHelper.initializeFragmentVars.oStubElementComponentAddDependent = oStubElementComponentAddDependent;
        testHelper.initializeFragmentVars.oStubFragmentSetModel = oStubFragmentSetModel;
        testHelper.initializeFragmentVars.oStubFragmentBindElement = oStubFragmentBindElement;
        testHelper.initializeFragmentVars.oXmlfragmentStub = oXmlfragmentStub;
        testHelper.initializeFragmentVars.oFakeController = oFakeController;
        testHelper.initializeFragmentVars.oFakeElementComponent = oFakeElementComponent;
        testHelper.initializeFragmentVars.oFakeModel = oFakeModel;

        return {
            oParentController: bParentComponent ? oFakeElementComponent : oFakeController,
            sFragment: "fragment.namespace.name",
            ControllerClass: oFakeControllerClass,
            oModel: oFakeModel,
            sElementPath: "/0",
            sCreateId: "fragmentId"
        };

    };

    QUnit.module("Utils - helpers", {
        afterEach: function() {
            sandbox.restore();

            if (testHelper.initializeFragmentVars.oFakeController) {
                testHelper.initializeFragmentVars.oFakeController.destroy();
                testHelper.initializeFragmentVars.oFakeController = undefined;
            }

            if (testHelper.initializeFragmentVars.oFakeElementComponent) {
                testHelper.initializeFragmentVars.oFakeElementComponent.destroy();
                testHelper.initializeFragmentVars.oFakeElementComponent = undefined;
            }

            if (testHelper.initializeFragmentVars.oFakeModel) {
                testHelper.initializeFragmentVars.oFakeModel.destroy();
                testHelper.initializeFragmentVars.oFakeModel = undefined;
            }
        }
    });

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oHelpers, "Was possible to import the instance");
    });

    QUnit.test("getDateRangeFromCalendarWeek: Should return the correct Start/End date of a calendar week", function(assert) {
        var clock = sandbox.useFakeTimers(new Date(2016, 5, 13).getTime()),
            oExpectedDates = {
                startDate: new Date(2016, 8, 25), //25-9-2016
                endDate: new Date(2016, 9, 1) //1-10-2016
            };

        var oDates = oHelpers.getDateRangeFromCalendarWeek("40"); //CW = 40

        clock.restore();

        assert.propEqual(oDates, oExpectedDates, "Was retrieve the expected object");
        assert.strictEqual(oDates.startDate.toLocaleDateString(), oExpectedDates.startDate.toLocaleDateString(), "The start date is correct");
        assert.strictEqual(oDates.endDate.toLocaleDateString(), oExpectedDates.endDate.toLocaleDateString(), "The end date is correct");
    });

    QUnit.test("getDateRangeFromCalendarWeek: The Start/End date should take into account the current calendar week", function(assert) {
        var clock = sandbox.useFakeTimers(new Date(2016, 5, 13).getTime()),
            oExpectedDates = {
                startDate: new Date(2017, 0, 22), //22-1-2017
                endDate: new Date(2017, 0, 28) //28-1-2017
            };

        var oDates = oHelpers.getDateRangeFromCalendarWeek("4"); //CW=4

        clock.restore();

        assert.propEqual(oDates, oExpectedDates, "Was retrieve the expected object");
        assert.strictEqual(oDates.startDate.toLocaleDateString(), oExpectedDates.startDate.toLocaleDateString(), "The start date is correct");
        assert.strictEqual(oDates.endDate.toLocaleDateString(), oExpectedDates.endDate.toLocaleDateString(), "The end date is correct");
    });

    QUnit.test("copyModel: Should create a new instance which is a copy form the one given", function(assert) {
        var oModel = new sap.ui.model.json.JSONModel([{ testProperty: "Original Model" }]),
            oModelCopy;

        oModelCopy = oHelpers.copyModel(oModel);

        assert.equal(oModel.getProperty("/0/testProperty"), oModelCopy.getProperty("/0/testProperty"), "The model is a copy of the one given");

        oModelCopy.setProperty("/0/testProperty", "Modified Property");

        assert.notEqual(oModel.getProperty("/0"), oModelCopy.getProperty("/0"), "The model is a new instance with a different reference");
        assert.notEqual(oModel.getProperty("/0/testProperty"), oModelCopy.getProperty("/0/testProperty"), "Changes in copy does not affect to the original");
    });

    QUnit.test("initializeFragmentFromObject: Should create a fragment with the parent controller as main controller by default", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oXmlfragmentStub = testHelper.initializeFragmentVars.oXmlfragmentStub;

        oParams.ControllerClass = undefined;
        oParams.sCreateId = undefined;

        oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oXmlfragmentStub.called, "The method to create the fragment was called");
        assert.ok(oXmlfragmentStub.calledWith(oParams.sFragment, oParams.oParentController), "The method to create the fragment was called");
    });

    QUnit.test("initializeFragmentFromObject: Should create a fragment with id and with the parent controller as main controller by default", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oXmlfragmentStub = testHelper.initializeFragmentVars.oXmlfragmentStub;

        oParams.ControllerClass = undefined;

        oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oXmlfragmentStub.called, "The method to create the fragment was called");
        assert.ok(oXmlfragmentStub.calledWith(oParams.sCreateId, oParams.sFragment, oParams.oParentController), "The method was called with the expected arguments");
    });

    QUnit.test("initializeFragmentFromObject: Should create a fragment with the given controller", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oXmlfragmentStub = testHelper.initializeFragmentVars.oXmlfragmentStub,
            sControllerName;

        oParams.sCreateId = undefined;

        oHelpers.initializeFragmentFromObject(oParams);

        sControllerName = oXmlfragmentStub.args[0][1].getMetadata().getName();

        assert.ok(oXmlfragmentStub.called, "The method to create the fragment was called");
        assert.strictEqual(oXmlfragmentStub.args[0].length, 2, "The method was called with the expected amount of arguments");
        assert.strictEqual(sControllerName, "specific.fragment.controller", "The fragment was created with the right controller");
    });

    QUnit.test("initializeFragmentFromObject: Should create a fragment with id and with the given controller", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oXmlfragmentStub = testHelper.initializeFragmentVars.oXmlfragmentStub,
            sControllerName;

        oHelpers.initializeFragmentFromObject(oParams);

        sControllerName = oXmlfragmentStub.args[0][2].getMetadata().getName();

        assert.ok(oXmlfragmentStub.called, "The method to create the fragment was called");
        assert.strictEqual(oXmlfragmentStub.args[0].length, 3, "The method was called with the expected amount of arguments");
        assert.strictEqual(sControllerName, "specific.fragment.controller", "The fragment was created with the right controller");
    });

    QUnit.test("initializeFragmentFromObject: Should have the 'byId' method", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oFragment;

        oFragment = oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oFragment.byId, "The method is defined");
    });

    QUnit.test("initializeFragmentFromObject: Should be added as dependent of the parent controller", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oStubParentControllerViewAddDependent = testHelper.initializeFragmentVars.oStubParentControllerViewAddDependent,
            oFragment;

        oFragment = oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oStubParentControllerViewAddDependent.calledWith(oFragment), "The fragment was added as dependant from the right controller");
    });

    QUnit.test("initializeFragmentFromObject: Should be added as dependent of the parent element component", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(true),
            oStubElementComponentAddDependent = testHelper.initializeFragmentVars.oStubElementComponentAddDependent,
            oFragment;

        oFragment = oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oStubElementComponentAddDependent.calledWith(oFragment), "The fragment was added as dependant from the right component");
    });

    QUnit.test("initializeFragmentFromObject: Should be possible to return the controller from the fragment", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oFragment;

        oFragment = oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oFragment.getController, "It was defined the 'getController' function for a fragment");
    });

    QUnit.test("initializeFragmentFromObject: Should support component as fragment controllers", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(true),
            oFakeElementComponent = testHelper.initializeFragmentVars.oFakeElementComponent;

        oParams.oParentController = oFakeElementComponent;
        oParams.ControllerClass = undefined;
        oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oFakeElementComponent.getController, "It was defined the 'getController' function for a component");
    });

    QUnit.test("initializeFragmentFromObject: Should set the model to the fragment", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oStubFragmentSetModel = testHelper.initializeFragmentVars.oStubFragmentSetModel;

        oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oStubFragmentSetModel.calledWith(oParams.oModel), "The model was set to the fragment");
    });

    QUnit.test("initializeFragmentFromObject: Should not try to set the model to the fragment when no model is given", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oStubFragmentSetModel = testHelper.initializeFragmentVars.oStubFragmentSetModel;

        oParams.oModel = undefined;
        oHelpers.initializeFragmentFromObject(oParams);

        assert.notOk(oStubFragmentSetModel.called, "It was not tried to set the model to the fragment");
    });

    QUnit.test("initializeFragmentFromObject: Should set the path of the model to the fragment", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oStubFragmentBindElement = testHelper.initializeFragmentVars.oStubFragmentBindElement;

        oHelpers.initializeFragmentFromObject(oParams);

        assert.ok(oStubFragmentBindElement.calledWith(oParams.sElementPath), "The path was set to the fragment");
    });

    QUnit.test("initializeFragmentFromObject: Should not try to set the path of the model to the fragment when no path is given", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oStubFragmentBindElement = testHelper.initializeFragmentVars.oStubFragmentBindElement;

        oParams.sElementPath = undefined;
        oHelpers.initializeFragmentFromObject(oParams);

        assert.notOk(oStubFragmentBindElement.called, "It was not tried to set the path to the fragment");
    });

    QUnit.test("initializeFragment: Should call to initializeFragmentFromObject with the correct parameters", function(assert) {
        var oParams = testHelper.getParamsForInitializeFragmentMethod(),
            oSpyInitializeFragmentFromObject = sandbox.spy(oHelpers, "initializeFragmentFromObject");

        delete oParams.sCreateId;
        oHelpers.initializeFragment(oParams.oParentController, oParams.sFragment, oParams.ControllerClass, oParams.oModel, oParams.sElementPath);

        assert.ok(oSpyInitializeFragmentFromObject.calledWith(oParams), "The method initializeFragmentFromObject was called as expected");
    });

});

sap.ui.define([
    "sap/ui/test/actions/Press"
    ], function(Press) {
    "use strict";

    var IntegrationActionHelper = {};

    IntegrationActionHelper.setTestContext = function(oTestContext) {
        IntegrationActionHelper.oTestContext = oTestContext;
    };

    IntegrationActionHelper.iPressButton = function(sButtonId, bDialog, sSuccessMessage, sErrorMessage) {
        return this.oTestContext.waitFor({
            searchOpenDialogs: bDialog,
            controlType: "sap.m.Button",
            check: function(aButtons) {
                for (var i = 0; i < aButtons.length; i++) {
                    if (aButtons[i].getId().indexOf(sButtonId) > -1) {
                        new Press().executeOn(aButtons[i]);
                        return true;
                    }
                }
            },
            success: function(aButtons) {
                ok(true, sSuccessMessage || "Button " + sButtonId + " pressed.");
            },
            errorMessage: sErrorMessage || "Button " + sButtonId + " press failed."
        });
    };

    return IntegrationActionHelper;
});

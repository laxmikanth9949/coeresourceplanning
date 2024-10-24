sap.ui.define([
    "sap/coe/capacity/reuselib/fragment/Organisation.fragment.controller"
], function(OrganisationController) {
    "use strict";

    QUnit.module("Fragment - OrganisationController", {
        beforeEach: function() {
            this.oOrganisationController = new OrganisationController();
        },
        afterEach: function() {
            this.oOrganisationController.destroy();
        }
    });

    QUnit.test("Should be possible to create an instance", function(assert) {
        assert.ok(this.oOrganisationController, "Was possible to create the instance");
        assert.strictEqual(this.oOrganisationController.getMetadata().getName(), "sap.coe.capacity.reuselib.fragment.Organisation", "Was created with the expected name");
    });

});
sap.ui.define([
    "sap/coe/capacity/reuselib/fragment/ProductSearch.fragment.controller"
], function(ProductSearchController) {
    "use strict";

    QUnit.module("Fragment - ProductSearchController", {
        beforeEach: function() {
            this.oProductSearchController = new ProductSearchController();
        },
        afterEach: function() {
            this.oProductSearchController.destroy();
        }
    });

    QUnit.test("Should be possible to create an instance", function(assert) {
        assert.ok(this.oProductSearchController, "Was possible to create the instance");
        assert.strictEqual(this.oProductSearchController.getMetadata().getName(), "sap.coe.capacity.reuselib.fragment.ProductSearch", "Was created with the expected name");
    });

});
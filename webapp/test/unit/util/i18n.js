sap.ui.define([
    "sap/coe/capacity/reuselib/utils/i18n"
], function(oI18n) {
    "use strict";

    QUnit.module("Util - i18n");

    QUnit.test("Should be possible to import an instance", function(assert) {
        assert.ok(oI18n, "Was possible to import the instance");
    });

});
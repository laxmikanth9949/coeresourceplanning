jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;


sap.ui.require([
    "sap/ui/test/Opa5",
    "sap/coe/rpa/test/integration/pages/Common",
    "sap/ui/test/opaQunit",
    "sap/coe/rpa/test/integration/pages/TeamCalendar"
], function(Opa5, Common) {
    "use strict";
    Opa5.extendConfig({
        arrangements: new Common(),
        viewNamespace: "sap.coe.rpa.view."
    });

    sap.ui.require([
        "sap/coe/rpa/test/integration/TeamCalendarFilterBarJourney",
        "sap/coe/rpa/test/integration/VariantManagerJourney",
        "sap/coe/rpa/test/integration/FrontendFilterJourney"
    ], function() {
        QUnit.start();
    });

});

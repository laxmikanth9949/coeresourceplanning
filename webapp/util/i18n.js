sap.ui.define([], function() {
    "use strict";

    return jQuery.sap.resources({
        url: [jQuery.sap.getModulePath("sap.coe.rpa"), "i18n/messageBundle.properties"].join("/"),
        locale: sap.ui.getCore().getConfiguration().getLanguage()
    });
});

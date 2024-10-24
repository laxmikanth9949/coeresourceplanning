sap.ui.define([
    "sap/ui/test/Opa5"
  ], function(Opa5) {
    "use strict";


    function getFrameUrl (sHash, sUrlParameters) {
        var sUrl = "../flpSandboxMockServer.html";
        // "../flpSandbox" if the Variant manager is getting tested else:
        // "../flpSandboxMockServer".

        sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

        if (sHash) {
            sHash = "#ResourcePlanning-manage&/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
        } else {
            sHash = "#ResourcePlanning-manage";
        }

        return sUrl + sUrlParameters + sHash;
    }

    return Opa5.extend("sap.coe.rpa.test.integration.pages.Common", {

      iStartTheApp: function (sUrl) {
        this.iStartMyAppInAFrame(getFrameUrl(sUrl, "serverDelay=50"));
      }

    });
  }
);
sap.ui.define([], function() {
    "use strict";
    var P13nHelper = {};

    /**
     * Initialises personalizer using personalization service
     * @public
     * @param {object} - application component
     * @param {string} - string to be used as container id
     * @param {string} - property name for item in personalizer data object
     * @return {object} returns personalizer
     */
    P13nHelper.init = function(oComponent, sContainerId, sItemId) {
        var oPersonalizationService = sap.ushell.Container.getService("Personalization"),
            oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true,
                validity: Infinity
            },
            oPersId = {
                container: sContainerId,
                item: sItemId
            };
        return oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
    };

    /**
     * Read personalization data by calling getPersData function of personalizer
     * @public
     * @param {object} - personalizer object instantiated to component with init function
     * @param {function} - success handler function
     * @param {function} - error handler function
     * @return {void}
     */
    P13nHelper.readData = function(oPersonalizer, fnSuccess, fnError) {
        var oReadPromise = oPersonalizer.getPersData().done(function(oPersData) {
            jQuery.sap.log.info("Reading personalization data succeeded.");
            fnSuccess(oPersData);
        }).fail(function() {
            jQuery.sap.log.error("Reading personalization data failed.");
            fnError();
        });
    };

    /**
     * Save personalization data by calling setPersData function of personalizer
     * @public
     * @param {object} - personalizer object instantiated to component with init function
     * @param {object} - data to be saved
     * @return {void}
     */
    P13nHelper.saveData = function(oPersonalizer, oPersData) {
        var oSavePromise = oPersonalizer.setPersData(oPersData).done(function() {
            jQuery.sap.log.info("Personalization data saved successfully.");
        }).fail(function() {
            jQuery.sap.log.error("Writing personalization data failed.");
        });
    };

    /**
     * Validate view key - acceptable values are "1", "2", "4" and "6"
     * @public
     * @return {boolean} true if valid, false if not valid
     */
    P13nHelper.validateViewKey = function(sKey) {
        return sKey === "1" || sKey === "2" || sKey === "4" || sKey === "6" ? true : false;
    };

    /**
     * Returns an array containing the default setting for the RDL worklist table
     * @public
     * @return {Object[]} array of table settings
     */
    P13nHelper.getDefaultColumnLayout = function() {
        return [{
            "id": "ratingCol",
            "index": 1,
            "visible": false
        }, {
            "id": "scopeDate",
            "index": 1,
            "visible": true
        }, {
            "id": "cwCol",
            "index": 2,
            "visible": true
        }, {
            "id": "startDateCol",
            "index": 3,
            "visible": true
        }, {
            "id": "startTimeCol",
            "index": 4,
            "visible": true
        }, {
            "id": "endDateCol",
            "index": 5,
            "visible": true
        }, {
            "id": "endTimeCol",
            "index": 6,
            "visible": true
        }, {
            "id": "callOffCol",
            "index": 7,
            "visible": true
        }, {
            "id": "effortCol",
            "index": 8,
            "visible": false
        }, {
            "id": "customerCol",
            "index": 9,
            "visible": true
        }, {
            "id": "customerERPCol",
            "index": 10,
            "visible": false
        }, {
            "id": "premiumEngagementCol",
            "index": 11,
            "visible": false
        }, {
            "id": "dataProtectionCol",
            "index": 12,
            "visible": false
        }, {
            "id": "demandIdCol",
            "index": 13,
            "visible": true
        }, {
            "id": "itemNoCol",
            "index": 14,
            "visible": true
        }, {
            "id": "headerStatusCol",
            "index": 15,
            "visible": false
        }, {
            "id": "userStatusCol",
            "index": 16,
            "visible": false
        }, {
            "id": "headerDescCol",
            "index": 17,
            "visible": true
        }, {
            "id": "itemDescriptionCol",
            "index": 18,
            "visible": true
        }, {
            "id": "qualifiationDescriptionCol",
            "index": 19,
            "visible": true
        }, {
            "id": "serviceTeamCol",
            "index": 20,
            "visible": false
        }, {
            "id": "firstNameCol",
            "index": 21,
            "visible": true
        }, {
            "id": "lastNameCol",
            "index": 22,
            "visible": true
        }, {
            "id": "userNameCol",
            "index": 23,
            "visible": false
        }, {
            "id": "assignStartDateCol",
            "index": 24,
            "visible": false
        }, {
            "id": "assignStartTimeCol",
            "index": 25,
            "visible": false
        }, {
            "id": "assignEndDateCol",
            "index": 26,
            "visible": false
        }, {
            "id": "assignEndTimeCol",
            "index": 27,
            "visible": false
        }, {
            "id": "assignCountry",
            "index": 28,
            "visible": false
        }];
    };

    /**
     * Updates order and visibility of table columns based on personalisation data
     * @public
     * @param {object} - view containing worklist table to be personalised
     * @param {object} - table personalisation data
     * @return {void}
     */
    P13nHelper.updateColumns = function(oTableView, oData) {
        var oTable = oTableView.byId("worklistTable"),
            oNewSetting, oTableColumn, i, l;
        for (i = 0, l = oData.length; i < l; i++) {
            oNewSetting = oData[i];
            oTableColumn = oTableView.byId(oData[i].id);

            if (oTableColumn) {
                oTableColumn.setVisible(oNewSetting.visible);
                oTableColumn.setOrder(oNewSetting.index);
            } else {
                jQuery.sap.log.warning("Personalization could not be applied to column " + oNewSetting.id + " - not found!");
            }
        }
        // Invalidate table so new order of columns is applied
        oTable.invalidate();

    };

    return P13nHelper;
});
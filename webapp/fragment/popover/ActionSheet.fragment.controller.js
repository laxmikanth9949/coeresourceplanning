sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/rpa/util/helpers"
], function(Controller, helpers) {

    "use strict";

    return Controller.extend("sap.coe.rpa.fragment.popover.ActionSheetFragment", {

        onExportToExcel: function() {
            var oParentView = this.getView().getParent().getParent(),
                oParentController = oParentView.getController(),
                oModel = oParentView.getModel(),
                sFilter = this._getFilterString(oParentController.aFilters, oModel, "/ResourceList"),
                sParams = sFilter !== undefined ? "$format=xlsx&" + sFilter : "$format=xlsx";

            window.open(this._getUrl("RPTASTDataSet", sParams));
        },

        /**
         * Creates an url taking the service uri of the mainService
         *
         * @private
         * @param {string} sPath The requested resource of the service
         * @param {string} sParameters The parameters added to the GET request
         * @returns {string} The url
         */
        _getUrl: function(sPath, sParameters) {
            var oPopOver = this.getView().getParent(),
                oParentController = oPopOver.getParent().getController(),
                oAppComponent = oParentController.getOwnerComponent(oParentController),
                oManifest = oAppComponent.getManifestEntry("sap.app"),
                sUri = oManifest.dataSources.mainService.uri;

            return sUri + sPath + "?" + sParameters;
        },


        /**
         * Return the string $filter variable to append to the service request
         * when this is build manually for export to excel functionality.
         *
         * Example of returned value: $filter=((OrgId%20eq%20%2730015950%27)%20and%20(BegDate%20eq%20datetime%272016-05-15T23%3a00%3a00%27%20and%20EndDate%20eq%20datetime%272016-05-22T22%3a59%3a59%27))
         *
         * @public
         *
         * @param {array} aFilters Array of sap.ui.model.Filter 
         * @param {sap.ui.model.odata.ODataModel} oModel The model
         * @param {sap.ui.model.odata.v2.ODataListBinding} sPath The path used to build the filter
         *
         * @returns {string} The filter variable ready to append to the URL as a new variable
         *
         */
        _getFilterString: function(aFilters, oModel, sPath) {
            var oEntity = oModel.oMetadata._getEntityTypeByPath(sPath),
                sFilter = sap.ui.model.odata.ODataUtils.createFilterParams(aFilters, oModel.oMetadata, oEntity);

            return sFilter;
        }

    });

});
